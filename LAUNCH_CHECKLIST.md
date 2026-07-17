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
launch. **Update:** all 4 original 🔴 blockers are now resolved — 3
engineering gaps (rate limiting, tenant isolation, CI verification), each
verified live against real seeded data, not just code-reviewed, and 1
product decision (pilot role scope). Only the 🟡 items below remain open:

- [x] ✅ **Resolved (2026-07-17, pilot owner decision):** narrowed the
      pilot to `school_admin`/`teacher` only rather than delay Week 9 for
      student/parent account-linking work (real feature work — no login
      fields on the `Student` entity, zero such accounts possible in the
      current schema). `ROADMAP_TO_LAUNCH.md` Phase 5 and
      `TRAINING_PLAN.md` updated to match. Student/parent access is a
      candidate for a post-pilot phase.
- [x] ✅ **Fixed:** rate limiting is now attached to `POST
      /api/v2/auth/login` and `POST /api/v2/auth/refresh`
      (`SECURITY_CHECKLIST.md` § Rate Limiting) — verified live (429 with
      correct headers after exceeding the limit) and against the full
      76/76 integration suite. Found and fixed a second bug along the way
      (`NODE_ENV=test` vs. the config's `'testing'` check, which would
      have made the strict limit apply for real during test runs). **Still
      open, lower priority:** `POST /api/v2/assessments/:id/submit` is
      public/unauthenticated and not yet rate-limited — see
      `SECURITY_CHECKLIST.md` § Rate Limiting.
- [x] ✅ **Fixed the main gap:** cross-school tenant isolation was a real,
      verified data leak — `admin1@school.edu` (School A) could read
      School B's full school record and student roster (names, gender,
      guardian details) with nothing but a path parameter. Fixed via a
      new `SchoolScopeGuard` attached to every endpoint (~24 routes
      across 9 controllers) that carries a school identifier directly in
      the request; verified closed live, and the full suite (79/79,
      including 3 new negative tests) still passes. See
      `SECURITY_CHECKLIST.md` § Authorization for the full before/after.
      **Still open, lower priority:** `:id`-based endpoints where the
      owning school isn't in the URL (student/staff detail routes, and
      especially the wellbeing counsellor-referral/intervention/
      bullying-incident endpoints — higher sensitivity, same class of
      gap) need a resource-owner lookup rather than a simple param
      compare, and `SchoolController`'s org/district-scoped queries need
      a different mechanism entirely since the JWT doesn't carry an
      `organizationId`. Audit these before onboarding real schools with
      real (not demo) data if the pilot exercises those specific
      endpoints.
- [x] ✅ **Fixed:** `.github/workflows/security-quality.yml` was checked
      the same way as every other CI/deploy workflow and had the same hit
      rate — real bugs in 5 of its 6 jobs (nonexistent `frontend/admin`/
      `mobile/` paths, deprecated CodeQL `@v2` actions, a Safety CLI
      version that silently requires cloud auth, a commit-linter with no
      config and a broken event guard, an accessibility job that failed
      hard on every run). Fixed all of them; verified the Lighthouse
      accessibility piece end-to-end by actually building and running the
      real frontend and auditing it (score: 0.98). See
      `SECURITY_CHECKLIST.md` § Dependency & Container Scanning for the
      full list. SonarCloud is left flagged rather than fixed — no
      `sonar-project.properties` or `SONARCLOUD_TOKEN` secret exists in
      this repo to make it functional yet.
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
- **Honest scope:** the pilot was scoped to `school_admin`/`teacher` only
  (see § Go/No-Go above) — don't measure "student/parent adoption" as a
  success metric, there's no such feature in this pilot to adopt

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
  Go/No-Go blockers above — is student/parent access worth building for
  the next phase, were the still-open items from the tenant-isolation
  and rate-limiting fixes (see § Go/No-Go) closed out — before any
  decision to scale beyond the pilot's 50-100 users
