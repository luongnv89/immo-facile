# Environment Notes (Agent-Runnable)

Everything an agent (or a fresh human contributor) needs to install, run, and
verify the ImmoFacile monorepo using only project files.

## Toolchain

| Tool    | Version                 | Notes                        |
| ------- | ----------------------- | ---------------------------- |
| Node.js | ≥22.12 (per `engines`)  | `node -v`                    |
| npm     | ≥10                     | `npm -v`                     |
| Git     | any recent version      | repo remote: GitHub over SSH |

No other system dependencies are required. SQLite is embedded via the
`sqlite3` npm package (no separate database server).

## Three-Package Layout

This is a three-package npm layout — **each package needs its own
`npm install`**:

| Package | Path      | Role                                                      |
| ------- | --------- | --------------------------------------------------------- |
| root    | `/`       | tooling (prettier, husky, lint-staged), aggregate scripts |
| server  | `/server` | Express 5 API + SQLite + PDF/email services               |
| client  | `/client` | React 19 + Vite 8 SPA                                     |

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

| Variable            | Example                      | Purpose                                            |
| ------------------- | ---------------------------- | -------------------------------------------------- |
| `PORT`              | `5001`                       | API server port                                    |
| `NODE_ENV`          | `development`                | `development` / `production`                       |
| `DB_PATH`           | `./database/rentReceipts.db` | SQLite database file location                      |
| `RECEIPTS_DIR`      | `./receipts`                 | generated rent-receipt PDFs directory              |
| `CORS_ORIGIN`       | `http://localhost:3000`      | allowed browser origin                             |
| `JWT_SECRET`        | long random string           | JWT signing secret; required in production         |
| `ADMIN_USERNAME`    | `admin`                      | seeded default admin username (first run)          |
| `ADMIN_PASSWORD`    | `changeme123`                | seeded default admin password — change it          |
| `EMAIL_HOST`        | `smtp.gmail.com`             | SMTP host for sending receipts                     |
| `EMAIL_PORT`        | `587`                        | SMTP port                                          |
| `EMAIL_SECURE`      | `false`                      | TLS on connect (use `true` for 465)                |
| `EMAIL_USER`        | `your-email@gmail.com`       | SMTP account                                       |
| `EMAIL_PASSWORD`    | app password                 | SMTP password/app-password                         |
| `SERVER_URL`        | `http://localhost:5001`      | public base URL used in email-open tracking pixels |
| `REMINDERS_ENABLED` | `true`                       | enable the reminder scheduler                      |
| `REMINDER_SCHEDULE` | `0 9 * * *`                  | cron expression for reminder runs                  |
| `TZ`                | `Europe/Paris`               | timezone for scheduler                             |

Optional extras: `TRACKING_PEPPER` (pepper for SHA-256-hashed IPs stored by
email tracking, defaults to a fixed value) and `LANDLORD_NAME` /
`LANDLORD_ADDRESS1` / `LANDLORD_ADDRESS2` / `LANDLORD_SIGNATURE` (override the
landlord identity printed on quittances). All localhost origins
(`http://localhost:*`) are always CORS-allowed for development.

Without SMTP credentials the app still runs; only email sending fails.

The client resolves the API base as `import.meta.env.VITE_API_URL ||
'http://localhost:5001/api'` (see `client/src/services/api.js`).
`VITE_API_URL` is set to relative `/api` for production builds via
`client/.env.production`; in development there is no Vite proxy — the client
calls `http://localhost:5001/api` directly, so the server must be running on
that port (or you must set `VITE_API_URL`).

## Run Commands

| Command (from repo root)    | What it does                                       |
| --------------------------- | -------------------------------------------------- |
| `npm run dev:server`        | Express API with nodemon reload (port 5001)        |
| `npm run dev:client`        | Vite dev server for the SPA (port 5173)            |
| `npm run build`             | production build of the client into `client/dist/` |
| `npm start --prefix server` | start the API without nodemon                      |
| `npm run build:prod`        | build client then start server serving it          |

Server default port is **5001** (`PORT` in `server/.env`). The client dev
server calls the API directly at `http://localhost:5001/api` (no proxy).

## Verification Commands

```bash
# Aggregate quality gate (format + lint client/server + tests + build):
npm run ci:check

# Individually:
npm run format:check             # prettier check across client+server
npm run lint                     # eslint for client and server
npm run build                    # vite production build

# Tests:
npm test                         # client (vitest) then server (jest + coverage)
cd server && npm test            # jest suite alone
```

**Current status:** test suites are installed and green (server: jest,
client: vitest). Measured server coverage (2026-08-23); a binding
`coverageThreshold` ratchet lands with Task 5.6 (#48):

| Suite                            | Statements | Branches | Functions | Lines |
| -------------------------------- | ---------: | -------: | --------: | ----: |
| server (`cd server && npm test`) |     54.72% |   42.48% |    57.85% | 54.69% |
| client                           |      green — 2 suites / 11 tests     |

CI runs the same checks via GitHub Actions (`.github/workflows/ci.yml`).

## Common Gotchas

- **Forgot one of the three installs?** Symptom: `Cannot find module`
  when running root-level scripts or either sub-app.
- **Port mismatch:** the client expects the API on `http://localhost:5001/api`
  in dev. If you change `PORT`, also set `VITE_API_URL` for the client.
- **husky hooks** are installed via the root `prepare` script; they run
  lint-staged on commit. Use `git commit --no-verify` only when intentional.
