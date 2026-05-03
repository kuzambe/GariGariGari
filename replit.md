# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### `artifacts/web-app` — React + Vite Frontend
- **Preview path**: `/`
- **Auth**: Supabase Auth (email/password)
- **Supabase**: `@supabase/supabase-js` client at `src/lib/supabase.ts`
- **Auth context**: `src/context/AuthContext.tsx` — provides `session`, `user`, `loading`, `signOut`
- **Preferences context**: `src/context/PreferencesContext.tsx` — provides `darkMode`/`setDarkMode`, `distanceUnit`/`setDistanceUnit`; persisted in localStorage; sets `data-gari-dark` attribute on `<html>` for CSS variable switching
- **Pages**:
  - `/auth` — Sign in / Sign up tabs
  - `/dashboard` — Protected overview page with stats cards
  - `/profile` — Account info, change password
  - `/settings` — Auth details, sign out, danger zone
- **Layout**: `src/components/layout/AppShell.tsx` — sticky header with nav + user dropdown
- **Theme**: Clean light/dark CSS vars in `src/index.css` (blue primary, neutral grays)

### `artifacts/api-server` — Express API Server
- **Preview path**: `/api`
- **Routes**:
  - `GET /api/healthz` — health check
  - `POST /api/cargpt` — CarGPT AI chat endpoint (uses Gemini 2.5 Flash via `GEMINI_API_KEY`). Accepts `{ vehicleContext, userMessage, history }`, builds a vehicle-aware system prompt, calls Gemini, returns `{ text }`

## Environment Variables / Secrets

- `VITE_SUPABASE_URL` — Supabase project URL (injected into Vite frontend)
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key (injected into Vite frontend)
- `SESSION_SECRET` — Express session secret

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
