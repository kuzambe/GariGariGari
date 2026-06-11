---
name: Gari web-app conventions
description: Durable gotchas for working in artifacts/web-app (Gari car app)
---

# Gari web-app (artifacts/web-app)

## Duplicate dashboard file casing
- There is a stale lowercase `src/pages/dashboard.tsx` AND the active `src/pages/Dashboard.tsx`. Only `Dashboard.tsx` is real — never edit the lowercase one.
- This produces a permanent TS1261 casing error in `App.tsx` that is one of 5 known/accepted pre-existing typecheck errors (others: App.tsx JSX namespace, AddDocumentSheet onError ×2, DocumentScanner onError). A clean run shows exactly these 5.
- Filter typecheck noise: `pnpm --filter @workspace/web-app run typecheck` then `rg "error TS" | rg -v "in the program because|Imported via|Matched by include|tsconfig.json'"`.

## Design tokens (Rajdhani redesign)
- Font: `'Rajdhani', sans-serif`, body weight 600, headings 700.
- Palette: interactive/green `#1F6B2E`, border `#D4DDD5` (1.5px), text `#0D1C0E`, muted `#6B7C6D`, error `#C0392B`.
- Stroke icons live in `src/components/ui/icons.tsx` (no emoji anywhere in UI).

## Vehicle personalization
- Color is stored in existing `paint_name`/`paint_code` columns (no schema change). Preset palette: `src/lib/paintColors.ts` (`PAINT_OPTIONS`, `paintByName`).
- Guest personalization (nickname/paint/license_plate/mileage) lives in `src/lib/guestSession.ts` (localStorage `gari_guest_session`); `updateGuestSession(patch)` merges fields; carried to the account on signup via `transferGuest` in `WelcomeFlow.tsx`.
- Empty nickname falls back to `Your <Model>` / `Your Car` (`guestDisplayName`).
- `VehicleContext.refetch` re-reads the guest session for unauthenticated users, so updating guest session + refetch updates the UI without auth.

## Guest VIN flow gotcha (testing)
- On the guest results page the "Personalize" card sits directly above the green "Save your garage / CREATE ACCOUNT" CTA. In e2e tests, "click elsewhere to blur" can hit that CTA and navigate to signup — blur via Tab key instead. The input `onBlur` itself never navigates.
