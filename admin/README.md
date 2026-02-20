# Reeviw Admin

Next.js App Router admin panel for reeviw-directory CMS.

## Stack
- Next.js + TypeScript
- TailwindCSS + shadcn-style UI components
- Better Auth client
- RBAC route + UI gating using `/api/me`

## Env
Create `.env` from `.env.example`.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
```

## Run with Docker Compose
From repo root:

```bash
docker compose up --build
```

Services:
- Backend: `http://localhost:3002`
- Admin: `http://localhost:3001/admin/login`

## Local Admin Dev

```bash
cd admin
npm install
npm run dev
```

## Auth flow
- Login page: `/admin/login`
- Better Auth calls are made via admin proxy route `/admin/api/[...path]` -> `${NEXT_PUBLIC_API_BASE_URL}/api/*`
- Protected pages redirect unauthenticated users to login.
- Missing permissions redirect to `/admin/forbidden`.

## Implemented sections
- Dashboard
- Posts (list/new/edit/publish)
- Tools (list/new/edit/publish)
- Categories
- Comparisons
- Reviews moderation
- Affiliates programs/links
- Users & RBAC (MVP; ready for backend endpoints)

Note: If some backend endpoints are not present yet (e.g. users/roles mappings), UI remains compatible and isolated in `src/lib/cms-api.ts` for quick API mapping updates.
