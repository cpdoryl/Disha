# Disha v2.0 - Admin Guide

**Status:** COMPLETE | **Owner:** Product/Tech Writer | **Last Updated:** 2026-07-17
**Companion docs:** [USER_GUIDES.md](./USER_GUIDES.md) · [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) · [TEST_CASES.md](./TEST_CASES.md) § Seeded Test Data Reference

Verified by actually logging in as each admin-tier role in a running
instance (Postgres + backend + frontend, seeded data) and clicking through
every link, not by reading the code and assuming it works. Two real bugs
were found and fixed doing this — see § What Was Fixed To Write This Guide.

---

## 📋 Table of Contents

1. [Two Different "Admin" Roles](#two-different-admin-roles)
2. [School Admin Guide](#school-admin-guide)
3. [Platform Admin (ryl_admin) Guide](#platform-admin-ryl_admin-guide)
4. [What Was Fixed To Write This Guide](#what-was-fixed-to-write-this-guide)
5. [Troubleshooting](#troubleshooting)

---

## Two Different "Admin" Roles

Disha has two roles that both mean "admin" in casual conversation but are
very different in what they can actually do today:

| | `school_admin` | `ryl_admin` |
|---|---|---|
| Who | An individual school's administrator | Disha/RYL platform staff |
| Scoped to | One school (`schoolId` set) | No single school (`schoolId: null`) |
| What works today | Full CRUD on Students, Staff, Attendance; Reports (real data) | Dashboard + Reports only, both showing placeholder/mock data — see below |
| Login | `admin1@school.edu` / `admin123` (through `admin4@school.edu`) | `ryladmin@disha.local` / `rylAdmin123` |

**If you're setting up a demo or training a real user, `school_admin` is
the role with genuinely working functionality.** `ryl_admin` exists and
can log in, but there is currently no real "manage all schools" console
behind it — see the next section for exactly what that means in practice.

---

## School Admin Guide

Log in as `admin1@school.edu` / `admin123` (or any of `admin2`-`admin4`,
each tied to a different one of the 4 seeded schools — see `TEST_CASES.md`
§ Seeded Test Data Reference).

**Sidebar:** Dashboard, Students, Staff, Attendance, Reports — every link
verified to load real data from the running backend, not mock data.

### Dashboard
Overview stat cards (total students, attendance rate, active assessments,
staff count) pulled from `GET /api/v2/schools/:id/metrics`, plus a static
example attendance chart (not yet wired to real data — see
`ARCHITECTURE_GUIDE.md`).

### Students
- **View:** Full roster for your school, with search by name/enrollment
  number.
- **Add Student:** Requires first/last name, enrollment number, date of
  birth, grade, section, gender; guardian email is optional. There is no
  student email field — students don't have their own login in this
  system (see `USER_GUIDES.md`).
- **What's not here yet:** editing an existing student, changing status
  (withdraw/transfer/graduate — the API supports `PATCH
  /api/v2/students/:id/status`, but no UI button calls it).

### Staff
- **View:** All staff at your school (name, employee ID, position,
  subject, employment status).
- **Add Staff:** Employee ID, name, position (principal / vice principal
  / teacher / counsellor / admin staff), subject taught, grade level,
  start date.
- **What's not here yet:** editing, deactivating, or recording training
  sessions (the `TeacherTraining` entity exists in the database but has no
  UI or API endpoint at all — see `DATABASE_SCHEMA.md`).

### Attendance
- **Mark attendance:** pick a date and class (grade-section, e.g.
  "10-A"), toggle each student Present/Absent, save. Writes real rows via
  `POST /api/v2/attendance/bulk`.
- **The "Daily Trend" and "Class Wise Report" panels on this page are
  static mock data**, not derived from what you just marked — don't rely
  on them for real numbers yet.

### Reports
Real school performance data via `GET /api/v2/reports/school/:id/performance`
(90-day window). If that call fails or returns an unexpected shape, the
page falls back to example chart data — if the numbers look suspiciously
round (90.75% attendance, exactly 98 students), you're looking at the
fallback, not real numbers; check for a backend error in that case rather
than trusting the display at face value.

### Classes (visible to teacher role, not in the school_admin sidebar)
Not in `school_admin`'s menu today, though the page exists and works —
see `USER_GUIDES.md` § Teacher Guide. Classes are derived automatically
from enrolled students' grade+section, not a manageable resource of their
own (no "add class" — see `ARCHITECTURE_GUIDE.md` § Known Gaps).

---

## Platform Admin (ryl_admin) Guide

Log in as `ryladmin@disha.local` / `rylAdmin123`.

**Sidebar:** Dashboard, Reports — and that's genuinely all that works
right now. Be direct with anyone using this account about what to expect:

- **Dashboard:** stat cards show `0` / `0%` placeholders (there's no
  cross-school metrics endpoint to populate them — `GET
  /api/v2/schools/:id/metrics` needs a specific school's ID, and a
  platform admin isn't tied to one). The attendance trend chart shows the
  same static example data every role sees.
- **Reports:** shows example/fallback chart data for the same reason —
  there's no `GET /api/v2/reports/all-schools` or equivalent. If you need
  real numbers for a specific school as a platform admin, there's no UI
  path today; querying the API directly with that school's ID is the only
  option (see `API_DOCUMENTATION.md`).
- **No Users, Schools, or System Health pages exist** despite what an
  earlier, buggy version of the sidebar used to link to (see below) — if
  you're picturing a "manage every school and every user" console, that
  hasn't been built yet. `POST /api/v2/schools` (create a new school) and
  a handful of other `ryl_admin`-only endpoints exist and work via the
  API (`API_DOCUMENTATION.md` § Schools) — there's just no frontend for
  them.

**Bottom line:** if the pilot needs a real platform-admin console
(onboarding new schools, cross-school analytics, user management), that's
new frontend work, not a bug fix — scope it as a feature, not a
documentation gap.

---

## What Was Fixed To Write This Guide

Writing this guide meant actually logging in as each role in a running
instance, which surfaced two real, previously-undetected bugs — both
fixed as part of producing this document, not just noted:

1. **`ryl_admin` silently got the wrong sidebar.** `Sidebar.tsx`'s menu
   map had a key literally named `admin`, which no real role value
   (`ryl_admin`, `ryl_support`, or anything else) has ever matched. A
   `ryl_admin` login fell through to the `|| menuItems.student` fallback
   — the **student** menu, which itself linked to `/dashboard/courses`
   and `/dashboard/performance`, neither of which exists as a page (both
   404). Verified live with a scripted browser login before and after the
   fix. Fixed by keying the menu map with real `User.userType` values and
   giving `ryl_admin`/`ryl_support` their own (honest, minimal) menu.
2. **The dashboard and reports pages hung on an infinite loading spinner
   for any user with no `schoolId`** — i.e., every `ryl_admin`/
   `ryl_support` login. Both pages gate their data fetch on `if
   (user?.schoolId)`, and the `loading` state was only ever cleared
   inside that fetch — so it just never resolved. Verified live (a
   scripted browser session confirmed the loading skeleton was still
   showing 3 seconds after page load) before fixing it to stop the
   loading state immediately when there's no `schoolId` to query with.

Also fixed: the login page's "Demo Credentials" hint showed
`admin@disha.local / password123` — an account that has never existed in
any seed data. Verified by attempting that exact login against a real
running backend (401 Unauthorized). Updated to a real, working seeded
account.

---

## Troubleshooting

**"My dashboard stat cards all show 0."** Expected for `ryl_admin` (see
above). For `school_admin`, this means `GET /api/v2/schools/:id/metrics`
either errored or returned zeros for real — check the backend logs for
that request.

**"I can't find a way to edit a student/staff record after creating it."**
Correct — that UI doesn't exist yet, even though the backend supports
status changes. Not a bug to report; a known gap.

**"The attendance trend chart never changes no matter what I mark."**
Correct — that chart is static example data on every role's dashboard,
not wired to real attendance records yet.

**"I logged in as `ryl_admin` and most of the sidebar I expected is
missing."** Correct as of this pass — see § Platform Admin Guide above.
