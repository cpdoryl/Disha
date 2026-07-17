# Disha v2.0 - Support Procedures

**Status:** COMPLETE | **Owner:** Support Lead | **Last Updated:** 2026-07-17
**Companion docs:** [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) · [USER_GUIDES.md](./USER_GUIDES.md) · [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)

The channel/SLA/escalation structure below is a reasonable default sized
for a 50-100 user pilot (`ROADMAP_TO_LAUNCH.md`) — not an existing
organizational process this document is transcribing, since no support
team structure exists anywhere else in this repo to draw from. The
**Known Issues** and **Troubleshooting Playbook** sections, by contrast,
are grounded in this session's actual verified findings, not guesses.

---

## 📋 Table of Contents

1. [Support Channels](#support-channels)
2. [Ticket Classification & SLA](#ticket-classification--sla)
3. [Escalation Procedure](#escalation-procedure)
4. [Known Issues — Don't Re-Diagnose These](#known-issues--dont-re-diagnose-these)
5. [Troubleshooting Playbook](#troubleshooting-playbook)
6. [Support Team Training](#support-team-training)
7. [Incident Response](#incident-response)

---

## Support Channels

For a pilot this size, one channel kept simple beats several kept thin:

| Channel | Use for | Response expectation |
|---|---|---|
| Email (`support@disha.local` per `README.md` — verify this inbox actually exists and is monitored before publishing it to pilot users) | Primary channel | Per SLA below |
| Slack/Discord channel (per `ROADMAP_TO_LAUNCH.md`'s launch-day plan — "Setup support channel") | Pilot users + internal team, informal/urgent | Best-effort during business hours |

No phone support planned — not justified at this scale.

---

## Ticket Classification & SLA

| Severity | Definition | Response | Resolution target |
|---|---|---|---|
| **P0 — Down** | Login broken for everyone, or data loss | 30 min | 4 hours |
| **P1 — Blocking** | A core workflow broken for one school (e.g. can't mark attendance) | 4 hours | 1 business day |
| **P2 — Degraded** | Workaround exists, or affects one user | 1 business day | 3 business days |
| **P3 — Question/Cosmetic** | "How do I...", UI polish | 2 business days | Best effort |

**Before triaging as P0/P1, check § Known Issues below** — several
things that look like outages are actually already-understood gaps (e.g.
a `ryl_admin` login showing empty dashboards is expected today, not an
incident).

---

## Escalation Procedure

```
Pilot user reports issue
    ↓
Support (Tier 1): Check § Known Issues + § Troubleshooting Playbook first
    ↓ (not resolved)
Tier 2 (whoever owns backend/frontend that week):
    - Check backend logs (LoggingInterceptor output) and, once deployed,
      /metrics + Grafana (MONITORING_SETUP.md) for anomalies
    - Reproduce against a local seeded instance (TESTING_STRATEGY.md)
      before touching production
    ↓ (data integrity or security concern)
Escalate immediately, don't wait for the normal SLA:
    - Suspected data loss → BACKUP_RECOVERY.md § Restore Procedure
    - Suspected security incident → treat as P0 regardless of user impact,
      see SECURITY_CHECKLIST.md
```

---

## Known Issues — Don't Re-Diagnose These

Real, verified behaviors as of this pass — a support agent re-diagnosing
these from scratch is wasted effort:

- **`ryl_admin` dashboard/reports show placeholder data (0s, example
  charts).** Expected — see `ADMIN_GUIDE.md` § Platform Admin Guide.
  Not a bug report; explain the current scope to whoever asks.
- **Students/staff can't be edited or have their status changed from the
  UI.** Correct, no such button exists yet (`ADMIN_GUIDE.md`). The API
  supports it (`PATCH /api/v2/students/:id/status`); if a genuine need
  comes up during the pilot, that's a feature request, not a bug.
- **A user asks to log in as a student or parent.** Not currently
  possible — see `USER_GUIDES.md` § Student & Parent Access. Don't spend
  time troubleshooting a "broken" login for a role that has no seeded or
  creatable account.
- **Attendance trend charts / class-wise reports don't reflect real
  data.** Correct, static example data on every role's view
  (`ADMIN_GUIDE.md` § Attendance).
- **A teacher sees students/classes outside what they expected.**
  Correct, current behavior — no per-teacher filtering exists yet
  (`USER_GUIDES.md` § Teacher Guide).

---

## Troubleshooting Playbook

**"I can't log in."**
1. Confirm the account actually exists — `TEST_CASES.md` § Seeded Test
   Data Reference lists every real seeded account. A student/parent
   login attempt will always fail (see § Known Issues) — that's not
   something to debug.
2. If a real `school_admin`/`teacher` account fails, check the backend
   logs for the actual error (`AuthService.validateUser` throws
   `UnauthorizedException` for both "user not found" and "wrong
   password" — the message doesn't distinguish them by design, so the
   backend log is the only way to tell which).
3. Confirm `JWT_SECRET` matches between what signed the token and what
   the API is currently running with — a secret rotation invalidates
   every existing session (expected, not a bug — see
   `SECURITY_CHECKLIST.md`).

**"A page is stuck loading forever."**
This exact symptom was a real bug found and fixed this pass (dashboard
and reports pages hanging for any schoolId-less user — see
`ADMIN_GUIDE.md` § What Was Fixed To Write This Guide). If a support
agent sees this on a *different* page than those two, treat it as a new
instance of the same bug class: check whether that page's data-fetch
`useEffect` is gated on a condition (`user?.schoolId`, a specific role,
etc.) that can be false without ever flipping `loading` back to `false`.

**"I got a 403 Forbidden doing something that should be allowed."**
Check the caller's actual role against `API_DOCUMENTATION.md`'s roles
table for that endpoint — several endpoints have narrower role lists
than might be assumed (e.g. only `ryl_admin`/`school_admin` can export
reports, not `teacher`). If the role genuinely should be allowed and
isn't, that's worth escalating — `TESTING_STRATEGY.md` documents one real
authorization bug already found and fixed this pass, so this class of
issue has precedent.

**"Numbers on a report look wrong / suspiciously round."**
See `ADMIN_GUIDE.md` § Reports — several pages fall back to static
example data on a failed API call, and that fallback data is realistic
enough to not look obviously fake at a glance (90.75% attendance, 98
students). Check the browser console / backend logs for a failed request
before assuming the displayed numbers are real and investigating a data
problem that doesn't exist.

---

## Support Team Training

Support staff should complete `TRAINING_PLAN.md` Module 3 (Platform
Admin) plus both Module 1 and Module 2 — they need to understand both
`school_admin` and `teacher` workflows to help either kind of pilot user,
unlike the pilot users themselves who only need their own role's module.

---

## Incident Response

For anything beyond the P2/P3 tickets above:

1. **Acknowledge** in the support channel within the SLA window.
2. **Assess** using `MONITORING_SETUP.md`'s runbook — is `/health`
   actually degraded, or does it just look that way (the pre-fix
   health-check memory bug is exactly why this check matters — verify
   with `/metrics`, not just `/health`'s pass/fail, until confidence in
   that signal is re-established over time).
3. **Communicate** — a status update in the support channel even before
   root cause is known beats silence.
4. **Resolve or roll back** — if a recent deploy is the likely cause,
   rolling back is faster than debugging forward under pressure.
5. **Follow up** — add the resolved issue to § Known Issues above if it's
   the kind of thing support will see again, or to
   `TESTING_STRATEGY.md` § Regression Cases if it's the kind of bug a
   test should have caught.
