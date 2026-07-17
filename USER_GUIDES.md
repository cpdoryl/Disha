# Disha v2.0 - User Guides

**Status:** COMPLETE | **Owner:** Tech Writer | **Last Updated:** 2026-07-17
**Companion docs:** [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) · [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Verified against a real running instance, logged in as each role — see
`ADMIN_GUIDE.md` § What Was Fixed To Write This Guide for two real bugs
this process found and fixed. The most important finding for this
document specifically: **Student and Parent portal access doesn't exist
yet, in a way that goes beyond "the UI is unfinished."**

---

## 📋 Table of Contents

1. [Teacher Guide](#teacher-guide)
2. [Student & Parent Access — Not Yet a Real Feature](#student--parent-access--not-yet-a-real-feature)
3. [Quick Start Per Role](#quick-start-per-role)
4. [Common Tasks](#common-tasks)
5. [Troubleshooting / FAQ](#troubleshooting--faq)

---

## Teacher Guide

Log in as `teacher1@school.edu` / `teacher123` (through `teacher4@school.edu`
— see `TEST_CASES.md` § Seeded Test Data Reference). This is the most
complete non-admin role in the current build.

**Sidebar:** Dashboard, Classes, Students, Assessments, Attendance — all
verified working.

### Classes
Read-only list of your school's classes, **derived automatically** from
enrolled students' grade+section (e.g. "10-A", 25 students) — not a
resource you create or manage directly. There's no "my classes" filter
yet; you see every class in the school, not just ones you teach (staff
records don't currently link a teacher to specific class assignments —
see `DATABASE_SCHEMA.md`, `Staff.gradeLevel` is a single optional field,
not a list of assigned classes/sections).

### Students
Same full-school-roster view a `school_admin` sees (`ADMIN_GUIDE.md` §
Students) — not filtered to your own students. Reasonable for a small
pilot school; revisit before a school with many teachers each needing a
narrower view.

### Assessments
This is the **diagnostic assessment cycle** feature (see
`ARCHITECTURE_GUIDE.md` § Key Flows) — cycles like "Term1_2026" with a
status (draft/active/closed/archived) and a date range, not individual
quizzes or tests. Creating one here creates a real assessment cycle via
`POST /api/v2/assessments/create`. Actually adding *questions* to a cycle,
or seeing response data, has no UI yet — those are API-only
(`API_DOCUMENTATION.md` § Assessments).

### Attendance
Same real, working mark-attendance flow as `school_admin` — see
`ADMIN_GUIDE.md` § Attendance.

---

## Student & Parent Access — Not Yet a Real Feature

Checked directly against the seeded database: **zero Student or Parent
login accounts exist**, and there's a structural reason for that, not
just an oversight in seeding:

```sql
SELECT email, "userType" FROM users;
-- admin1-4@school.edu    → school_admin
-- teacher1-4@school.edu  → teacher
-- ryladmin@disha.local   → ryl_admin
-- (no student or parent rows)
```

The `Student` database entity has **no login credential fields at all**
(no email, no password) — it's an operational school-records entry, not
an authentication identity (see `ARCHITECTURE_GUIDE.md`: `User` and
`Student` are deliberately separate tables with no link between them).
For a student to actually log in, someone would need to design and build
a `User` row that's linked to a specific `Student` record — that
relationship doesn't exist in the schema today.

**What this means practically:**
- `Sidebar.tsx` does have `student` and `parent` menu entries (fixed this
  pass to only link to pages that actually exist — Assessments/Attendance
  for student, Attendance/Communications for parent), so *if* a student
  or parent account existed and logged in, the navigation itself
  wouldn't 404. But nothing in the seed data, the entity schema, or the
  signup/registration flow (there is none — `POST /api/v2/students`
  creates an operational record, not a login) provides a way to actually
  get such an account.
- The `Assessments`/`Attendance` pages a student would see are the exact
  same full-school views a teacher sees — there's no "my own records
  only" filtering built for a student-scoped view even if the login
  problem were solved.
- The `Communications` page a parent would see is **entirely mock data**
  (see `ARCHITECTURE_GUIDE.md` § Known Gaps) — announcements, an inbox,
  and a compose form, none of it backed by a real API call.

**If a pilot needs real student or parent access, this is product-level
scoping work** (design the account-linking model, decide what a student
should actually see of their own data, build the API filtering), not a
quick fix. Don't promise this to pilot users based on the sidebar menu
existing — it's scaffolding for a feature that hasn't been built yet.

---

## Quick Start Per Role

| Role | Can log in today? | Real functionality |
|---|---|---|
| `school_admin` | ✅ | Students, Staff, Attendance, Reports — all real |
| `teacher` | ✅ | Classes (read-only), Students, Assessments, Attendance — all real |
| `ryl_admin` | ✅ | Dashboard + Reports, both showing placeholder data only — see `ADMIN_GUIDE.md` |
| `student` | ❌ | No account exists; no way to create one |
| `parent` | ❌ | No account exists; no way to create one |

---

## Common Tasks

**Marking today's attendance (teacher or school_admin):** Attendance →
select today's date and a class → toggle each student → Save Attendance.

**Creating a new assessment cycle (teacher or school_admin):**
Assessments → + Create Assessment Cycle → fill in cycle name, description,
start/end dates → Create.

**Adding a new student (school_admin):** Students → + Add Student → fill
in the form (see `ADMIN_GUIDE.md` § Students for exactly which fields are
required) → Add Student.

---

## Troubleshooting / FAQ

**"I was told to log in as a student/parent and there's no such option."**
Correct — see § Student & Parent Access above. This isn't a login bug;
no such accounts exist in the system yet.

**"As a teacher, I see students/classes that aren't mine."** Correct,
current behavior — see § Teacher Guide § Classes and § Students. Not
currently configurable.

**"I created an assessment but can't add questions to it."** Correct —
question authoring has no UI yet; it's API-only today.
