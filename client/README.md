# Easy Learn — Client

React 19 + Vite frontend for **Easy Learn**, a gamified learning platform for children with dyslexia. See the [root README](../README.md) for the full project overview, API reference, environment setup, and architecture.

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
```

Requires `client/.env` with `VITE_FIREBASE_API_KEY` and `VITE_API_BASE_URL` — see [Environment Variables](../README.md#environment-variables) in the root README.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Structure

Routing, state, and feature code live under `src/` — see [Project Structure](../README.md#project-structure) in the root README for the full breakdown of `components/`, `pages/`, `store/`, `context/`, and `i18n/`.

## Notable Setup Details

- **State**: Redux Toolkit (`src/store/`) — one slice per module/subject combo plus a `dashboard` slice.
- **i18n**: `i18next` loads translations from `public/locales/{lang}/translation.json` at runtime — see [Internationalization](../README.md#internationalization-i18n).
- **Auth**: `context/AuthContext.jsx` (students) and `context/AdminAuthContext.jsx` (admin/teacher/super-admin) — see [Roles & Authentication](../README.md#roles--authentication).
- **HTTPS dev server**: `@vitejs/plugin-basic-ssl` is available if you need local HTTPS (e.g. for microphone access in the Speak module on browsers that require a secure context).
