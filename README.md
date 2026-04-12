# Bargainly Deals

Full-stack Bargainly Deals platform with a Fastify + Drizzle backend and a Next.js admin app.

## Quick Start (Docker)

```bash
docker compose up --build
```

In another terminal, run migrations and seed data **only when new migrations exist** (not on every restart):

```bash
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

Drizzle tracks applied migrations, so you should pick up where you left off on restarts without re-running migrations.

Services:
- Backend API: `http://localhost:3002`
- Swagger UI: `http://localhost:3002/docs` (enabled when `ENABLE_SWAGGER=true` and not in production)
- Admin UI: `http://localhost:3003/admin/login`

Default admin credentials are created by the seed script using:
- Email: `SUPERADMIN_EMAILS` (defaults to `admin@bargainlydeals.com`)
- Password: `SUPERADMIN_BOOTSTRAP_PASSWORD` (defaults to `ChangeMe26!`)

## Local Dev (No Docker)

1. Start Postgres locally and create a database (e.g. `bargainly-deals`).
2. Configure env files:

Backend `backend/.env` from `backend/.env.example`:

```bash
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bargainly-deals
BETTER_AUTH_SECRET=replace-with-long-random-secret
BETTER_AUTH_URL=http://localhost:3002
SUPERADMIN_EMAILS=admin@bargainlydeals.com
ENABLE_SWAGGER=true
```

Admin `admin/.env` from `admin/.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
```

3. Install dependencies and run:

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

```bash
cd admin
npm install
npm run dev
```

Admin dev server prefers `http://localhost:3003/admin/login` and automatically falls forward to the next open port if `3003` is already in use.

## Useful Scripts

Backend:
- `npm run dev` - start API server (tsx watch)
- `npm run db:migrate` - apply migrations
- `npm run db:generate` - generate migrations from schema changes (Drizzle)
- `npx drizzle-kit studio` - launch Drizzle Studio (uses `DATABASE_URL`)
- `npm run db:seed` - seed roles/users/permissions
- `npm run jobs:daily` - run background jobs

Admin:
- `npm run dev` - start Next.js dev server
- `npm run build` - production build

## Affiliate Sync (AWIN)

- Configure affiliate programs in the admin UI at `/affiliate-programs`.
- Trigger manual syncs from the UI or via `POST /api/jobs/awin` (cron-friendly).
- Each program respects `sync_frequency_hours`, so recent syncs are skipped automatically.
- Feed URLs are stored server-side and only masked values are returned to the UI.

## Amazon CSV Import

- Upload CSV exports in the admin UI at `/amazon/import`.
- CSV rows are normalized and upserted immediately (no background worker).
- Requires `AMAZON_ASSOCIATE_TAG` in the backend environment.
