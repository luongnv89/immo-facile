<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# ImmoFacile — Project Context

## Critical Commands

```bash
npm run install:all     # three packages: root, client/, server/ — EACH needs its own install
npm run ci:check        # full gate: prettier format:check + eslint (client+server) + tests + vite build
npm run format:check    # prettier on client/**/*.{js,jsx} and server/**/*.js only (no markdown)
npm run lint            # eslint for client and server
npm run build           # vite production build -> client/dist/
cd server && npm test   # jest unit suite (client suite runs with vitest)
```

## Architecture Map

- `client/` — React 19 + Vite 8 SPA (Redux Toolkit slices in `src/store/slices`, API service in `src/services/api.js`, URL-routed hash tabs, French UI)
- `server/` — Express 5 + SQLite (`sqlite3`): `index.js` entry, `src/{config,controllers,routes,services,models,middleware,database}`; JWT auth in `src/middleware/auth.js`
- `server/database/rentReceipts.db` — SQLite file DB; `server/receipts/` — generated PDFs (never commit either)
- Full environment/toolchain notes: @ENVIRONMENT.md · coding standards: @AGENTS.md

## Hard Rules

- IMPORTANT: never commit `.env*`, `*.db`, or generated receipts.
- IMPORTANT: UI language is **French** — dates `DD/MM/YYYY`, currency `1 234,56 €`.
- API base is `http://localhost:5001/api` in dev (client calls it directly — there is NO vite proxy); change requires setting `VITE_API_URL`.
- Conventional commits with issue ref: `feat(scope): description (#N)`.
- Parameterized SQL queries only; never log secrets/personal data.
- Keep files ≤300 lines; reuse existing Redux slices/API patterns before adding new ones.

## Workflow Preferences

- Verify with `npm run ci:check` after changes; run affected tests when they exist.
- Minimal diffs for small fixes; don't refactor beyond task scope.
- Branches: `<type>/<issue>-<short-desc>` (e.g. `fix/17-path-traversal`).

## Token Efficiency
- Never re-read files you just wrote or edited. You know the contents.
- Never re-run commands to "verify" unless the outcome was uncertain.
- Don't echo back large blocks of code or file contents unless asked.
- Batch related edits into single operations. Don't make 5 edits when 1 handles it.
- Skip confirmations like "I'll continue..." Just do it.
- If a task needs 1 tool call, don't use 3. Plan before acting.
- Do not summarize what you just did unless the result is ambiguous or you need additional input.
