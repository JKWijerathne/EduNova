# EduNova Frontend

EduNova's web client uses React 19, Vite 8, and Tailwind CSS 4.

## Requirements

- Node.js 20.19+
- npm 11+
- The Spring Cloud API gateway running on port 8080 for backend requests

## Local setup

From the repository root:

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Vite serves the frontend at `http://localhost:5173` by default.

## API configuration

The shared Axios client prefixes requests with `/api` by default. During development, Vite proxies `/api` to `http://localhost:8080`, matching the Spring Cloud gateway routes. API calls should use paths relative to that prefix, such as `/auth/login` or `/courses`.

Set `VITE_API_BASE_URL` to change the browser-facing API base URL. Set `API_PROXY_TARGET` in `.env.local` to point the development proxy at a different gateway. Values prefixed with `VITE_` are exposed to browser code; keep secrets out of them.

## Styling

Tailwind CSS 4 is enabled through the Vite plugin. The global stylesheet imports Tailwind, so utility classes can be used directly in JSX without a separate Tailwind configuration file.

## Quality checks

```powershell
npm run lint
npm run build
npm run preview
```
