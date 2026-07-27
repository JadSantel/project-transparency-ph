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

## Auth API

`POST /api/v1/auth/register`  create an account, returns the user plus an
                               access + refresh token pair.
`POST /api/v1/auth/login`     verify email/password, same token pair.
`POST /api/v1/auth/refresh`   exchange a refresh token for a new access
                               token (refresh token itself is not rotated
                               - see the Auth section below for why).
`GET  /api/v1/auth/me`        the logged-in user, requires
                               `Authorization: Bearer <accessToken>`.

## Project API

`GET    /api/v1/projects`            list, with filters (status, category,
                                      agencyId, contractorId, regionId,
                                      cityId, barangayId, minBudget,
                                      maxBudget, minProgress, maxProgress,
                                      completionYear, search, bbox), sorting,
                                      and pagination.
`GET    /api/v1/projects/:idOrSlug`  fetch one project by id or slug.
`GET    /api/v1/projects/:idOrSlug/updates`
                                      a project's update timeline
                                      (paginated, newest first), 404s if
                                      the project itself doesn't exist.
`GET    /api/v1/projects/:idOrSlug/reports`
                                      a project's APPROVED citizen reports
                                      (paginated, newest first, public -
                                      no auth required). 404s if the
                                      project doesn't exist.
`POST   /api/v1/projects/:idOrSlug/reports`
                                      submit a citizen report. Requires
                                      `Authorization: Bearer <accessToken>`.
                                      Always lands as PENDING - see
                                      "Citizen reports (Phase 9)" below.
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

## Map frontend (Phase 3)

`apps/web` now renders a live MapLibre GL map of Cagayan de Oro:

- `GET /projects` is fetched via React Query, scoped to the current map
  viewport using the API's `bbox` filter — panning/zooming refetches only
  what's on screen, not every project nationwide.
- Pins cluster natively (MapLibre's built-in Supercluster-based clustering)
  and split apart as you zoom in; clicking a cluster zooms to expand it.
- Individual pins are colored by `ProjectStatus`; `src/lib/statusColors.ts`
  is the single source of truth for that mapping, shared by the map layer
  and the on-map legend so they can't drift apart.
- Clicking a pin opens a popup with the project's name, status, budget, and
  progress, with a "View details" link to `/projects/:idOrSlug` (a stub —
  the real Project Details Page is a later phase).

Basemap: set `VITE_MAPTILER_KEY` in `apps/web/.env` for the art-directed
style; without a key the app falls back to OpenFreeMap's free, keyless
"Liberty" style so the map is never blank in a fresh clone.

Not yet built (intentionally out of scope this phase): the real project
detail page, and code-splitting the MapLibre bundle (it currently ships in
the main chunk — Vite's build flags this as large; noted for a later
cleanup pass, not a blocker).

## Filters (Phase 4)

Status and category filtering happen entirely client-side on the
already-fetched viewport data, not as extra API query params — the API's
`status`/`category` filters only accept a single value each, which can't
express "show ONGOING and DELAYED at once." Toggling a filter is therefore
instant, no refetch:

- The status legend doubles as the status filter — click a row to hide
  that status; `src/lib/statusColors.ts` still backs both the map's pin
  colors and the legend/filter, so the two can't drift.
- A separate category dropdown (top-right) covers category, since
  category has no on-map visual of its own to double as a legend.
- `src/lib/filterProjects.ts` holds the actual filter logic as a pure
  function, kept out of `MapView` so it's easy to unit test on its own.
- Both selections default to "everything on" — a first-time visitor sees
  every project, not an empty map.

Filter state is synced to the URL as of Phase 6 (see below) — a filtered
view is a shareable link.

## URL-sync filters (Phase 6)

Filter state (`activeStatuses`/`activeCategories`) now lives in the URL's
`?status=` and `?category=` query params instead of local component state:

- `src/hooks/useProjectFilters.ts` reads/writes via React Router's
  `useSearchParams` — the URL *is* the state, not a mirror of it, so there's
  one source of truth instead of two things that could drift.
- `src/lib/urlFilters.ts` holds the pure encode/decode logic. A param is
  **omitted** when a dimension is "everything on" (the default), so a
  fresh, unfiltered visit stays a clean `/` instead of always spelling out
  every status/category. An explicit `none` sentinel handles "the user
  selected zero values" (e.g. `?status=none`), since an empty-string param
  would be indistinguishable from a missing/malformed one.
- Toggling a filter updates the URL with `{ replace: true }`, not a new
  history entry — otherwise every single legend/dropdown click would need
  its own back-button press to undo.
- `MapPage.tsx` required **no changes**: `useProjectFilters`'s public
  return shape (`activeStatuses`, `activeCategories`, `toggleStatus`,
  `toggleCategory`, `clearAll`, `isFiltered`) is unchanged, only its
  internal backing store moved from `useState` to the URL.

Example: `/?status=DELAYED` is now a shareable "just delayed projects"
link, matching the nice-to-have flagged in the Phase 4 section above.

## Web auth UI (Phase 8)

`apps/web` now actually calls the Phase 7 auth API — login, register, and
a signed-in state, wired through the map:

- `src/context/AuthContext.tsx` — `AuthProvider`/`useAuth()`. On app load,
  it silently tries to turn a stored refresh token back into a session
  (calls `POST /auth/refresh` then `GET /auth/me`) before rendering any
  "you're signed out" UI, so a returning visitor doesn't see a flash of
  "Sign in" before their session is restored.
- `src/lib/authToken.ts` — the access token lives in a plain
  module-level variable, not React state or localStorage.
  `apiClient.ts`'s `apiRequest` is a plain function used inside React
  Query `queryFn`s, not a component, so it can't call `useContext`
  itself; this lets it attach `Authorization: Bearer <token>` on every
  request without the token being threaded through every hook's
  arguments.
- **Storage split, worth calling out directly:** the access token is
  memory-only (gone on refresh, by design — it's short-lived anyway).
  The refresh token persists in `localStorage`, since this app has no
  httpOnly-cookie endpoint yet (Phase 7 returns tokens in the JSON body).
  That's a real, deliberate trade-off, not an oversight — a future phase
  moving refresh to an httpOnly cookie would close the localStorage/XSS
  exposure window; noted here rather than silently accepted.
- `src/pages/LoginPage.tsx` / `RegisterPage.tsx` — plain controlled forms
  (no React Query mutations; a one-shot form submit doesn't need
  query-caching machinery), redirect to `/` on success.
- `src/components/AccountMenu.tsx` — top-right on the map, just left of
  `CategoryFilter` so the two don't overlap; shows "Sign in" or the
  user's name + "Sign out" depending on `useAuth()`.
- Logging out is client-side only (clears the local tokens) — same
  reason as Phase 7's refresh-token note: there's no server-side session
  to revoke against yet.

Not yet built: nothing in `apps/web` actually requires being signed in
yet (no protected UI exists) — this phase is the plumbing citizen
reports (the next candidate phase) will attach to.

## Auth (Phase 7)

JWT-based email/password auth, built ahead of citizen reports since
`CitizenReport.userId` is a required field and there was nothing to
attribute a report to yet:

- `src/repositories/user.repository.ts` uses the **plain Prisma client**
  (`prisma.user.findFirst`/`create`), not raw SQL — `User` has no
  PostGIS/geometry field, so it doesn't need the workaround
  `project.repository.ts` uses. Same convention already established by
  the geography lookups at the bottom of that file.
- `src/lib/password.ts` / `src/lib/jwt.ts` wrap bcrypt (12 salt rounds)
  and `jsonwebtoken` respectively — thin, so `auth.service.ts` stays
  readable and these are trivially swappable later.
- `src/services/auth.service.ts` — `register`, `login`, `refresh`,
  `getMe`. Login returns the identical "Invalid email or password" for
  both "no such account" and "wrong password," so the endpoint can't be
  used to enumerate registered emails.
- `src/middlewares/authenticate.ts` — verifies a `Bearer` access token
  and sets `req.user`. This is the middleware future protected routes
  (citizen report submission, bookmarks) will sit behind, the same way
  `validate` sits in front of request bodies. `GET /auth/me` exists
  mainly to exercise this end-to-end.
- **Scope simplification, called out deliberately, not an oversight:**
  refresh tokens are stateless JWTs, not rows in a database. The schema
  has no `RefreshToken`/`Session` model, so there's nothing to revoke a
  token against — `POST /auth/refresh` verifies the signature/expiry and
  issues a new access token, but does not rotate the refresh token. A
  real revocation list is a candidate for its own later phase if this
  ever needs "log out this device remotely."
- Google OAuth (the other half of "Auth" in the original stack notes) is
  still not built — this phase is email/password only.
- `src/services/auth.service.test.ts` — new unit tests (repository/
  password/jwt all mocked, no DB needed), 9 cases covering register
  conflict, login failure paths, token issuance, and refresh failure
  paths. All 15 tests in the suite (this file + the existing
  `project.service.test.ts`) pass via `npx vitest run`.

Not yet built: the web app has no login/register UI or auth context yet
(`apps/web` doesn't call any of this). That's the natural next slice once
citizen reports actually needs a logged-in user to submit through.

## Project details page (Phase 5)

`/projects/:idOrSlug` (linked from the map popup's "View details") is now
a real page instead of a stub:

- `src/hooks/useProject.ts` fetches the full `ProjectDetail` shape (adds
  description, funding source, and the raw geography/org id fields on top
  of the map's lighter `ProjectListItem`) from the existing
  `GET /projects/:idOrSlug` endpoint — no API change needed for this part.
- `src/hooks/useProjectUpdates.ts` fetches the project's update timeline
  from a **new** endpoint, `GET /projects/:idOrSlug/updates`, added this
  phase (`ProjectUpdate` already existed in the Prisma schema since Phase 1
  but had no route/service/repository method exposing it until now — same
  repository → service → controller → route layering as the rest of the
  API, and a new `projectUpdateTypeSchema` / `projectUpdatesQuerySchema`
  in `shared-types`).
- `src/lib/format.ts` is new: `formatBudget` was promoted out of
  `ProjectPopup.tsx` (Phase 3) so the popup and the detail page format
  money identically instead of maintaining two copies; `formatDate` is new
  alongside it.
- Loading / 404 / generic-error states are handled explicitly rather than
  assuming the fetch always succeeds — a 404 (bad slug) reads differently
  from a network/server error.

Not yet built: editing an update, and citizen-submitted reports tied to a
project (`CitizenReport` also already exists in the schema) — out of scope
for this phase, flagged as candidates for a later one.

## Citizen reports (Phase 9)

Residents can flag a discrepancy between a project's official record and
what's actually happening on the ground - independent of the project's own
pin, since a citizen reports from wherever they're actually standing.

**API:**
- `src/repositories/citizen-report.repository.ts` (new): raw SQL via
  `Prisma.sql`, same reasoning as `project.repository.ts` - `CitizenReport`
  has its own PostGIS `location` column, so (unlike `user.repository.ts`)
  the plain Prisma client isn't an option here. `findApprovedByProjectId`
  filters `status = 'APPROVED' AND deleted_at IS NULL` in the SQL itself,
  not just in the service layer, so there's no code path that could
  accidentally list an unmoderated report. `create` always inserts with
  the schema's `PENDING` default; `location` is nullable (`ST_SetSRID(...)`
  only when both latitude/longitude are present, `NULL` otherwise) since a
  citizen who denies location permission can still submit a report.
- `src/services/citizen-report.service.ts` (new): resolves `idOrSlug` ->
  project first (404 if missing), same pattern as `getProjectUpdates`.
  `submitReport` takes `userId` from `req.user` (set by `authenticate`),
  never from the request body.
- `src/controllers/citizen-report.controller.ts` /
  `src/routes/citizen-report.routes.ts` (new): mounted as a nested router
  at `/projects/:idOrSlug/reports` (`Router({ mergeParams: true })`, same
  nesting approach as `/:idOrSlug/updates`). `GET` is public; `POST` sits
  behind `authenticate`.
- `citizenReport.schemas.ts` + `CitizenReportCategory` /
  `CitizenReportStatus` in `enums.ts` (new, `packages/shared-types`).
- `src/services/citizen-report.service.test.ts` (new, 4 tests): repository
  fully mocked. All 19 tests across the API now pass
  (`npx vitest run` from `apps/api`).

**Product decisions, checked in on before writing code:**
- A signed-out visitor sees an inline "Sign in to report an issue" prompt
  on the project page rather than being redirected away from it.
- Newly-submitted reports do **not** appear on the project page - they
  stay PENDING until a moderator approves them. There's no moderation
  UI/endpoint yet (flagged as a follow-up phase); a submitted report only
  gets a local "thanks, awaiting review" confirmation on the web side,
  since there's nothing yet to refetch/show.
- The `GET` reports endpoint is public - this is a transparency tool, not
  a gated one - while `POST` still requires login so every report is
  attributable to a real account.

**Web:**
- `src/hooks/useProjectReports.ts` (new): fetches
  `GET /projects/:idOrSlug/reports` via React Query, same shape as
  `useProjectUpdates.ts`.
- `src/components/reports/ReportForm.tsx` (new): category select +
  optional comment. Captures the citizen's location via the browser
  Geolocation API on mount (falls back to submitting without one if
  denied/unavailable - matches the API's optional lat/lng). Deliberately
  **not** a React Query mutation, same reasoning as `LoginPage`/
  `RegisterPage` - a one-shot submit doesn't need query-caching, and
  since a new report is invisible until approved there's nothing to
  invalidate/refetch on success anyway; the confirmation is just local
  component state. Renders the inline sign-in prompt instead of the form
  when `useAuth().user` is null.
- `src/components/reports/ReportsList.tsx` (new): renders the approved
  reports list, same loading/error/empty-state shape as `ProjectUpdate`'s
  `UpdatesTimeline`.
- `src/lib/citizenReportLabels.ts` (new): category display labels, same
  "fail loudly in dev if the enum grows and this table doesn't" pattern as
  `categoryLabels.ts`.
- `pages/ProjectDetailPage.tsx` updated: new "Citizen reports" section
  below the update timeline, rendering `ReportsList` then `ReportForm`.

Not yet built: a moderation queue/UI for approving or rejecting PENDING
reports (the schema and status enum already support it - `moderatedById`,
`moderatedAt` - just no endpoint or screen yet). A citizen also can't yet
see their own PENDING submissions anywhere; that's a reasonable follow-up
once basic moderation exists.

## Status

Phase 0 complete: monorepo scaffold, tooling, local Postgres+PostGIS, env
validation.
Phase 1 complete: full Prisma schema (geography, orgs, projects, citizen
reports, users, audit log), spatially validated against real PostGIS.
Phase 2 complete: Project API (repository/service/controller/routes),
Zod schemas in shared-types, unit tests passing. Every repository SQL
query (create, filtered list, get-by-id-or-slug, partial update including
geometry, soft delete) was individually validated against a real
Postgres+PostGIS instance.
Phase 3 complete: map frontend (see above).
Phase 4 complete: status/category filter UI (see above), client-side over
the existing bbox-fetched data. `npx tsc -b` and `npx vite build` both
pass clean in this sandbox after both Phase 3 and Phase 4.
Phase 5 complete: Project Details Page (see above), including a new
`GET /projects/:idOrSlug/updates` endpoint for the update timeline.
`npx tsc -b` and `npx vite build` pass clean for `apps/web` and
`packages/shared-types` in this sandbox. The new `apps/api` code
(repository/service/controller/route additions) was written by hand
against the existing Phase 2 layering and reviewed carefully, but could
**not** be type-checked or run in this sandbox (see the Phase 2
`binaries.prisma.sh` note below — the errors are confirmed pre-existing,
not introduced by Phase 5).
Phase 6 complete: URL-sync filters (see above) — the status/category
filter state is now stored in the URL query string via
`useSearchParams`, not local state. `npx tsc -b` and `npx vite build`
pass clean for `apps/web`. No API or shared-types changes this phase.
Phase 7 complete: JWT email/password auth (see above). `npx vitest run`
passes all 15 tests (9 new). `npx tsc -p packages/shared-types` is
clean. `apps/api`'s `tsc -b` still can't be meaningfully checked in this
sandbox — worth noting precisely why: `npm install`'s postinstall hook
does run `prisma generate` here, but since it can't reach
`binaries.prisma.sh` it silently falls back to writing a stub client
where `PrismaClient` is typed `any`. That means `tsc` reports zero
errors in the new `user.repository.ts` too, but that's not real
validation — an `any`-typed client can't catch a wrong field/table name.
The genuine check on the new auth logic is the vitest suite (the
repository itself is mocked out, so it doesn't depend on the stub at
all); the field names `user.repository.ts` selects (`email`,
`passwordHash`, `fullName`, `role`, `deletedAt`) were additionally
cross-checked by hand against `schema.prisma`'s `User` model.
Phase 8 complete: web login/register UI + `AuthContext` (see above),
wired to the Phase 7 API for the first time. `npx tsc -b` and
`npx vite build` pass clean for `apps/web`. No API or shared-types
changes this phase, so the same Prisma-stub caveat above is unaffected.
Not validated in this sandbox: an actual HTTP round-trip against a
running API. This is still the same environment limitation noted since
Phase 2 (`binaries.prisma.sh` returns 403 here, and this container also
has no `docker` binary, so there's no way to stand up a real Postgres
here regardless). Next, if the new session has real network access and
Docker: run
`npx prisma generate && npx prisma migrate dev --name init`, boot both
apps, and confirm the map, detail page, timeline, shareable filter
links, and register/login/refresh/me/logout all work against real data
end-to-end.
Phase 9 complete: citizen reports, API + web (see above). `npx vitest
run` passes all 19 tests (4 new) from `apps/api`. `npx tsc -p
packages/shared-types` and `npx tsc -b` + `npx vite build` for `apps/web`
all pass clean. `apps/api`'s `tsc -b` shows the same class of error as
`project.repository.ts` since Phase 2, now also in the new
`citizen-report.repository.ts` (`Prisma.sql`/`Prisma.join` untyped on the
sandbox's stub client) - confirmed not a new/different error type, and no
errors anywhere outside those two raw-SQL repository files. The real
validation for the new API logic is the vitest suite (repository mocked
out) plus a manual check of every raw-SQL column name against
`schema.prisma`'s `citizen_reports` table.
