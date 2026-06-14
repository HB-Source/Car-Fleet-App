# 🚐 FleetPilot — Mobile Fleet Management

A premium, mobile-first fleet management platform: a **React** SPA backed by a **Node.js + Express + MongoDB** REST API with JWT authentication and role-based access (Admin / Driver). The frontend deploys automatically to GitHub Pages; the backend is host-agnostic (Docker + env vars).

> **Live demo:** https://hb-source.github.io/Car-Fleet-App/ — runs in **demo mode** (local sample data) until a backend URL is configured.

## ✨ Features

- **Fleet Dashboard** — vehicle cards with name, plate, status, driver, mileage, location and last update; live search, status filter chips, sorting, pull-to-refresh, loading skeletons, empty states and error handling.
- **Vehicle Detail** — full management page with identifiers, GPS coordinates, maintenance notes and a **change history timeline**. Role-aware: admins edit everything and assign drivers; drivers edit operational fields on their own vehicle only.
- **QR Onboarding** — scan a vehicle's QR sticker with the device camera (html5-qrcode) or type the code manually; matching vehicles are activated with an animated confirmation.
- **Live Map** — OpenStreetMap via React Leaflet with status-colored markers, clustering and rich popups. Dark-mode tiles included.
- **Authentication & Roles** — email/password registration and login; **Admin** (full fleet + user management) and **Driver** (operate own vehicles) roles enforced on the server.
- **Team management** — admins create users, promote/demote roles and deactivate accounts.
- **Settings** — signed-in account card with logout, dark/light mode, fleet stats and backend status.
- **Realtime-ish** — the dashboard polls every 15s and refreshes when the tab regains focus.
- **Demo mode** — with no backend configured, the app runs on a local sample dataset (persisted in `localStorage`) so the deployed preview always works.

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router (HashRouter), lucide-react |
| Maps | React Leaflet + OpenStreetMap + marker clustering |
| QR | html5-qrcode |
| Backend | Node.js, Express 5, TypeScript, Mongoose 8 |
| Database | MongoDB |
| Auth | JWT (Bearer), bcrypt |
| Validation | zod |
| Tests | Vitest + Testing Library (frontend), Vitest + supertest + mongodb-memory-server (backend) |
| CI/CD | GitHub Actions → GitHub Pages (frontend) |

## 📁 Repository Layout

```
Car-Fleet-App/
├── src/                  # React frontend (deployed to GitHub Pages)
├── server/               # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── models/       # Mongoose schemas: User, Vehicle, VehicleHistory
│   │   ├── routes/       # auth, users, vehicles, health
│   │   ├── services/     # business logic
│   │   ├── middleware/   # authenticate, requireRole, validate, errors, rate limit
│   │   ├── schemas/      # zod request validation
│   │   └── seed/         # admin + demo drivers + 6 demo vehicles
│   ├── Dockerfile
│   └── docker-compose.yml
└── .github/workflows/deploy.yml
```

## 🚀 Local Development

### 1. Backend

```bash
cd server
cp .env.example .env          # adjust MONGODB_URI / JWT_SECRET as needed
npm install

# Option A — run against a local MongoDB via Docker (api + mongo):
docker compose up

# Option B — run the API against an ephemeral in-memory MongoDB
# (no Docker/Atlas needed; data is reset on restart, auto-seeded):
npm run dev:memory

# Option C — point at your own MongoDB and run the dev server:
npm run dev
npm run seed                  # create the admin + demo data (once)
```

The API serves on `http://localhost:4000`. Health check: `GET /api/health`.
Default seeded admin: `admin@fleetpilot.demo` / `ChangeMe123!` (override via env).

### 2. Frontend

```bash
# from the repository root
cp .env.example .env          # set VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

Leave `VITE_API_URL` unset to run the frontend in **demo mode** (no backend).

### Quality checks

```bash
# frontend (repo root)
npm run lint && npm test && npm run build
# backend (server/)
cd server && npm run lint && npm test && npm run build
```

## 🔐 Authentication

FleetPilot uses **email-OTP login with optional TOTP MFA**:

1. **Register** with name + email + password → a 6-digit code is emailed (via Resend).
2. **Verify email** with the code → email is confirmed and you're signed in (the verification doubles as the first login).
3. **Subsequent logins**: email + password → a fresh 6-digit login code is emailed → enter it to sign in.
4. **Optional MFA**: enable an authenticator app (Google/Microsoft Authenticator, Authy, 1Password) from Settings. When enabled, login requires the email OTP **and** a TOTP code (or a single-use backup code).

Tokens: a short-lived **access token (15m)** plus a **refresh token (7d)**, stored in `localStorage` and sent as `Authorization: Bearer <token>`. The client transparently refreshes expired access tokens. OTP and backup codes are bcrypt-hashed at rest; accounts lock for 15 min after 5 failed password attempts; login/OTP endpoints are rate-limited.

### Auth endpoints

Auth responses use the envelope `{ success, data, message }`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | create account, email a verification code |
| POST | `/auth/login` | public | password check → email an OTP (or prompt email verification) |
| POST | `/auth/send-email-otp` | public | resend the current code (cooldown enforced) |
| POST | `/auth/verify-email-otp` | public | verify the emailed code → tokens, or an MFA challenge |
| POST | `/auth/mfa/setup` | authed | start TOTP setup → otpauth URL, QR image, backup codes |
| POST | `/auth/mfa/verify` | authed (setup) / challenge (login) | enable MFA, or complete an MFA login |
| POST | `/auth/mfa/disable` | authed | disable MFA (password confirmation) |
| POST | `/auth/refresh` | public | exchange a refresh token for new tokens |
| POST | `/auth/logout` | public | client discards tokens |
| GET | `/auth/me` | authed | current user |

### Fleet endpoints

Under `/api`. List endpoints return `{ data: [...], meta: { page, limit, total } }`. All require a verified, MFA-satisfied session (`Authorization: Bearer <access token>`).

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | public | service + DB status |
| GET / POST | `/users` | admin | list / create users |
| GET / PATCH / DELETE | `/users/:id` | admin (self may edit own name/password) | manage a user (delete = soft-deactivate) |
| GET | `/vehicles` | authed | list (`?status&active&q&page&limit`) |
| POST | `/vehicles` | admin / manager | register a vehicle |
| GET | `/vehicles/:id` | authed | vehicle detail |
| PATCH | `/vehicles/:id` | admin / manager (all) · driver (own, operational fields) | update; logs status/mileage history |
| DELETE | `/vehicles/:id` | admin / manager | delete a vehicle |
| POST | `/vehicles/onboard` | authed | `{ qr_code_id }` → activate matching vehicle |
| GET | `/vehicles/:id/history` | authed | status/mileage change timeline |

## 🗄️ Data Model

**vehicles** (Mongoose) — JSON shape consumed by the frontend:

```json
{
  "id": "665f...",
  "vehicle_name": "Ford Transit",
  "plate_number": "AB-123-CD",
  "status": "available",          // available | in_use | maintenance | offline
  "driver": "Eva Janssen",        // display name of assigned driver, or "Unassigned"
  "assigned_driver_id": "664a...",
  "mileage": 45200,
  "location_id": "ams-central",
  "latitude": 52.3676,
  "longitude": 4.9041,
  "qr_code_id": "QR-VEHICLE-001",
  "maintenance_notes": null,
  "registration_date": "2022-03-15",
  "active": true,
  "last_updated": "2026-06-10T12:00:00Z"
}
```

**users**: `name`, `email` (unique), `passwordHash`, `role` (`admin`|`manager`|`driver`|`viewer`), `active`, `emailVerified`, email-OTP fields (`emailOtpHash`, `emailOtpExpiresAt`, `emailOtpAttempts`, `emailOtpLastSentAt`), lockout fields (`failedLoginAttempts`, `accountLockedUntil`), MFA fields (`mfaEnabled`, `mfaSecret`, `mfaBackupCodesHash`), `lastLoginAt`. Sensitive fields are never selected by default and never returned to the client.
**vehicle_history**: per-change record of `status`/`mileage` with the actor and timestamp.

## ☁️ Setting up MongoDB (Atlas free tier)

1. Create a free account at [cloud.mongodb.com](https://cloud.mongodb.com) → **Build a Database** → **M0 Free** (512 MB). Pick a region near your backend host.
2. **Database Access** → add a database user (username + strong password, "Read and write to any database").
3. **Network Access** → **Add IP Address** → `0.0.0.0/0` (allow from anywhere). Required because managed hosts use dynamic egress IPs; security rests on the credentialed user + TLS.
4. **Connect → Drivers** → copy the connection string and add the database name:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/fleetpilot?retryWrites=true&w=majority
   ```
   URL-encode the password if it contains special characters. This is your `MONGODB_URI`.

## 🌐 Hosting the Backend

The API is host-agnostic (plain Node, plus a `Dockerfile`). A **Render Blueprint** ([`render.yaml`](render.yaml)) is included for one-click deploys.

### Deploy to Render (recommended)

1. In Atlas → **Network Access**, add `0.0.0.0/0` (Render's egress IPs are dynamic).
2. Render dashboard → **New → Blueprint** → connect this repo. Render reads `render.yaml` and creates the `fleetpilot-api` web service (root directory `server/`, health check `/api/health`).
3. When prompted, fill in the env vars that aren't auto-generated:
   - `MONGODB_URI` — your Atlas string, **including the db name**, e.g. `mongodb+srv://USER:PASS@car-fleet.lhhsc7g.mongodb.net/fleetpilot?retryWrites=true&w=majority&appName=Car-Fleet`
   - `RESEND_API_KEY` — from [resend.com](https://resend.com) (API Keys). Without it, OTP codes are written to the Render logs instead of emailed — fine for testing, not for real users. Also set `EMAIL_FROM` to a verified sender on your Resend domain.
   - `SEED_ADMIN_PASSWORD` and `SEED_DRIVER_PASSWORD` — choose strong values
   - (`JWT_SECRET`/`JWT_REFRESH_SECRET` are generated by Render; `CORS_ORIGINS` defaults to the GitHub Pages origin.)
4. Deploy. On first boot, `SEED_ON_START=true` seeds a verified admin + demo fleet automatically (idempotent — safe on every restart). Your API is live at `https://fleetpilot-api.onrender.com` (health: `/api/health`). The seeded admin is pre-verified, so it can log in with just the email OTP.
5. Point the frontend at it: set the repository **variable** `VITE_API_URL` to your Render URL and re-run the Pages workflow.

> Free Render web services sleep after ~15 min idle (30–60s cold start on the next request). Upgrade the plan or add an uptime pinger to keep it warm.

### Other hosts

| Host | Cost | Notes |
|---|---|---|
| **Railway** | ~$5/mo usage | Great DX, no sleeping, auto-deploy from GitHub (root dir `server/`). |
| **Fly.io** | Pay-as-you-go | Docker-first (`server/Dockerfile`), regions worldwide, static IPs available. |

**Required server env vars** (see `server/.env.example`): `MONGODB_URI`, `JWT_SECRET` + `JWT_REFRESH_SECRET` (long random strings — `openssl rand -hex 32`), `CORS_ORIGINS` (e.g. `https://hb-source.github.io`), `RESEND_API_KEY` + `EMAIL_FROM` (for real OTP email), and the `SEED_*` values. Optional: `JWT_EXPIRES_IN` (default `15m`), `JWT_REFRESH_EXPIRES_IN` (`7d`), `BCRYPT_SALT_ROUNDS` (`12`), `MFA_ISSUER` (`FleetPilot`), `CLIENT_URL`. If you don't use `SEED_ON_START`, run `npm run seed` once (host shell, or locally pointed at Atlas) to create the admin and demo data.

## 📦 Frontend Deployment (GitHub Actions → GitHub Pages)

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`:

1. **backend** job: `npm ci`, lint, test (with in-memory MongoDB), build — gates the deploy.
2. **frontend-deploy** job: `npm ci`, lint, test, build, then publishes `dist/` to the `gh-pages` branch (which auto-enables GitHub Pages). The live URL is printed in the run summary.

**Connect the deployed frontend to your API:** add a repository **variable** (Settings → Secrets and variables → Actions → *Variables*) named `VITE_API_URL` set to your backend URL (e.g. `https://your-service.onrender.com`), then re-run the workflow. Without it, the deployed app stays in demo mode.

> CORS works out of the box because the API allowlists the GitHub Pages origin (`CORS_ORIGINS`) and auth uses a Bearer header rather than cookies.

## 🔐 Roles at a Glance

- **Admin** — full access: CRUD on vehicles, assign drivers, manage users (create/promote/deactivate).
- **Manager** — manage the fleet (create / update / delete vehicles, assign drivers).
- **Driver** — read all vehicles (needed for the map); update only **their own** assigned vehicle, and only operational fields (status, mileage, location, coordinates, maintenance notes).
- **Viewer** — read-only access to the fleet.

Public registration always creates drivers; elevated roles are assigned by an admin (Settings → Team). The roles enum is wired end-to-end, so granular per-role policies can be tightened further as needed.

> **Future-ready:** the OTP layer is email-only by design. Phone/SMS OTP can be added later without reworking the flow — it would slot in as an additional delivery channel alongside the existing email service. SMS/Twilio is intentionally **not** implemented in this version.
