#!/usr/bin/env bash
set -e
# ImmoFacile — one-click LAN deploy (works on Linux, macOS, WSL)
# Usage: ./start.sh            # uses PORT from server/.env or 8080
#        PORT=3000 ./start.sh   # override port
#        ./start.sh --foreground  # run in foreground

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
FOREGROUND=""
PORT="${PORT:-}"

# parse flags
for a in "$@"; do
  case "$a" in
    --foreground|--fg) FOREGROUND=1 ;;
    --help|-h) echo "Usage: ./start.sh [--foreground]"; exit 0 ;;
  esac
done

# PORT: CLI > server/.env > default 8080
if [ -z "$PORT" ] && [ -f "$ROOT/server/.env" ]; then
  PORT="$(grep -E '^PORT=' "$ROOT/server/.env" | cut -d= -f2 | tr -d ' ' | head -n1)"
fi
PORT="${PORT:-8080}"

# LAN IP (portable: Linux ip/hostname, macOS ipconfig/ifconfig, WSL)
get_lan_ip() {
  local ip=""
  if command -v ip >/dev/null 2>&1; then
    ip=$(ip route get 1.1.1.1 2>/dev/null | sed -n 's/.*src \([0-9.]*\).*/\1/p' | head -n1)
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}' 2>/dev/null || true)
  fi
  if [ -z "$ip" ] && command -v ipconfig >/dev/null 2>&1; then
    ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
  fi
  if [ -z "$ip" ] && command -v ifconfig >/dev/null 2>&1; then
    ip=$(ifconfig 2>/dev/null | sed -n 's/.*inet \([0-9][0-9.]*\) netmask.*/\1/p' | grep -v '127\.0\.0\.1' | head -n1)
  fi
  echo "$ip"
}
LAN_IP=$(get_lan_ip)
[ -z "$LAN_IP" ] && LAN_IP="localhost"

# ensure server/.env exists (from example if needed)
if [ ! -f "$ROOT/server/.env" ]; then
  if [ -f "$ROOT/server/.env.example" ]; then cp "$ROOT/server/.env.example" "$ROOT/server/.env"; else touch "$ROOT/server/.env"; fi
fi
# set PORT, NODE_ENV, CORS_ORIGIN
if ! grep -q "^PORT=" "$ROOT/server/.env" 2>/dev/null; then echo "PORT=$PORT" >> "$ROOT/server/.env"; else sed -i.bak "s/^PORT=.*/PORT=$PORT/" "$ROOT/server/.env" 2>/dev/null || sed -i "s/^PORT=.*/PORT=$PORT/" "$ROOT/server/.env"; fi
if ! grep -q "^NODE_ENV=" "$ROOT/server/.env"; then echo "NODE_ENV=production" >> "$ROOT/server/.env"; else sed -i.bak "s/^NODE_ENV=.*/NODE_ENV=production/" "$ROOT/server/.env" 2>/dev/null || sed -i "s/^NODE_ENV=.*/NODE_ENV=production/" "$ROOT/server/.env"; fi
if ! grep -q "^CORS_ORIGIN=" "$ROOT/server/.env"; then echo "CORS_ORIGIN=http://$LAN_IP:$PORT" >> "$ROOT/server/.env"; else sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://$LAN_IP:$PORT|" "$ROOT/server/.env" 2>/dev/null || sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://$LAN_IP:$PORT|" "$ROOT/server/.env"; fi
# JWT_SECRET — generate if missing or placeholder
if ! grep -q "^JWT_SECRET=" "$ROOT/server/.env" || grep -q "change-me" "$ROOT/server/.env"; then
  SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || echo "secret-$(date +%s)")
  if grep -q "^JWT_SECRET=" "$ROOT/server/.env"; then sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" "$ROOT/server/.env" 2>/dev/null || sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" "$ROOT/server/.env"; else echo "JWT_SECRET=$SECRET" >> "$ROOT/server/.env"; fi
fi
rm -f "$ROOT/server/.env.bak"
[ -L "$ROOT/.env" ] || [ -e "$ROOT/.env" ] || ln -sf server/.env "$ROOT/.env" 2>/dev/null || true

# install deps if missing
if [ ! -d "$ROOT/server/node_modules" ] || [ ! -d "$ROOT/client/node_modules" ]; then
  echo "→ Installing dependencies..."
  npm run install:all
fi

# build client if missing
if [ ! -f "$ROOT/client/dist/index.html" ]; then
  echo "→ Building client..."
  npm run build
fi

# free port if busy (best effort)
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
  [ -n "$PIDS" ] && echo "→ Freeing port $PORT..." && echo "$PIDS" | xargs kill -15 2>/dev/null || true; sleep 1
elif command -v fuser >/dev/null 2>&1; then
  fuser -k "$PORT/tcp" 2>/dev/null || true; sleep 1
fi

echo "→ Starting on port $PORT (LAN: http://$LAN_IP:$PORT)..."
# Run from server/ so cwd-relative env paths (DB_PATH, RECEIPTS_DIR) resolve
# like `npm run start:prod` does.
cd "$ROOT/server"
if [ -n "$FOREGROUND" ]; then
  NODE_ENV=production PORT="$PORT" node index.js
else
  LOG="$ROOT/server.log"
  NODE_ENV=production PORT="$PORT" nohup node index.js > "$LOG" 2>&1 &
  PID=$!
  echo "  PID $PID, log: $LOG"
  # Health probe: curl preferred, wget fallback; absent both → warn, skip.
  health_probe() {
    if command -v curl >/dev/null 2>&1; then
      curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1
    else
      wget -q -O /dev/null "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1
    fi
  }
  if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    echo "  ⚠ neither curl nor wget found — health check skipped"
    echo "  Server may still be starting; watch $LOG"
  else
    HEALTHY=""
    for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
      if health_probe; then HEALTHY=1; break; fi
      if ! kill -0 "$PID" 2>/dev/null; then echo "  ✗ failed, check $LOG"; tail -n 20 "$LOG"; exit 1; fi
      sleep 1
    done
    if [ -n "$HEALTHY" ]; then
      echo "  ✓ http://localhost:$PORT and http://$LAN_IP:$PORT ready"
    else
      echo "  ✗ server alive (PID $PID) but /api/health never answered — last log lines:"
      tail -n 20 "$LOG"
      exit 1
    fi
  fi
  echo "  Open on another device: http://$LAN_IP:$PORT (same Wi-Fi)"
  echo "  If blocked: sudo ufw allow $PORT/tcp  (Linux)  or  allow in Firewall settings"
fi
