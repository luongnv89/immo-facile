#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=$(grep -E '^PORT=' "$ROOT/server/.env" 2>/dev/null | cut -d= -f2 | tr -d ' ' | head -n1)
PORT="${PORT:-8080}"
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
  [ -z "$PIDS" ] && echo "No process on port $PORT" && exit 0
  echo "Stopping $PIDS on port $PORT..."; echo "$PIDS" | xargs kill -15 2>/dev/null || true; sleep 1
  PIDS2=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
  [ -n "$PIDS2" ] && echo "$PIDS2" | xargs kill -9 2>/dev/null || true
  echo "Stopped."
elif command -v fuser >/dev/null 2>&1; then
  fuser -k "$PORT/tcp" 2>/dev/null && echo "Stopped port $PORT" || echo "No process on port $PORT"
else
  echo "Install lsof or fuser to stop automatically, or: kill \$(ps aux | grep '[n]ode server/index.js' | awk '{print \$2}')"
fi
