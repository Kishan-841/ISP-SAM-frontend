# SAM — Frontend

Service Assurance Manager (SAM) governance + compliance dashboard. Standalone
Next.js 16 app that talks to the SAM backend (separate repo).

Pairs with: **sam-backend** (Express + Prisma + Postgres), deployed on the
Gazon ISP VM.

## Tech

- Next.js 16 (App Router) + React 19
- Tailwind 4 + shadcn/ui
- Vitest + Testing Library

## Local development

```bash
pnpm install
cp .env.example .env.local      # adjust BACKEND_URL if your backend isn't on :5500
pnpm dev                         # listens on http://localhost:3500
```

Frontend dev server runs on **port 3500** (configured in `package.json`)
because the local CRM occupies port 3000. The SAM backend runs on **port
5500** locally for the same reason (the CRM backend is on 5000).

## Tests

```bash
pnpm test            # one-off
pnpm test:watch      # watch mode (if added)
```

## Deployment — Vercel

This app deploys cleanly on Vercel without a Dockerfile.

1. Import this repository in the Vercel dashboard.
2. Set environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_API_BASE=/api`
   - `BACKEND_URL=https://<your-sam-backend-host>`  (e.g. `https://sam.gazonindia.com`)
3. Deploy. Vercel auto-detects Next.js, runs `pnpm build`, and ships.

`next.config.ts` rewrites `/api/*` requests to `BACKEND_URL/*`, so the
backend can stay on its own subdomain without CORS gymnastics — the browser
only ever sees same-origin requests.

## Project structure

```
app/                    Next.js routes (App Router)
  existing-base/        Existing Base dashboard (Two-Kitty: BASE)
  new-base/             New Base dashboard (Two-Kitty: NEW)
  customers/            Customer list + filters
  commercial-change/    Commercial-change form (with hard-gate approval upload)
  meetings/             Meetings list + MOM editor
  leaderboard/          SAM Reliability Index leaderboard
  integrations/         Inbound webhook event log (admin only)
  ...
components/             Shared UI (StatCard, DataTable, dialogs, ...)
services/               Typed API clients for the backend
lib/                    Date + rupee formatters, env, utilities
```
