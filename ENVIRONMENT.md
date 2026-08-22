# Environment Notes (Agent-Runnable)

Everything an agent (or a fresh human contributor) needs to install, run, and
verify the ImmoFacile monorepo using only project files.

## Toolchain

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ (developed on 22.x) | `node -v` |
| npm | 9+ (10.x tested) | `npm -v` |
| Git | any recent version | repo remote: GitHub over SSH |

No other system dependencies are required. SQLite is embedded via the
`sqlite3` npm package (no separate database server).

## Three-Package Layout

This is a three-package npm layout — **each package needs its own
`npm install`**:

| Package | Path | Role |
|---------|------|------|
| root | `/` | tooling (prettier, husky, lint-staged), aggregate scripts |
| server | `/server` | Express 4 API + SQLite + PDF/email services |
| client | `/client` | React 18 + Vite 7 SPA |

### Install flow (from repo root)

```bash
npm install                      # root: prettier/husky/lint-staged
cd server && npm install         # API server deps
cd ../client && npm install      # SPA deps
```

Or in one line: `npm run install:all` (installs all three sequentially).

## Environment Variables

The server reads configuration from `server/.env` (copy from
`server/.env.example`). Required/known variables:

| Variable | Example | Purpose |
|----------|---------|---------|
| `PORT` | `5001` | API server port |
| `NODE_ENV` | `development` | `development` / `production` |
| `DB_PATH` | `./database/rentReceipts.db` | SQLite database file location |
| `RECEIPTS_DIR` | `./receipts` | generated rent-receipt PDFs directory |
| `CORS_ORIGIN` | `http://localhost:3000` | allowed browser origin |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP host for sending receipts |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_SECURE` | `false` | TLS on connect (use `true` for 465) |
| `EMAIL_USER` | `your-email@gmail.com` | SMTP account |
| `EMAIL_PASSWORD` | app password | SMTP password/app-password |
| `SERVER_URL` | `http://localhost:5001` | public base URL used in email-open tracking pixels |
| `REMINDERS_ENABLED` | `true` | enable the reminder scheduler |
| `REMINDER_SCHEDULE` | `0 9 * * *` | cron expression for reminder runs |
| `TZ` | `Europe/Paris` | timezone for scheduler |

Without SMTP credentials the app still runs; only email sending fails.

The client uses `VITE_API_URL` (defaults to relative `/api` in production via
`client/.env.production`; dev proxies to the server port).

## Run Commands

| Command (from repo root) | What it does |
|--------------------------|--------------|
| `npm run dev:server` | Express API with nodemon reload (port 5001) |
| `npm run dev:client` | Vite dev server for the SPA (port 5173, proxies `/api`) |
| `npm run build` | production build of the client into `client/dist/` |
| `npm start --prefix server` | start the API without nodemon |
| `npm run build:prod` | build client then start server serving it |

Server default port is **5001** (`PORT` in `server/.env`); the client dev
proxy targets that port.

## Verification Commands

```bash
# Aggregate quality gate (format + lint client/server + build):
npm run ci:check

# Individually:
npm run format:check             # prettier check across client+server
npm run lint                     # eslint for client and server
npm run build                    # vite production build

# Tests:
cd server && npm test            # ⚠ RED until Task 0.1 (#12) installs jest
```

**Current status:** there is no runnable test suite yet — the server declares
jest scripts but jest is not installed, and the client has no test runner.
Installing test infrastructure is tracked by issues #12/#13 (Milestone M0 of
[MODERNIZATION_PLAN.md](./MODERNIZATION_PLAN.md)).

CI runs the same checks via GitHub Actions (`.github/workflows/ci.yml`).

## Common Gotchas

- **Forgot one of the three installs?** Symptom: `Cannot find module`
  when running root-level scripts or either sub-app.
- **Port mismatch:** if you change `PORT`, update the client dev proxy target
  (`client/vite.config.js`) accordingly.
- **husky hooks** are installed via the root `prepare` script; they run
  lint-staged on commit. Use `git commit --no-verify` only when intentional.
