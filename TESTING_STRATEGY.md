# Disha v2.0 - Testing Strategy

**Status:** COMPLETE | **Owner:** QA Lead | **Last Updated:** 2026-07-17
**Companion docs:** [TEST_CASES.md](./TEST_CASES.md) · [CODING_STANDARDS.md](./CODING_STANDARDS.md) § Testing Requirements · [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)

---

## 📋 Table of Contents

1. [Where This Stood Before This Pass](#where-this-stood-before-this-pass)
2. [Test Pyramid](#test-pyramid)
3. [Local Test Environment Setup](#local-test-environment-setup)
4. [Backend Integration Testing](#backend-integration-testing)
5. [Bugs Found and Fixed While Getting the Suite Green](#bugs-found-and-fixed-while-getting-the-suite-green)
6. [Frontend Testing](#frontend-testing)
7. [Load Testing](#load-testing)
8. [Coverage Targets](#coverage-targets)
9. [Regression Checklist](#regression-checklist)
10. [Acceptance Criteria](#acceptance-criteria)
11. [CI Integration](#ci-integration)

---

## Where This Stood Before This Pass

Before this work, "testing" in this codebase meant three integration spec
files that had **never successfully run**: `test/auth.integration.spec.ts`,
`test/rbac.integration.spec.ts`, `test/schools.integration.spec.ts`. They
failed to even compile (`import * as request from 'supertest'` is a
namespace import and isn't callable under this project's TS config), so no
one had seen these tests execute against a real database, and none of the
serious backend bugs they were written to catch had ever actually been
caught. There was no frontend test runner at all.

This pass got the full backend integration suite running for real, against
a real seeded PostgreSQL 16 instance, for the first time — **76/76 passing**
— and along the way found and fixed several genuine, previously-undetected
bugs (below). That's the real starting point for a testing strategy: not
"what should we test," but "the harness didn't work; now it does, here's
what it's already found."

---

## Test Pyramid

```
                    ┌─────────────────┐
                    │   Load Tests     │  wrk-based bash scripts
                    │  (scripts/*.sh)  │  against /health endpoints
                    └─────────────────┘
                  ┌─────────────────────┐
                  │  Integration Tests   │  Jest + Supertest, real Postgres
                  │  (backend/test/)     │  76 tests, 3 spec files
                  └─────────────────────┘
              ┌─────────────────────────────┐
              │        Unit Tests            │  Jest, colocated *.spec.ts
              │  (none exist yet — backend    │  (config supports this,
              │   or frontend)                │   nothing has been written)
              └─────────────────────────────┘
```

The pyramid is currently **inverted from the ideal** — there are 76
integration tests and zero unit tests, on both ends of the stack. That's
workable for now (integration tests catch more real bugs per test written,
which is exactly what happened here), but service-level unit tests are
still worth adding for pure-logic code (e.g. `GapPredictionService`'s
scoring math, `ReportingService`'s aggregation) where spinning up a full
Nest app + Postgres per test is overkill.

---

## Local Test Environment Setup

This is the exact, verified procedure — every step below was actually run
during this pass, not assumed:

```bash
# 1. Postgres must be running locally (or via docker-compose)
sudo service postgresql start        # or: docker-compose up -d postgres

# 2. Create the test role/database (first time only)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE disha_test_db;"

# 3. Backend: point the app at the test database
cd backend
cp .env.test .env.local

# 4. Run migrations, then seed
npm run migration:run
npm run seed:db

# 5. Run the integration suite
npx jest --verbose
```

`backend/.env.test` already ships with matching credentials
(`DB_NAME=disha_test_db`, `DB_USERNAME=postgres`, `DB_PASSWORD=postgres`) —
step 3 just promotes it to the `.env.local` that `ConfigModule` actually
loads (`envFilePath: ['.env.local', '.env']` in `app.module.ts`).

**`npm run seed:db` now creates a genuine platform-level `ryl_admin` account**
(`ryladmin@disha.local` / `rylAdmin123`, `schoolId: null`) in addition to
one `school_admin` + one `teacher` per seeded school. Previous seed data
only ever created `school_admin` users, which silently broke every
`ryl_admin`-only RBAC test (see below).

---

## Backend Integration Testing

Test files live in `backend/test/*.integration.spec.ts` and share
`backend/test/setup.ts` for app bootstrapping and reusable request helpers.
`setup.ts`'s `setupTestApp()` now mirrors production bootstrap more closely
than before — it applies both the global `ValidationPipe` **and**
`AllExceptionsFilter` (the filter was previously missing from the test
bootstrap entirely, which meant a fix made to error-mapping logic had zero
effect on test results until this was corrected).

Run everything:
```bash
cd backend
npx jest --verbose
```

Run a single file:
```bash
npx jest test/rbac.integration.spec.ts
```

Every spec logs into the app for real (`POST /api/v2/auth/login`) rather
than mocking auth, so these are true black-box integration tests exercising
the full guard chain, TypeORM, and Postgres.

---

## Bugs Found and Fixed While Getting the Suite Green

Documenting these here because they're exactly the kind of regression this
suite exists to catch going forward — if any of these come back, the
relevant test in `TEST_CASES.md` should fail immediately.

1. **`supertest` namespace import broke compilation.** `import * as request
   from 'supertest'` isn't callable under this project's TS settings; fixed
   to `import request from 'supertest'` in all three spec files and `setup.ts`.

2. **`test/setup.ts`'s helpers were fundamentally broken and unused.**
   `loginAndGetToken`/`authenticatedRequest` called `.get()`/`.post()`
   directly on the `INestApplication` instance — that's the NestJS DI
   container's `.get()` (resolve a provider), not an HTTP client. Both were
   dead code (nothing called them), which is exactly why this was never
   caught. Fixed to properly wrap with `request(testApp.getHttpServer())`.

3. **Migrations described a schema that no longer matched the entities.**
   `InitialSchema` + `AdditionalTables` create tables like `schools` with a
   `districtId uuid NOT NULL` FK and `students` with `email`/`phone`/
   `currentClass` columns — an older shape than the current entities
   (`schools.district` is free text, `students` has no email field at all,
   uses `enrollmentNumber`/`gradeLevel`/`classSection`). Several newer
   entities (`Staff`, `TeacherTraining`, `Admission`, `Complaint`,
   `DataRetentionPolicy`, `HealthReport`, `ParentNpsSurvey`, `Question`)
   had **no migration at all**. Running the existing migrations on a clean
   database produced a schema the application code couldn't actually use.
   Fixed by generating `1724056801500-ReconcileSchemaWithEntities.ts` via
   `typeorm migration:generate`, ordered to run before the (also broken)
   performance-index migration.
   **⚠️ This migration drops columns from the old schema shape** (safe
   here since the target database was empty; if any real environment was
   ever migrated with the old `InitialSchema`/`AdditionalTables` and has
   real data in those old columns, back it up and review the reconciliation
   migration's `DROP COLUMN` statements before applying it there.**
4. **`AddPerformanceIndexes` referenced columns/tables that never existed**
   as named: `audit_logs.action` (real: `actionType`), `audit_logs.createdAt`
   (real: `actionTimestamp`), `assessment_responses.submittedAt` (real:
   `submissionTimestamp`), `gap_predictions.assessmentId` (doesn't exist —
   gap predictions key off `challengeId`, not an assessment), `parent_communication`
   singular table name (real, plural: `parent_communications`),
   `counsellor_referrals.status` / `bullying_incidents.status` (real:
   `resolutionStatus` on both), `operational_data.category` /
   `.recordedDate` (real: `dataType` / `dataDate`). All corrected in both
   the `up()` and `down()` of that migration.
5. **`datasource.ts` pointed CLI tooling at compiled `dist/**/*.entity.js`**
   while `seed.ts` imports entities straight from TS source. Since
   `migration:run`/`seed:db` both execute via `ts-node`, TypeORM ended up
   with two different class references for the "same" entity and threw
   `EntityMetadataNotFoundError`. Fixed by pointing `datasource.ts` at TS
   source (`*.entity.{ts,js}`) directly, matching how it's actually invoked
   — no separate `npm run build` is needed before migrating/seeding anymore.
6. **`seed.ts` never set `Organization.type`** (a required enum column) —
   seeding failed on the very first insert. Fixed.
7. **No `ryl_admin` test user ever existed in seed data**, but
   `test/setup.ts`'s `TEST_USERS.rylAdmin` assumed one did (pointed at
   `admin1@school.edu`, which seed data actually creates as
   `school_admin`). Every "should allow ryl_admin to..." RBAC test failed
   — correctly, because the guard was rightly rejecting a school_admin
   token on a ryl_admin-only route. Fixed by seeding a genuine
   platform-level `ryl_admin` account and pointing the fixture at it.
8. **`AllExceptionsFilter` let raw Postgres driver errors reach clients as
   bare 500s** — e.g. a malformed UUID in a path param (`GET
   /api/v2/schools/invalid-id`) crashed with `QueryFailedError` instead of
   a clean `400`. Root cause: several controllers accept `@Body()`/params
   as `any` with no validation (tracked in `CODING_STANDARDS.md`), so bad
   input reaches Postgres raw. Added a Postgres-error-code → HTTP-status
   map (`22P02`→400, `23502`→400, `23503`→400, `23505`→409) to the filter
   as a last line of defense, without leaking raw DB error text to clients.
9. **`test/setup.ts` never actually installed `AllExceptionsFilter`**
   despite a comment claiming it applied "same middleware as production" —
   only the `ValidationPipe` was wired up. This meant bug #8's fix had zero
   effect on test results until this was also corrected.
10. **`RolesGuard` only read `@Roles()` metadata from the request handler
    (method), never the controller class** — a real, severe authorization
    bypass. `AuditController`, `WellbeingController`, `DataController`, and
    `NotificationController` all declare `@Roles(...)` once at the
    **class** level as a shortcut. Because `RolesGuard` used
    `reflector.get('roles', context.getHandler())` instead of checking both
    handler and class, it found no required roles for any route in those
    four controllers and let **any authenticated user through regardless
    of role** — a `student` or `parent` token could hit audit logs,
    wellbeing dashboards, and operational data endpoints meant to be
    restricted to `ryl_admin`/`school_admin`/`teacher`. Fixed by switching
    to `reflector.getAllAndOverride('roles', [handler, class])`, the
    standard NestJS pattern. **This was live in the codebase, not just a
    test artifact — audit this deployment's access logs if it has ever run
    against real traffic.**
11. **`POST /api/v2/students/:id/attendance` crashed with a 500** —
    `StudentService.recordAttendance` called `.getFullYear()` on
    `attendanceDate`, assuming it was already a `Date`, but the controller
    accepts an untyped body, so it arrives as a JSON string. Fixed by
    coercing to `Date` at the top of the method.
12. **Login response's `expiresIn` was wrong** — `parseInt(jwt.expiresIn)`
    where `jwt.expiresIn` is a human duration string like `"15m"` silently
    truncates to `15`, so a token that actually lasts 900 seconds reported
    itself as expiring in 15. Fixed by decoding the just-signed token and
    computing `exp - iat` instead of re-parsing the config string.
13. **`database.synchronize` was hardcoded to `true`** in
    `src/config/configuration.ts`, ignoring the `DB_SYNCHRONIZE` env var
    that `.env.example` already documents and defaults to `false`. This
    meant TypeORM silently auto-altered the live schema from entities on
    every app boot — in every environment, including a hypothetical
    production deploy — completely independent of the migration files.
    It's also *why* the schema drift in bug #3 never surfaced at runtime:
    the running app self-healed its own schema on every restart while
    `migration:run` (which always used `synchronize: false`) exposed the
    real, un-auto-fixed state. Fixed to read `DB_SYNCHRONIZE === 'true'`,
    defaulting to `false` so migrations are the actual source of truth
    everywhere except local dev with the flag explicitly set.
14. **`backend-ci.yml`'s test steps set `DATABASE_URL`, but the app only
    reads `DB_HOST`/`DB_PORT`/`DB_USERNAME`/`DB_PASSWORD`/`DB_NAME`**
    (confirmed in `configuration.ts` — there is no `DATABASE_URL` parsing
    anywhere). The Postgres service container CI already provisions was
    never actually reachable by the app in CI. The "Run integration tests"
    step had `continue-on-error: true`, so this failure was silently
    masked rather than surfaced. Fixed the env vars and added explicit
    `migration:run` + `seed:db` steps before the integration tests (the
    specs log in as seeded users — a migrated-but-empty database isn't
    enough), and removed `continue-on-error` now that the step can
    actually pass.
15. **`backend-ci.yml`'s "Run unit tests" step failed on every run** —
    `npm run test:unit` uses `--testPathPattern='unit'`, which matches none
    of the three existing `*.integration.spec.ts` files, and Jest exits 1
    on an empty match set by default. Unlike the integration step, this one
    had no `continue-on-error`. Fixed by adding `--passWithNoTests` to the
    `test:unit` script.
16. **`frontend-ci.yml` pointed every step at `working-directory:
    frontend/admin`**, a leftover directory that contained nothing but an
    orphaned `Dockerfile` — the real Next.js app (`package.json`, `app/`,
    `components/`, `lib/`) lives directly under `frontend/`. Combined with
    a path trigger scoped to `frontend/admin/**`, this pipeline effectively
    never ran against real code: `npm install` would fail immediately in a
    directory with no `package.json`. Fixed by repointing every step at
    `frontend/`, moving `frontend/admin/Dockerfile` to `frontend/Dockerfile`
    (its `COPY` paths are context-relative, not directory-specific, so this
    was a safe move), adding a `public/` directory (the Dockerfile's
    `COPY --from=builder /app/public ./public` had no source to copy from —
    the frontend never had a `public/` folder at all), and widening the
    trigger to `frontend/**`. **Caveat:** this Docker build step could not
    be verified end-to-end in this environment (no Docker daemon
    available) — the fix is inferred from reading the Dockerfile and
    directory layout, not from an actual `docker build` run. Everything
    else in this list was verified by actually running the command.
17. **`frontend-ci.yml`'s "Run linter" step would have hung or failed in
    CI** — no `.eslintrc` existed for the frontend at all (see
    `CODING_STANDARDS.md`), so `next lint` drops into an interactive setup
    wizard on first run, which has no sensible behavior in a non-interactive
    CI shell. Added `frontend/.eslintrc.json` extending
    `next/core-web-vitals`, which also surfaced two real lint errors
    (`react/no-unescaped-entities` — bare apostrophes in JSX text) that are
    now fixed. `next lint` exits clean (only pre-existing
    `react-hooks/exhaustive-deps` warnings remain, which are stylistic, not
    errors).

Two additional fixes were to the **tests themselves**, not the app:
`auth.integration.spec.ts` asserted against `GET /api/v2/schools`, a list
route that has never existed (`SchoolController` only exposes
`GET /api/v2/schools/:id` and friends) — the 404 those tests got was
correct routing behavior, not a security failure. Repointed at
`GET /api/v2/schools/:id` with a placeholder id, which still exercises
`JwtAuthGuard` without depending on a real school existing.

---

## Frontend Testing

**No test runner is configured.** `frontend/package.json` has no `test`
script and no Jest/Vitest/RTL dependency. `TECH_STACK.md`'s pending stack
section already commits to **Jest + React Testing Library** for this —
that decision is treated as made; what's missing is the actual setup
(`jest.config.js`, `jest.setup.ts` with RTL's `jest-dom` matchers, and a
`next/jest` config since this is a Next.js 14 App Router project).

Until that lands, the enforced quality bar on the frontend is:
- `npx tsc --noEmit` clean (strict mode — see `CODING_STANDARDS.md`)
- `npm run build` succeeds (`next build` also runs its own type/lint pass)

Both are cheap to run and were the only thing catching frontend bugs before
this pass added real API integration — see `ARCHITECTURE_GUIDE.md` for the
lib/api and lib/store layer this now depends on.

**Priority order once RTL is wired up:** `authStore.ts` (login/logout state
transitions — pure logic, no DOM needed, could even be a plain Jest unit
test), then a render-and-interact test per dashboard page mirroring the
loading/error/empty/populated states every page already implements
consistently (see `CODING_STANDARDS.md` § React/Next.js Frontend Patterns).

---

## Load Testing

**Correction to earlier docs:** `TECH_STACK.md` and `LOAD_TESTING.md`
describe the load testing tool as **Artillery, "already installed."**
That's not accurate — there is no Artillery config anywhere in the repo,
and it's not a dependency in either `package.json`. The actual scripts
(`scripts/load-test-baseline.sh`, `scripts/load-test-progressive.sh`) use
**`wrk`**, a separate CLI HTTP benchmarking tool that must be installed on
the machine running them (`apt-get install wrk` / `brew install wrk`) — the
scripts check for it and exit with instructions if it's missing.

These scripts target `/health` and a handful of read endpoints; they are
not part of `npx jest` and don't run in the integration suite. Treat
`LOAD_TEST_RESULTS.md` (still pending in `DOCUMENTATION_INVENTORY.md`) as
needing an actual `wrk` run against a running instance to produce real
numbers — don't carry forward any numbers implied elsewhere as if Artillery
produced them.

---

## Coverage Targets

- **Backend:** 70% line coverage on service logic (`npm run test:cov`),
  per `TECH_STACK.md`. Not currently measured against anything meaningful
  since the only tests are 3 integration spec files exercising a slice of
  the API surface — `npx jest --coverage` will report a real number once
  more unit tests exist, but today it mostly reflects "was this file ever
  imported during the 3 integration specs," not real logic coverage.
- **Frontend:** no target set yet — depends on the RTL setup landing first.

---

## Regression Checklist

Before merging a change that touches auth, RBAC, or migrations, run through
this list — every item corresponds to a bug this pass actually found:

- [ ] New/changed `@Roles(...)` decorators are on the **handler**, or if
      placed on the class, verify `RolesGuard`'s `getAllAndOverride` still
      picks them up (it does, post-fix — just don't regress this).
- [ ] Any new controller `@Body()`/`@Query()` param that reaches a raw SQL
      column has either a `class-validator` DTO or a defensive `new Date(...)`
      / type coercion in the service — don't assume JSON body values arrive
      pre-typed.
- [ ] `npm run migration:run` succeeds on a **freshly created** empty
      database, not just an already-migrated one — column/table drift
      between migrations and entities won't show up otherwise.
- [ ] `npm run seed:db` still succeeds after any entity change with new
      required (non-nullable) columns.
- [ ] `npx jest` still reports 76/76 (or however many exist by then) passing
      against a real seeded database — not skipped, not erroring out before
      even connecting.
- [ ] Login response `expiresIn` is still a plausible number of seconds,
      not a truncated duration-string artifact.

---

## Acceptance Criteria

A backend change is mergeable when:
1. `npm run build` succeeds.
2. `npx jest` passes 100% against a freshly migrated + seeded local database.
3. Any new endpoint appears in `API_DOCUMENTATION.md` with its roles and
   at least one example request/response.
4. Any new/changed entity column is reflected in `DATABASE_SCHEMA.md` and
   has a matching migration that runs clean on an empty database.

A frontend change is mergeable when:
1. `npx tsc --noEmit` is clean.
2. `npm run build` succeeds.
3. The page follows the loading/error/empty-state pattern in
   `CODING_STANDARDS.md` if it fetches data.

---

## CI Integration

`.github/workflows/backend-ci.yml` and `frontend-ci.yml` already exist and
already provision the right services (Postgres + Redis for the backend),
but both had bugs severe enough that neither pipeline was actually testing
real code before this pass (see bugs #14-17 above):

- **Backend:** env vars didn't match what the app reads (`DATABASE_URL` vs
  `DB_HOST`/etc.), there was no migration/seed step before running
  integration tests against a freshly-provisioned empty database, and the
  unit-test step hard-failed on every run because no unit tests exist yet.
  All fixed — `backend-ci.yml` now runs `migration:run` → `seed:db` →
  `npx jest` (via `npm run test:integration`) with matching env vars, and
  `test:unit` no longer fails on an empty match set.
- **Frontend:** every step pointed at `frontend/admin`, a directory with no
  `package.json` — the pipeline never actually ran `npm install`
  successfully, let alone lint/build/test the real app under `frontend/`.
  Fixed by repointing the whole workflow at `frontend/`, widening the path
  trigger to match, and relocating the (previously orphaned) Dockerfile.

**What's still not verified:** these YAML fixes were validated by running
the equivalent commands locally (`npm run migration:run`, `npm run
seed:db`, `npx jest`, `npm run lint`, `npm run build` — all real, all
passing), but the actual GitHub Actions run itself was not observed in this
pass — no way to trigger/watch a real Actions run from here. The Docker
build step in particular (bug #16) is inferred from reading file contents,
not from an actual `docker build` invocation, since no Docker daemon is
available in this environment. Confirm both workflows go green on a real
push/PR before relying on them as a merge gate.
