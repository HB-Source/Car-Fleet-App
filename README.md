# 🚐 FleetPilot — Mobile Fleet Management

A premium, mobile-first React application for managing company vehicles. Built with React, Vite, TypeScript, Tailwind CSS, Supabase, React Leaflet (OpenStreetMap) and QR-code onboarding — deployed automatically to GitHub Pages via GitHub Actions.

## ✨ Features

- **Fleet Dashboard** — vehicle cards with name, plate, status, driver, mileage, location and last update; live search, status filter chips, sorting (latest / name / mileage), pull-to-refresh, loading skeletons, empty states and error handling.
- **Vehicle Detail** — full management page with registration data, identifiers, mileage, GPS coordinates and maintenance notes. All edits are saved back to Supabase.
- **QR Onboarding** — scan a vehicle's QR sticker with the device camera (html5-qrcode), or type the code manually. Matching vehicles are activated in the fleet with an animated confirmation.
- **Live Map** — OpenStreetMap via React Leaflet with status-colored markers, clustering, and rich popups (name, plate, status, driver, last update). Dark-mode map tiles included.
- **Settings / Admin** — dark/light mode toggle, fleet stats and backend connection status.
- **Realtime** — when connected to Supabase, the dashboard subscribes to `postgres_changes` and refreshes automatically.
- **Demo mode** — if no Supabase credentials are configured, the app runs on a local sample dataset (persisted in `localStorage`) so the deployed preview always works.

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 18, TypeScript, Tailwind CSS, lucide-react |
| Build | Vite |
| Routing | React Router (HashRouter for static hosting) |
| Backend | Supabase (Postgres + Realtime) |
| Maps | React Leaflet + OpenStreetMap + marker clustering |
| QR | html5-qrcode |
| Tests | Vitest + Testing Library |
| CI/CD | GitHub Actions → GitHub Pages |

## 🚀 Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure Supabase

Create a free project at [supabase.com](https://supabase.com), then:

1. Open the **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql) to create the `vehicles` table, indexes, RLS policies and realtime publication.
2. Run [`supabase/seed.sql`](supabase/seed.sql) to insert sample fleet data.
3. Copy your project URL and anon key from **Project Settings → API**.

Create a `.env` file (see [`.env.example`](.env.example)):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> No credentials? The app automatically falls back to **demo mode** with local sample data.

### 3. Run

```bash
npm run dev      # start dev server
npm run lint     # eslint
npm test         # vitest
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## 📦 Deployment (GitHub Actions → GitHub Pages)

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`: it installs dependencies, lints, tests, builds and publishes the production build to the `gh-pages` branch, then prints the **live deployment URL** in the workflow summary. GitHub Pages is enabled automatically when the `gh-pages` branch is first created — no manual repository setup is required (the repo just needs to be public, or on a plan that supports private Pages).

Optional setup — connect a live backend via **Settings → Secrets and variables → Actions**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without these secrets the deployed app runs in demo mode.

Push to `main` (or trigger **Build & Deploy** manually via *Actions → Run workflow*) and the app goes live at `https://<your-username>.github.io/<repo-name>/`.

## 🗄️ Database Schema

```sql
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_name text not null,
  plate_number text not null unique,
  status text not null default 'available'
    check (status in ('available', 'in_use', 'maintenance', 'offline')),
  driver text not null default 'Unassigned',
  mileage integer not null default 0,
  location_id text not null default '',
  latitude double precision,
  longitude double precision,
  qr_code_id text not null unique,
  maintenance_notes text,
  registration_date date,
  active boolean not null default true,
  last_updated timestamptz not null default now()
);
```

Example vehicle row:

```json
{
  "vehicle_name": "Ford Transit",
  "plate_number": "AB-123-CD",
  "status": "available",
  "driver": "Unassigned",
  "mileage": 45200,
  "location_id": "ams-central",
  "latitude": 52.3676,
  "longitude": 4.9041,
  "qr_code_id": "QR-VEHICLE-001",
  "last_updated": "2026-06-10T12:00:00Z"
}
```

> ⚠️ The included RLS policies allow anonymous read/write so the demo works with only the anon key. For production, integrate Supabase Auth and restrict the policies to authenticated users.

## 🔳 QR Onboarding

Each vehicle row stores a `qr_code_id` (e.g. `QR-VEHICLE-001`). Generate a QR code containing that exact string (any QR generator works) and stick it on the vehicle. Scanning it in the app:

1. Looks up the vehicle by `qr_code_id` in Supabase.
2. Marks it `active` (and flips `offline` → `available`).
3. Shows an animated success confirmation with a link to the vehicle page.

Try it in demo mode by typing `QR-VEHICLE-006` in the manual entry field — it onboards the offline Opel Vivaro.

## 📁 Project Structure

```
src/
├── api/vehicles.ts        # Supabase queries + demo-mode fallback + realtime
├── components/            # Reusable UI (cards, nav, skeletons, states…)
├── context/ThemeContext   # Dark / light mode
├── hooks/useVehicles.ts   # Fleet data hook with realtime refresh
├── lib/supabase.ts        # Supabase client
├── lib/demoData.ts        # Local demo dataset
├── pages/                 # Dashboard, VehicleDetail, QROnboarding, MapView, Settings
├── types/vehicle.ts       # Shared types
└── utils/                 # Formatting + filtering helpers
supabase/
├── schema.sql             # Table, indexes, RLS, realtime
└── seed.sql               # Sample fleet data
```
