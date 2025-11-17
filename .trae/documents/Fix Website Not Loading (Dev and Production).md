## What I Found
- `index.html` mounts at `#root` and loads `/src/main.tsx` — dev OK.
- `src/main.tsx` renders `<App />` into `#root` — OK.
- `vite.config.ts` proxies `/api` to `http://localhost:3001` and builds to `dist`.
- `package.json` `build:frontend` copies source files to `dist` without bundling. This will fail in production because browsers cannot execute TSX.
- Backend (`api/app.ts`) serves APIs only; no static file serving or SPA fallback.

## Plan
### 1) Diagnose Environment
- Confirm whether the issue is in dev (`http://127.0.0.1:5173`) or in a deployed build.
- If dev: check browser console for runtime errors, confirm Vite dev server is running, and ensure `/api` calls don’t crash initial render.

### 2) Fix Production Build
- Replace `build:frontend` with Vite’s bundling: `vite build`.
- Update `build` script to run `vite build` (and backend build as needed).
- Keep `vite.config.ts` as-is so it outputs optimized assets in `dist`.

### 3) Serve Static Assets + SPA Fallback
- In `api/app.ts`, add `express.static('dist')` to serve built assets.
- Add a catch-all `GET` handler to return `dist/index.html` for non-`/api` routes (SPA fallback) so React Router works in production.

### 4) Optional: Subpath Deployment
- If served under a subpath, set `vite.config.ts` `base` and `BrowserRouter` `basename` consistently.

### 5) Resilience Improvements
- Add a simple error boundary to avoid blank screens if an exception occurs.
- Ensure components guard against missing API responses so initial render never crashes.

### 6) Verify
- Build with `vite build` and run `vite preview` to confirm the site loads.
- Test key routes: `/`, `/clinic-login`, `/super-admin/login`.
- Check network requests: `/api` should target backend (`http://localhost:3001`) in dev; in prod, ensure the static host and API origin are correct.

If you approve, I’ll implement the script changes, add static serving + SPA fallback, and validate both dev and production flows.