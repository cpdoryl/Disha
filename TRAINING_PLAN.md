# Disha v2.0 - Training Plan

**Status:** COMPLETE | **Owner:** Training Coordinator | **Last Updated:** 2026-07-17
**Companion docs:** [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) · [USER_GUIDES.md](./USER_GUIDES.md) · [ROADMAP_TO_LAUNCH.md](./ROADMAP_TO_LAUNCH.md)

---

## 🔴 Read This First: A Real Conflict With `ROADMAP_TO_LAUNCH.md`

`ROADMAP_TO_LAUNCH.md`'s Phase 5 pilot plan calls for selecting 50-100
pilot users as "a mix of roles (admin, teacher, student, parent)." Verified
against the actual running system (`USER_GUIDES.md` § Student & Parent
Access): **there is currently no way to create a student or parent login
account at all** — not a training gap, a missing feature. The `Student`
database entity has no email/password fields and no link to a `User` row;
building that account-linking model is unscoped product/engineering work.

**This training plan is scoped to what pilot users can actually be
trained on today: `school_admin` and `teacher`.** Training a "mix of
roles including student and parent" as currently planned in
`ROADMAP_TO_LAUNCH.md` isn't deliverable without that feature work
landing first. Raise this with whoever owns the pilot launch decision
before committing to Week 9 as currently scoped — either narrow the pilot
to admin/teacher roles, or push the student/parent account-linking work
ahead of the training schedule below.

---

## 📋 Table of Contents

1. [Training Scope](#training-scope)
2. [Training Modules](#training-modules)
3. [Schedule](#schedule)
4. [Trainer Preparation](#trainer-preparation)
5. [Assessment Criteria](#assessment-criteria)
6. [Materials Checklist](#materials-checklist)
7. [Refresher Training](#refresher-training)

---

## Training Scope

| Role | Train for pilot? | Source material |
|---|---|---|
| `school_admin` | ✅ Yes | `ADMIN_GUIDE.md` § School Admin Guide |
| `teacher` | ✅ Yes | `USER_GUIDES.md` § Teacher Guide |
| `ryl_admin` | Internal only, not pilot users | `ADMIN_GUIDE.md` § Platform Admin Guide — and be direct that this role currently does very little beyond viewing placeholder dashboards |
| `student` | ❌ Not deliverable yet | See § conflict above |
| `parent` | ❌ Not deliverable yet | See § conflict above |

---

## Training Modules

### Module 1: School Admin Onboarding (60 min)
- Login and first-time navigation (10 min)
- Managing students: viewing the roster, adding a new student, what
  fields are required (15 min) — walk through `ADMIN_GUIDE.md` § Students
  exactly, including that editing/status changes have no UI yet so
  trainees don't go looking for a button that doesn't exist
- Managing staff: same pattern (10 min)
- Marking attendance for a class (10 min)
- Reading the Reports page, including how to tell real data from the
  fallback example data if a report call fails (`ADMIN_GUIDE.md` §
  Reports) (10 min)
- Q&A (5 min)

### Module 2: Teacher Onboarding (45 min)
- Login and navigation — note the sidebar differs from school_admin's
  (Classes instead of Staff) (5 min)
- Viewing classes (read-only, derived from student records — not
  something they configure) (5 min)
- Creating an assessment cycle — being explicit that this is a
  diagnostic assessment *cycle* (dates + status), not a gradebook quiz,
  since the naming invites that assumption (`USER_GUIDES.md` §
  Assessments) (15 min)
- Marking attendance (10 min)
- Q&A (10 min)

### Module 3 (Internal, RYL Staff Only): Platform Admin (20 min)
- What `ryl_admin` can and can't do today (`ADMIN_GUIDE.md` § Platform
  Admin Guide) — set expectations correctly rather than let staff
  discover the gaps live during the pilot
- How to create a new school via the API directly (no UI exists —
  `POST /api/v2/schools`, see `API_DOCUMENTATION.md`)

---

## Schedule

Aligned to `ROADMAP_TO_LAUNCH.md`'s Phase 4 (Week 7-8, Documentation &
Launch Prep) rather than inventing a new timeline:

| Week | Activity |
|---|---|
| Week 7 | Finalize this plan + `ADMIN_GUIDE.md`/`USER_GUIDES.md` with actual pilot-school names/screenshots once selected. Resolve the student/parent scope conflict above with the pilot owner. |
| Week 8, early | Train internal RYL support staff (Module 3 + both Module 1/2 so support can answer pilot questions) |
| Week 8, late | Train pilot `school_admin`/`teacher` users (Modules 1-2), scheduled per-school rather than one giant session — the seeded demo data models 4 schools with ~30 students each, a reasonable size to demo against |
| Week 9 | Pilot launch (`ROADMAP_TO_LAUNCH.md` Phase 5) |

---

## Trainer Preparation

Trainers should complete these steps against a real running instance
before training anyone — this document's own accuracy came from doing
exactly this, not from reading the code:

1. Follow `TESTING_STRATEGY.md` § Local Test Environment Setup to get a
   seeded local instance running.
2. Log in as `admin1@school.edu` / `admin123` and complete every task in
   `ADMIN_GUIDE.md` § School Admin Guide once, start to finish.
3. Log in as `teacher1@school.edu` / `teacher123` and do the same for
   `USER_GUIDES.md` § Teacher Guide.
4. Know the three "don't go looking for this" gaps cold, so a trainee's
   question doesn't catch a trainer off guard: no edit/status-change UI
   for students or staff, the attendance trend charts are static example
   data, and question-authoring for assessment cycles is API-only.

---

## Assessment Criteria

Pilot users are ready to use the system independently when they can,
unassisted:
- **school_admin:** add a student, add a staff member, mark a full
  class's attendance for a day, and locate the Reports page
- **teacher:** view their school's classes, create an assessment cycle,
  mark attendance

No formal certification process — this is a 50-100 user pilot for a
system with two working roles, not a large deployment needing a
certification program. Revisit this section if the pilot scope grows.

---

## Materials Checklist

- [x] `ADMIN_GUIDE.md` — real, verified content
- [x] `USER_GUIDES.md` — real, verified content
- [ ] Screenshots — not captured in this pass (would need actual pilot
      school branding/data, not the seeded demo schools, for training
      materials meant to go to real users)
- [ ] Recorded walkthrough video — not created
- [ ] Printed quick-reference card — not created; `ADMIN_GUIDE.md` §
      Troubleshooting and `USER_GUIDES.md` § Common Tasks are reasonable
      source content to adapt into one

---

## Refresher Training

Not scheduled yet — reasonable to revisit after the pilot's first 2 weeks
(`ROADMAP_TO_LAUNCH.md` Phase 5's "Pilot Period (Days 3-21)") once real
usage patterns show which parts of Modules 1-2 need reinforcement, rather
than guessing at a refresher curriculum before any real user has touched
the system.
