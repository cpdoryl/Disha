# Disha v2.0 - Launch Checklist

**Status:** COMPLETE | **Owner:** Project Manager | **Last Updated:** 2026-07-17
**Companion docs:** every other document in `DOCUMENTATION_INVENTORY.md` — this is the synthesis, not a duplicate

This is a **go/no-go gate**, not a status report — each item reflects
verified reality from the other 24 documents in this inventory, not
aspiration. Items marked 🔴 are real blockers found during this
documentation pass; don't check them off without actually resolving the
underlying issue they reference.

---

## 📋 Table of Contents

1. [Go/No-Go: Real Blockers](#gono-go-real-blockers)
2. [Pre-Launch Verification Checklist](#pre-launch-verification-checklist)
3. [Launch Day Procedure](#launch-day-procedure)
4. [Rollback Procedure](#rollback-procedure)
5. [Success Criteria](#success-criteria)
6. [Communication Plan](#communication-plan)
7. [Post-Launch Activities](#post-launch-activities)

---

## Go/No-Go: Real Blockers

Resolve or explicitly accept each of these before Week 9 — don't let the
checklist below distract from the handful of items that actually gate
launch:

- [ ] 🔴 **Student/parent pilot-role conflict** (`TRAINING_PLAN.md`,
      `USER_GUIDES.md`): `ROADMAP_TO_LAUNCH.md`'s pilot plan calls for "a
      mix of roles (admin, teacher, student, parent)" — verified against
      the running system that student/parent accounts cannot currently
      be created at all (no login fields on the `Student` entity, zero
      such accounts in seed data). **Decide:** narrow the pilot to
      `school_admin`/`teacher` only, or delay launch until account-linking
      is built. This is the single highest-priority decision blocking an
      accurate launch plan.
- [ ] 🔴 **Rate limiting is built but attached to zero routes**
      (`SECURITY_CHECKLIST.md`) — nothing currently prevents a
      credential-stuffing attempt against `POST /api/v2/auth/login` at
      any rate. Attach `STRICT_RATE_LIMIT` before exposing login
      publicly.
- [ ] 🔴 **Cross-school tenant isolation was never audited**
      (`SECURITY_CHECKLIST.md`, `TEST_CASES.md`) — `RolesGuard` verifies
      role, not that a caller's `schoolId` matches the resource they're
      accessing. Audit this before onboarding multiple real schools with
      real (not demo) data, even for a small pilot.
- [ ] 🔴 **`.github/workflows/security-quality.yml` was never verified**
      this pass, unlike every other CI/deploy workflow (all of which had
      real bugs found and fixed — see `TESTING_STRATEGY.md`,
      `INFRASTRUCTURE_SETUP.md`). Check it the same way before trusting
      it as a merge gate.
- [ ] 🟡 **Backup off-box upload is optional/commented-out**
      (`BACKUP_RECOVERY.md`) — a backup that only lives on the same disk
      as the database isn't a real disaster-recovery mechanism. Enable it
      before launch, not after the first incident.
- [ ] 🟡 **No load test exists against real business endpoints** — only
      `/health*` has been load-tested (`LOAD_TEST_RESULTS.md`). Reasonable
      to accept for a 50-100 user pilot given the measured ~2000 req/s
      single-instance ceiling has huge headroom at that scale, but don't
      assume it generalizes to endpoints with real query complexity.

---

## Pre-Launch Verification Checklist

Everything here should already be true per the other 24 documents — this
section is for re-verifying immediately before launch, not first-time
setup:

**Deployment** (`DEPLOYMENT_GUIDE.md`, `INFRASTRUCTURE_SETUP.md`)
- [ ] Confirmed which of the three deployment targets is actually being
      used (`INFRASTRUCTURE_SETUP.md` § Three Deployment Targets) — don't
      let this still be ambiguous on launch day
- [ ] `npm run build` succeeds on both `backend/` and `frontend/` against
      the exact commit being deployed
- [ ] `npm run migration:run` succeeds on a **freshly created** database
      matching the target environment (not just "it worked once before")
- [ ] SSL certificate valid, HSTS header present (`nginx.conf`, fixed
      this pass — verify the fix actually deployed)
- [ ] `DB_SYNCHRONIZE` confirmed **unset/false** in the deployed
      environment (`SECURITY_CHECKLIST.md` — this was hardcoded `true`
      everywhere until this pass; don't let an old cached env
      configuration silently re-enable it)

**Testing** (`TESTING_STRATEGY.md`, `TEST_CASES.md`)
- [ ] `npx jest` passes 76/76 against the deployment target's actual
      database, not just a local one
- [ ] Manually verified login + one full workflow per real role
      (`school_admin`: add a student, mark attendance; `teacher`: create
      an assessment cycle) against the deployed instance, not just local

**Monitoring** (`MONITORING_SETUP.md`)
- [ ] `/metrics` reachable by Prometheus in the deployed environment
      (verify the scrape target shows UP, not just that the endpoint
      exists — this was completely non-functional before this pass)
- [ ] `/health` reports `"ok"` on a freshly deployed, idle instance (the
      memory-check bug fixed this pass would have shown `"degraded"`
      here falsely — confirm the fix is actually deployed)
- [ ] Grafana dashboards accessible, restricted to internal network only

**Backup** (`BACKUP_RECOVERY.md`)
- [ ] Backup cron job installed and confirmed to have actually run once
- [ ] Restore procedure tested against the deployed environment's real
      backup, not just the local test in `BACKUP_RECOVERY.md` §
      Testing Backup Restoration

**Support & Training** (`SUPPORT_PROCEDURES.md`, `TRAINING_PLAN.md`,
`ADMIN_GUIDE.md`, `USER_GUIDES.md`)
- [ ] Pilot `school_admin`/`teacher` users completed training (Modules
      1-2, `TRAINING_PLAN.md`)
- [ ] Support channel live, support staff completed all training modules
- [ ] Demo/seed accounts **removed or rotated** before real pilot data
      goes in — `admin1@school.edu`/`admin123` etc. are well-known,
      published-in-this-repo credentials; don't launch with them still
      active against real school data

---

## Launch Day Procedure

Adapted from `ROADMAP_TO_LAUNCH.md`'s existing Phase 5 timeline — not
duplicated in full here, just the parts this pass can add real detail to:

```
Pre-launch (T-1 day):
  - Run through Pre-Launch Verification Checklist above in full
  - Confirm on-call coverage per OPERATIONS_RUNBOOK.md

Launch day:
  08:00 - Team standby (per ROADMAP_TO_LAUNCH.md)
  09:00 - Send welcome emails with real credentials (not the seed demo
          accounts — see checklist above)
  09:00-17:00 - Monitor /metrics, /health, and error logs continuously
          (MONITORING_SETUP.md § Monitoring Runbook) — this is the first
          time these will see real, non-demo traffic
  Throughout - Support channel staffed per SUPPORT_PROCEDURES.md
```

---

## Rollback Procedure

Not previously defined anywhere in the repo as a launch-specific
procedure. References `BACKUP_RECOVERY.md` rather than duplicating it:

1. **Stop new signups/logins** if the issue is data-integrity related
   (add a maintenance banner or block at the load balancer).
2. **Assess severity** using `SUPPORT_PROCEDURES.md` § Incident Response.
3. **Code issue, no data corruption:** redeploy the previous known-good
   image/commit (`INFRASTRUCTURE_SETUP.md` § deployment target in use
   determines the exact redeploy command).
4. **Data corruption or loss:** follow `BACKUP_RECOVERY.md` § Restore
   Procedure — accept the RPO/RTO documented there (24h / ~30-60min with
   current tooling); don't promise pilot users a faster recovery than
   the actual infrastructure supports.
5. **Communicate** per § Communication Plan below regardless of which
   path — silence during a rollback erodes pilot trust faster than the
   incident itself.

---

## Success Criteria

`ROADMAP_TO_LAUNCH.md` already defines target numbers (90%+ retention,
>4.5/5 satisfaction). Adding what this pass can verify is realistic given
actual system capability, not just aspirational targets:

- **Technical:** `/health` reports `"ok"` (trustworthy signal as of this
  pass's fix) for >99% of the pilot period; no P0 incidents per
  `SUPPORT_PROCEDURES.md`'s severity definitions
- **Functional:** every `school_admin`/`teacher` pilot user successfully
  completes the tasks in `TRAINING_PLAN.md` § Assessment Criteria
  unassisted within the first week
- **Honest scope:** if the student/parent role conflict (see § Go/No-Go
  above) wasn't resolved before launch, don't measure "student/parent
  adoption" as a success metric — there's no such feature to adopt

---

## Communication Plan

- **Pilot users:** welcome email (real credentials, quick-start pointer
  into `ADMIN_GUIDE.md`/`USER_GUIDES.md`) → Day 1 → weekly check-in
  during the Days 3-21 pilot period (`ROADMAP_TO_LAUNCH.md`)
- **Internal team:** status updates in the support Slack/Discord channel
  (`SUPPORT_PROCEDURES.md`) at each launch-day milestone, not just at
  the end of the day
- **Issue escalation:** per `SUPPORT_PROCEDURES.md` § Escalation
  Procedure — don't invent a separate launch-day-only escalation path

---

## Post-Launch Activities

- **Days 3-21 (pilot period):** daily `/metrics`/`/health` review
  (`MONITORING_SETUP.md`), weekly backup-restore spot check
  (`BACKUP_RECOVERY.md`), collect the "known issues" pilot users
  actually hit and compare against `SUPPORT_PROCEDURES.md` §
  Known Issues — update that list if new patterns emerge
- **Post-pilot assessment** (`ROADMAP_TO_LAUNCH.md`): revisit the
  Go/No-Go blockers above — did the student/parent conflict get
  resolved, was rate limiting attached, was tenant isolation audited —
  before any decision to scale beyond the pilot's 50-100 users
