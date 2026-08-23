# ImmoFacile — Client

React 19 + Vite 8 SPA for the ImmoFacile rental management platform. French UI,
URL-routed hash tabs (`#tenants`, `#apartments`, `#owner`, `#reminders`),
Redux Toolkit state, Tailwind CSS v4.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server on http://localhost:5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Vitest with coverage |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |
| `npm run lint:staged` | ESLint with `--fix` (used by lint-staged) |

## API connection

The API base URL resolves as:

- **Development:** `VITE_API_URL` if set, otherwise `http://localhost:5001/api`
  (the Vite dev server does **not** proxy — the API must be running on 5001).
- **Production:** relative `/api` via `.env.production` (same origin as the
  server serving `dist/`).

The JWT returned by `POST /api/auth/login` is stored in `localStorage`
(`immofacile_token`) and attached as a Bearer header to every request by the
axios interceptor in `src/services/api.js`; an expired/invalid token logs the
user out.

## Structure

```
src/
├── components/   # shared UI components
├── pages/        # tab pages (Tenants, Apartments, Owner, ReminderManagement, Login)
├── store/        # Redux store + slices
├── services/     # axios API service
├── hooks/        # custom hooks
├── i18n/         # French strings
└── utils/        # helpers (dates, currency formatting)
```
