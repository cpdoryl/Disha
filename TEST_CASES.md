# Disha v2.0 - Test Cases

**Status:** COMPLETE | **Owner:** QA Lead | **Last Updated:** 2026-07-17
**Companion docs:** [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) · [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

This is a catalogue of what's actually tested today (76 real, passing
integration tests — verified, not estimated) and what isn't yet, organized
so the gap list can be worked top-down. Every "covered" row below maps to
a real `it(...)` block in `backend/test/`; nothing in this document is
aspirational unless explicitly marked as a **gap**.

---

## 📋 Table of Contents

1. [How to Run These](#how-to-run-these)
2. [Covered: Authentication](#covered-authentication)
3. [Covered: RBAC Matrix](#covered-rbac-matrix)
4. [Covered: Schools API Detail](#covered-schools-api-detail)
5. [Gaps: Untested Endpoints](#gaps-untested-endpoints)
6. [Gaps: Edge Cases Worth Adding](#gaps-edge-cases-worth-adding)
7. [Regression Cases (Tied to Bugs Found This Cycle)](#regression-cases-tied-to-bugs-found-this-cycle)
8. [Frontend Test Cases (None Exist Yet)](#frontend-test-cases-none-exist-yet)
9. [Seeded Test Data Reference](#seeded-test-data-reference)

---

## How to Run These

See `TESTING_STRATEGY.md` § Local Test Environment Setup for the full
procedure. Short version:
```bash
cd backend
cp .env.test .env.local
npm run migration:run && npm run seed:db
npx jest --verbose
```

---

## Covered: Authentication

`backend/test/auth.integration.spec.ts` — 19 test cases.

| Scenario | Type |
|---|---|
| Login with valid credentials returns accessToken/refreshToken/user | Positive |
| Login with unregistered email fails | Negative |
| Login with wrong password fails | Negative |
| Login with malformed email format fails validation | Negative |
| Login with missing password fails validation | Negative |
| Refresh with valid refresh token issues new tokens | Positive |
| Refresh with invalid refresh token fails | Negative |
| Refresh with missing refresh token fails validation | Negative |
| Logout with valid token succeeds | Positive |
| Logout with invalid token fails | Negative |
| Logout without token fails | Negative |
| Valid token grants access to a protected endpoint | Positive |
| Missing token denies access (401) | Negative |
| Malformed token denies access (401) | Negative |
| Expired token denies access (401) | Negative |
| Teacher login returns correct role in token | Positive |
| Different users get different tokens | Positive |

---

## Covered: RBAC Matrix

`backend/test/rbac.integration.spec.ts` — 33 test cases, spanning 9
controllers. This is the suite that caught the class-level `@Roles()` bypass
(see `TESTING_STRATEGY.md` bug #10) — treat any future controller that adds
`@Roles(...)` as needing a row here, both an *allow* case for an in-role
user and a *deny* case for an out-of-role user.

| Controller | Endpoint | Allowed roles tested | Denied role tested |
|---|---|---|---|
| School | `POST /api/v2/schools` | ryl_admin | school_admin, teacher |
| School | `GET /api/v2/schools/:id` | ryl_admin, school_admin, teacher | (unauthenticated) |
| School | `PATCH /api/v2/schools/:id/deactivate` | ryl_admin | school_admin |
| Student | `POST /api/v2/students` | ryl_admin, school_admin | teacher |
| Student | `GET /api/v2/students/:id` | ryl_admin, school_admin, teacher | — |
| Student | `POST /api/v2/students/:id/attendance` | teacher | (unauthenticated) |
| Assessment | `POST /api/v2/assessments/create` | ryl_admin, school_admin | teacher |
| Assessment | `POST /api/v2/assessments/:id/submit` | public (with and without auth) | — |
| Assessment | `PATCH /api/v2/assessments/:id/status` | ryl_admin | teacher |
| Data | any (class-level `@Roles`) | teacher | (unauthenticated) |
| Audit | any (class-level `@Roles`) | school_admin | teacher |
| Notification | any (class-level `@Roles`) | teacher | (unauthenticated) |
| Reporting | `GET /reports/student/:id/progress` | teacher | (unauthenticated) |
| Reporting | `POST /reports/export` | school_admin | teacher |
| Wellbeing | any (class-level `@Roles`) | teacher | (unauthenticated) |
| Challenge | `GET /challenges`, `GET /challenges/:id` | public | — |
| (global) | any protected route | — | missing header, invalid format, malformed JWT |

**Gap in this matrix:** every "denied role tested" column only has *one*
out-of-role example per endpoint, not every possible wrong role (e.g.
`parent`/`student` are never tried against ryl_admin-only routes). Given the
class-level `@Roles()` bug this suite already caught once, a `parent`- and
`student`-role denial case on every restricted endpoint would be cheap
insurance — see Gaps below.

---

## Covered: Schools API Detail

`backend/test/schools.integration.spec.ts` — 19 test cases (beyond the RBAC
matrix above, this file also covers non-role edge cases):

| Scenario | Type |
|---|---|
| Get school with admin/teacher token | Positive |
| Get school without token | Negative (401) |
| Get school with an invalid (non-UUID) id → 400, not 500 | Edge case |
| Update school as admin | Positive |
| Update school as teacher (insufficient role) | Negative (403) |
| Update school without token | Negative (401) |
| Get school metrics with/without token | Positive/Negative |
| Deactivate as admin/teacher/no-token | Positive/Negative × 3 |
| Malformed JSON body handled gracefully | Edge case |
| Request to a non-existent route → 404 | Edge case |

---

## Gaps: Untested Endpoints

Cross-referenced against the full endpoint list in `API_DOCUMENTATION.md`.
These have **zero** automated coverage today — the RBAC matrix above tests
one representative route per controller, not every route in it.

**High priority** (data-mutating, used by the live frontend):
- [ ] `GET /api/v2/students/school/:schoolId` (list) and
      `GET /api/v2/students/school/:schoolId/classes` (derived classes) —
      the two endpoints the frontend Students/Classes pages depend on directly
- [ ] `PATCH /api/v2/students/:id/status` (withdraw/transfer/graduate)
- [ ] `GET /api/v2/students/:id/attendance/report`
- [ ] `POST /api/v2/students/:id/academic-assessment` and
      `GET /api/v2/students/:id/academic-performance`
- [ ] `POST /api/v2/staff`, `GET /api/v2/staff/school/:schoolId` — added
      this cycle, zero test coverage yet despite being brand new code
- [ ] `GET /api/v2/attendance` and `POST /api/v2/attendance/bulk` — also
      added this cycle, zero coverage
- [ ] `GET /api/v2/assessments/school/:schoolId`,
      `GET /api/v2/assessments/:id/questions`,
      `GET /api/v2/assessments/:assessmentId/my-response`,
      `GET /api/v2/assessments/:assessmentId/data-quality-report`
- [ ] `GET /api/v2/reports/assessment/:id/summary`,
      `GET /api/v2/reports/school/:id/performance` (this is what
      `reportingAPI.getSchoolMetrics()` on the frontend actually calls),
      `POST /api/v2/reports/schedule`

**Medium priority** (exists, used less directly by the frontend today):
- [ ] `GET /api/v2/schools/organization/:orgId`, `.../district/:districtId`
- [ ] Wellbeing: counsellor-referral create/update, intervention
      create/complete, bullying-incident create/resolve, dashboard,
      intervention-effectiveness
- [ ] Data: scorecard, retention, teacher-retention, quality,
      academic-performance-distribution, attendance-trend
- [ ] Notification: attendance-alert, academic-update, fee-reminder,
      assessment-invitation, preferences
- [ ] Audit: logs/school, activity/user, failed-actions, suspicious-activity
- [ ] Challenge: `by-category/:category`, `POST /selected`

**Not applicable yet:** `admissions`, `fee`, `compliance`, `infrastructure`,
`communication` modules have no routes at all (see `API_DOCUMENTATION.md` §
Not Yet Implemented) — nothing to test until they exist.

---

## Gaps: Edge Cases Worth Adding

These aren't tied to a specific untested endpoint — they're patterns that
should be tried against *every* mutating endpoint, based on what actually
broke this cycle:

- [ ] **Malformed/missing required body fields on `any`-typed controllers**
      (`student`, `school`, `staff` accept `@Body() dto: any` — no DTO
      validation). Confirm each one either 400s cleanly or is migrated to a
      real DTO; don't assume the `AllExceptionsFilter`'s Postgres-error
      mapping (bug #8 in `TESTING_STRATEGY.md`) covers every malformed-input
      shape — it only catches errors that reach Postgres, not e.g. a
      missing required field that TypeORM silently defaults.
- [ ] **Invalid UUID in every `:id`/`:schoolId`/`:studentId` path param**,
      not just the one case `schools.integration.spec.ts` covers. This
      exact class of bug (500 instead of 400) was found once already.
- [ ] **Cross-school data access** — does a `school_admin` or `teacher`
      token for School A get 403/404 (not data) when hitting an endpoint
      with School B's id? None of the current RBAC tests check this —
      they all verify *role* but not *tenant* isolation. Given every
      resource is scoped by `schoolId`, this is a realistic gap: nothing
      in the guard chain currently checks that `req.user.schoolId` matches
      the resource being accessed, only that the role is allowed.
- [ ] **Duplicate unique-constraint values** — e.g. creating two students
      with the same `enrollmentNumber` in the same school, or two staff
      with the same `employeeId`. Should 409 (mapped by bug #8's fix); not
      yet actually exercised by a test.
- [ ] **`parent`/`student` roles against every restricted endpoint** — see
      the RBAC matrix gap noted above.

---

## Regression Cases (Tied to Bugs Found This Cycle)

Each of these corresponds to a specific bug documented in
`TESTING_STRATEGY.md` § Bugs Found and Fixed. Most now have a passing test
guarding them; the ones marked **not yet a test** are real but only
verified manually via `curl` during this pass — worth turning into an
actual spec.

| Bug | Regression guard |
|---|---|
| Invalid UUID → 500 instead of 400 | ✅ `schools.integration.spec.ts` "should return 400 with invalid UUID" |
| `ryl_admin` RBAC silently using a school_admin token | ✅ every "should allow ryl_admin to..." case in `rbac.integration.spec.ts` |
| Class-level `@Roles()` bypassed entirely | ✅ Audit/Data/Notification/Wellbeing "deny" cases in `rbac.integration.spec.ts` |
| `recordAttendance` crashing on string date | ✅ "should allow teacher to record attendance" |
| Migrations don't produce a schema matching entities | ✅ implicitly — the whole suite requires `migration:run` to have succeeded on a clean DB |
| Seed script missing `Organization.type` | ✅ implicitly — nothing runs without `seed:db` succeeding |
| Login `expiresIn` truncated from a duration string | ❌ **not yet a test** — no spec asserts `expiresIn` is a sane number (e.g. `> 60`) |
| `database.synchronize` hardcoded regardless of env | ❌ **not yet a test** — nothing currently asserts the app boots with `DB_SYNCHRONIZE` unset and still requires migrations to have run |
| Cross-school tenant isolation | ❌ **not yet a test** — see Edge Cases above, this was never actually broken *or* fixed, just never checked |

---

## Frontend Test Cases (None Exist Yet)

No test runner is configured (`TESTING_STRATEGY.md` § Frontend Testing).
Once Jest + React Testing Library land, this is the priority order,
matching the consistent loading/error/empty/populated pattern every
dashboard page already implements (`CODING_STANDARDS.md` § React/Next.js
Frontend Patterns):

1. `lib/store/authStore.ts` — pure state logic, no DOM: login success sets
   `user`/`isAuthenticated`, login failure throws and leaves `isLoading`
   false, logout clears cookies and state.
2. `lib/api/client.ts` — the 401 → refresh → retry interceptor flow (mock
   axios, assert the retry happens exactly once and a second 401 redirects
   rather than looping).
3. One dashboard page per resource (Students, Staff, Attendance, Classes,
   Assessments, Reports) — render with a mocked `xxxAPI`, assert: loading
   spinner shows first, error banner + Retry button shows on rejected
   promise, empty state shows on `[]`, populated table shows on real data.
4. `LoginForm.tsx` — validation errors render per-field, submit calls
   `login()` with form values, failed login shows the error banner.

---

## Seeded Test Data Reference

From `backend/src/database/seeds/seed.ts`, after `npm run seed:db`:

| Account | Email | Password | Role | Scope |
|---|---|---|---|---|
| Platform admin | `ryladmin@disha.local` | `rylAdmin123` | ryl_admin | All schools (schoolId: null) |
| School admin (×4) | `admin1@school.edu` … `admin4@school.edu` | `admin123` | school_admin | One per seeded school |
| Teacher (×4) | `teacher1@school.edu` … `teacher4@school.edu` | `teacher123` | teacher | One per seeded school |

Also seeded: 1 organization, 1 district, 4 schools (30 students each = 120
students total), 5 of the 15 predefined challenges, 1 assessment cycle per
school. `test/setup.ts`'s `TEST_USERS` constant mirrors the `ryladmin`,
`admin2@school.edu` (as `schoolAdmin`), and `teacher1@school.edu` (as
`teacher`) accounts above — keep that constant in sync if seed data changes.
