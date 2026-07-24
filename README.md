# Project Transparency PH

Interactive map for monitoring Philippine government infrastructure projects.
Initial coverage: Cagayan de Oro. Architecture designed for nationwide scale.

## Stack

- **Web**: React + TypeScript + Vite + Tailwind + React Router + React Query + MapLibre GL
- **API**: Node + Express + TypeScript
- **Database**: PostgreSQL + PostGIS, via Prisma

## Project structure

```
apps/
  api/     Express API (controllers -> services -> repositories -> Prisma)
  web/     React frontend
packages/
  shared-types/   Zod schemas + inferred types shared by web and api
```

## Local setup

1. **Start the database**

   ```bash
   cp .env.example .env
   npm run docker:up
   ```

   This starts a Postgres 16 + PostGIS 3.4 container on `localhost:5432`.

2. **Configure each app**

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

   Edit `apps/api/.env` and replace `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
   with real random values (e.g. `openssl rand -hex 32`).

3. **Install dependencies** (from the repo root — npm workspaces installs
   every app/package's dependencies in one pass)

   ```bash
   npm install
   ```

4. **Run the apps**

   ```bash
   npm run dev:api   # http://localhost:4000
   npm run dev:web   # http://localhost:5173
   ```

5. **Verify the API is up**

   ```bash
   curl http://localhost:4000/api/v1/health
   ```

## Database setup

The full domain schema lives in `apps/api/prisma/schema.prisma` (geography
hierarchy, agencies, contractors, projects, updates, images, documents,
citizen reports, users, bookmarks, notifications, audit logs).

After starting the database (`npm run docker:up`) and configuring
`apps/api/.env`:

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

This schema has been validated by hand-translating it to SQL and applying it
against a real Postgres 16 + PostGIS 3.4 instance, including inserting a
project with a real geometry point and running an `ST_DWithin` proximity
query against it successfully. Running `prisma migrate dev` yourself will
generate the actual migration file from this same schema.

## Project API

`GET    /api/v1/projects`            list, with filters (status, category,
                                      agencyId, contractorId, regionId,
                                      cityId, barangayId, minBudget,
                                      maxBudget, minProgress, maxProgress,
                                      completionYear, search, bbox), sorting,
                                      and pagination.
`GET    /api/v1/projects/:idOrSlug`  fetch one project by id or slug.
`POST   /api/v1/projects`            create (validates barangay/agency/
                                      contractor/consultant exist first).
`PATCH  /api/v1/projects/:idOrSlug`  partial update.
`DELETE /api/v1/projects/:idOrSlug`  soft delete.

Request/response validation schemas live in `packages/shared-types` and are
imported by the API directly; the web app will import the same schemas in
Phase 3.

Run the service-layer unit tests (repository fully mocked, no DB needed):

```bash
cd apps/api
npx vitest run
```

## Status

Phase 0 complete: monorepo scaffold, tooling, local Postgres+PostGIS, env
validation.
Phase 1 complete: full Prisma schema (geography, orgs, projects, citizen
reports, users, audit log), spatially validated against real PostGIS.
Phase 2 complete: Project API (repository/service/controller/routes),
Zod schemas in shared-types, unit tests passing. Every repository SQL
query (create, filtered list, get-by-id-or-slug, partial update including
geometry, soft delete) was individually validated against a real
Postgres+PostGIS instance. Phase 3 (map frontend) is next.
