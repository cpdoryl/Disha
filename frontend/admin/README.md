# Disha Admin Dashboard

Next.js 14 (App Router) + TypeScript + Tailwind CSS admin dashboard for Disha v2.0, backed by the NestJS API in `../../backend`.

## Getting Started

```bash
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
npm install
npm run dev
```

Runs on [http://localhost:3001](http://localhost:3001). The backend is expected on `http://localhost:3000`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test:unit` | Vitest + React Testing Library |
| `npm run test:coverage` | Vitest with coverage |
| `npm run analyze` | Production build with bundle analyzer |

## Architecture

- `src/app` — routes (App Router). `/login` is public; everything under `/dashboard` is guarded.
- `src/middleware.ts` — edge middleware that redirects unauthenticated requests away from `/dashboard/*` and authenticated requests away from `/login`, based on cookies (not the client store).
- `src/lib/http.ts` — shared Axios instance. Attaches the access token to every request and transparently refreshes it on a 401 via `/auth/refresh`, retrying the original request once.
- `src/lib/tokens.ts` — cookie-backed token/user storage (the backend has no server-set cookies, so the SPA owns this).
- `src/services/*.service.ts` — one module per backend controller (`auth`, `schools`, `students`, `assessments`, `reports`, `data`, `notifications`), matching the real `/api/v2/*` routes.
- `src/store/auth.store.ts` — Zustand store for the current user; hydrated from the `disha_user` cookie by `src/components/AuthHydrator.tsx` after mount (kept out of the store's initializer to avoid an SSR/client hydration mismatch).
- `src/lib/roles.ts` — maps each backend role (`ryl_admin`, `school_admin`, `teacher`, `student`, `parent`) to its dashboard route under `src/app/dashboard/*`.

## Status

Phase 1 (foundation, API client, authentication) is implemented. Role dashboards currently render placeholder stat cards — wiring them to real data is Phase 2+.
