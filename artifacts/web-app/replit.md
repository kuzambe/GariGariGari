# Gari — Car Management App

## Stack
- React + Vite + TypeScript
- Tailwind CSS v4
- Supabase (auth + database + storage) — DO NOT modify connection or env vars
- Wouter (routing)
- @tanstack/react-query

## Design System
- Background: #FAFAF8
- Text: #1A1A1A
- Accent (amber): #EF9F27
- Surface: #F0EFE9
- Muted: #888888
- Error: #E24B4A
- Success: #639922
- Fonts: Rajdhani Bold 700 (headings/labels), DM Sans 400/500 (body/inputs)
- Max width: 430px phone frame, #1A1A1A desktop surround
- No blue, no purple, no gradients, no sidebar, no bottom nav

## Supabase Tables (already exist — do not recreate)
- `vehicles` — id, user_id, nickname, vin, make, model, year, trim, engine, fuel_type, body_style, mileage, license_plate, country, mileage_unit, created_at
- `documents` — id, user_id, vehicle_id, type, file_url, created_at
- `expenses` — id, user_id, vehicle_id, type, amount, description, receipt_url, created_at
- Storage bucket: `vehicle-docs`

## File Structure
```
src/
├── App.tsx                    — routing, phone frame wrapper, context providers
├── context/
│   ├── AuthContext.tsx        — Supabase auth session
│   └── VehicleContext.tsx     — current user's vehicle
├── pages/
│   ├── AuthPage.tsx           — sign in / sign up
│   ├── VehicleSetup.tsx       — 3-step wizard (nickname → VIN → mileage/plate)
│   └── Dashboard.tsx          — main app (home / documents / finances sections)
├── components/
│   ├── layout/Header.tsx      — vehicle nickname + garage icon
│   ├── car/
│   │   ├── CarHero.tsx        — car silhouette with glow + ground shadow
│   │   └── CarSilhouette.tsx  — detailed sedan SVG (faces right, ~340×160px)
│   ├── documents/
│   │   ├── DocumentGrid.tsx   — 2-col grid of uploaded docs
│   │   └── UploadDocumentModal.tsx
│   ├── finance/
│   │   ├── ExpenseList.tsx    — list of expenses with total
│   │   └── AddExpenseModal.tsx
│   └── ui/
│       ├── GarageIcon.tsx     — brand SVG (garage door with 3 panel lines)
│       ├── AmberButton.tsx    — filled (#EF9F27) or outline button
│       ├── StatPill.tsx       — pill stat (value + label, #F0EFE9 bg)
│       ├── FeatureTile.tsx    — 2x2 grid tile with emoji icon
│       └── AlertStrip.tsx     — amber left-border alert with pulse dot
├── lib/
│   ├── supabase.ts            — Supabase client (URL-normalised) — DO NOT TOUCH
│   └── api/
│       ├── vehicles.ts        — getVehicleByUserId, createVehicle, updateVehicle
│       ├── documents.ts       — getDocumentsByVehicleId, uploadDocument, deleteDocument
│       └── expenses.ts        — getExpensesByVehicleId, addExpense, deleteExpense
```

## Routing
- `/` → redirect to `/dashboard` (logged in) or `/auth`
- `/auth` → sign in / sign up — redirects to `/dashboard` if session exists
- `/setup` → 3-step vehicle wizard — requires auth, redirects to `/dashboard` if vehicle exists
- `/dashboard` → main app — requires auth + vehicle, redirects to `/setup` if no vehicle

## Environment Variables (already set — do not modify)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
