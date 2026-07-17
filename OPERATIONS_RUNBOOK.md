# Disha v2.0 - Operations Runbook

**Status:** COMPLETE | **Owner:** DevOps Lead | **Last Updated:** 2026-07-17
**Companion docs:** [MONITORING_SETUP.md](./MONITORING_SETUP.md) § Monitoring Runbook · [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md) · [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) · [SUPPORT_PROCEDURES.md](./SUPPORT_PROCEDURES.md) § Incident Response · [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

This is the day-to-day operator's reference — the last of the 25
documents in `DOCUMENTATION_INVENTORY.md`. It's deliberately thin where
another document already owns a procedure in depth: this file tells you
**when** to run something and points at the doc that tells you **how**,
rather than re-explaining it. Where a command sequence is genuinely new
(daily checklist, common ops tasks, on-call rotation), it's written out
in full here.

---

## 📋 Table of Contents

1. [Daily Operations Checklist](#daily-operations-checklist)
2. [Common Operations Tasks](#common-operations-tasks)
3. [Maintenance Procedures](#maintenance-procedures)
4. [Performance Monitoring](#performance-monitoring)
5. [Scaling Procedures](#scaling-procedures)
6. [Update / Deploy Procedures](#update--deploy-procedures)
7. [Incident Response](#incident-response)
8. [On-Call Procedures](#on-call-procedures)

---

## Daily Operations Checklist

A pilot at this scale (`ROADMAP_TO_LAUNCH.md` — 50-100 users) doesn't
need a dedicated ops team, but it does need someone doing this every
business day during the pilot period:

- [ ] `curl https://<domain>/health` returns `"ok"` — this check is only
      trustworthy as of this pass's memory-calculation fix (see
      `MONITORING_SETUP.md` § The Health-Check Memory Bug); if it reports
      `"degraded"`, don't dismiss it as the old false positive without
      first confirming the fix actually deployed
- [ ] `disha_http_requests_total{status_code=~"5.."}` rate in
      Grafana/Prometheus is flat, not climbing (`MONITORING_SETUP.md` §
      Monitoring Runbook)
- [ ] Last night's backup cron actually ran — check
      `/var/log/disha-backup.log` for a fresh entry, not just that the
      cron entry exists (`BACKUP_RECOVERY.md` § Backup Schedule)
- [ ] Support channel/inbox has no unacknowledged P0/P1 tickets past SLA
      (`SUPPORT_PROCEDURES.md` § Ticket Classification & SLA)
- [ ] Disk usage on the DB/backup volume isn't approaching capacity —
      `df -h` on the host; 30-day local retention (`BACKUP_RECOVERY.md`)
      means this grows daily until the retention job prunes it

---

## Common Operations Tasks

**Restart the API** (config change, stuck process, applying an env
var update):
```bash
docker-compose -f docker-compose.staging.yml restart api
# or, for the docker-compose.prod.yml target from DEPLOYMENT_GUIDE.md:
docker-compose -f docker-compose.prod.yml restart api
```
Confirm which compose file is actually in use first —
`INFRASTRUCTURE_SETUP.md` § Three Deployment Targets exists specifically
because this repo has more than one, and running the wrong one is a
no-op against a container that isn't running.

**Tail logs:**
```bash
docker-compose -f docker-compose.staging.yml logs -f api
```
The app's `LoggingInterceptor` (referenced in `SUPPORT_PROCEDURES.md` §
Escalation Procedure) is the first place to look for a stack trace behind
a 500, before reaching for `/metrics`.

**Run a database migration:**
```bash
cd backend && npm run migration:run
```
Not `npm run typeorm migration:run` — that script name doesn't exist;
see `INFRASTRUCTURE_SETUP.md` § What Was Actually Fixed This Pass, item 5.
Always confirm `DB_SYNCHRONIZE` is unset/false in the target environment
first (`SECURITY_CHECKLIST.md`) — if it's still `true`, TypeORM's
auto-sync may have already silently altered the schema out from under
the migration history, making `migration:run`'s output unreliable.

**Re-seed a non-production database** (staging/demo reset only — running
this against real pilot data would overwrite it):
```bash
cd backend && npm run seed:db
```

**Check current schema state:**
```bash
cd backend && npm run migration:show
```

**Rotate `JWT_SECRET`:** update the env var, restart the API. This
invalidates every existing session — expected, not a bug
(`SECURITY_CHECKLIST.md`; also referenced in `SUPPORT_PROCEDURES.md` §
Troubleshooting Playbook as a known "can't log in" cause after a
rotation).

**Check for orphaned/degraded Prometheus scrape targets:** open
Prometheus's own `/targets` page — `nginx`/`postgres` exporter jobs are
*expected* to show DOWN until those exporters are actually deployed
(`MONITORING_SETUP.md` § Prometheus Configuration); only `disha-api`
showing DOWN is an actual incident.

---

## Maintenance Procedures

**Applying a dependency update (backend or frontend):**
1. Update, then run the full verification each already-established in
   this repo: backend `npm run build && npx jest`; frontend
   `npx tsc --noEmit && npm run build`.
2. Deploy to staging first (`docker-compose.staging.yml`), run the Daily
   Operations Checklist against it, then promote.

**Rotating logs:** not currently automated anywhere in this repo — Docker's
default `json-file` log driver has no rotation configured in any compose
file here. On a long-running host, add a `logging:` block
(`max-size`/`max-file`) to the `api` service before disk usage from
unbounded logs becomes its own incident.

**Certificate renewal:** if using Let's Encrypt per `DEPLOYMENT_GUIDE.md`
§ Security Hardening, `certbot`'s systemd timer handles renewal
automatically — verify it's actually enabled (`systemctl status
certbot.timer`) rather than assuming it is, and check the Daily
Operations Checklist's `/health` curl also validates TLS didn't silently
lapse (`curl -v` will show the cert expiry).

**Pruning old backups:** handled automatically by the `RETENTION_DAYS`
line in `backup-db.sh` (`BACKUP_RECOVERY.md` § Backup Procedure) — no
separate manual step needed unless the retention window itself needs
changing.

---

## Performance Monitoring

Covered in depth in `MONITORING_SETUP.md` — this section is only the
"when do I look" tie-in:

- **After every deploy:** watch error rate and `/health` for several
  minutes (`MONITORING_SETUP.md` § Monitoring Runbook § Deploying a
  change).
- **Weekly during the pilot:** review `disha_http_request_duration_seconds`
  p95/p99 trend against the baseline in `LOAD_TEST_RESULTS.md` — the
  measured single-instance ceiling (~2000 req/s on trivial endpoints,
  never tested against real business-endpoint query complexity) is the
  reference point, not a guarantee.
- **On any user-reported slowness:** cross-reference
  `MONITORING_SETUP.md` § Monitoring Runbook § Investigating high
  latency before assuming it's a code regression.

---

## Scaling Procedures

For the pilot's current scale (50-100 users), no scaling action is
expected to be needed — this section exists so the trigger and the first
step are already decided before someone is scaling under pressure:

**Trigger:** `disha_http_request_duration_seconds` p99 climbing toward
the ~2000 req/s single-instance ceiling from `LOAD_TEST_RESULTS.md`, or
CPU/memory on the API host sustained near capacity.

**First step — vertical, not horizontal:** increase the API container's
CPU/RAM allocation (`INFRASTRUCTURE_SETUP.md` § Server Requirements) —
cheaper and faster than the alternative below, and sufficient for
several multiples of the pilot's traffic.

**If that's not enough — horizontal:** `INFRASTRUCTURE_SETUP.md` § High
Availability already documents the path: multiple API container
replicas behind Nginx, using the `least_conn` directive already present
in both `nginx.conf` and `nginx-staging.conf` (currently pointed at a
single upstream server — add replica entries there). Requires the
database to handle the added connection load; still a single Postgres
instance with no replication (`INFRASTRUCTURE_SETUP.md`), so this scales
the API tier only, not the database tier.

**Database scaling** is out of scope for anything built in this repo
today — no read replicas, no connection pooler (PgBouncer or similar) is
configured anywhere. Needed before horizontal API scaling would actually
help under real write-heavy load; not needed at pilot scale.

---

## Update / Deploy Procedures

Exact steps depend on which of the three deployment targets is in use
(`INFRASTRUCTURE_SETUP.md` § Three Deployment Targets) — confirm that
before running anything:

**Single staging/production VM** (`docker-compose.staging.yml` or the
`docker-compose.prod.yml` template in `DEPLOYMENT_GUIDE.md`):
```bash
git pull origin main
docker-compose -f docker-compose.staging.yml build api
cd backend && npm run migration:run && cd ..
docker-compose -f docker-compose.staging.yml up -d api
curl https://<domain>/health   # confirm "ok" before considering the deploy done
```

**AWS ECS** (`.github/workflows/deploy.yml`): push to the branch that
triggers the workflow — the `deploy` job now runs migrations and seeds
before integration tests (fixed this pass, see
`INFRASTRUCTURE_SETUP.md` item 7) and pushes the built image to ECS.
Requires `AWS_ROLE_TO_ASSUME`/`ECS_CLUSTER_NAME`/`ECS_SERVICE_NAME`
secrets and a pre-existing ECS cluster — none of that infrastructure
exists in this repo to provision from scratch.

**Always, regardless of target:** run the Pre-Launch-style verification
from `LAUNCH_CHECKLIST.md` § Pre-Launch Verification Checklist §
Deployment before considering any deploy complete — `npm run build`
against the exact deployed commit, migrations against a real (not
assumed) current schema state, `/health` and `/metrics` both reachable
post-deploy.

**Rollback:** see `LAUNCH_CHECKLIST.md` § Rollback Procedure — not
duplicated here since that document already covers it in the launch
context, which is the same procedure post-launch.

---

## Incident Response

`SUPPORT_PROCEDURES.md` § Incident Response already defines the 5-step
flow (Acknowledge → Assess → Communicate → Resolve or roll back →
Follow up) and § Escalation Procedure defines who's involved at each
tier. This section adds the operator-specific detail that document
doesn't cover:

**Assessing severity as an operator, not just a support agent:**
1. Check `/health` — but per `MONITORING_SETUP.md`, cross-check against
   `/metrics` rather than trusting a single pass/fail bit, especially
   until confidence in the fixed health check is re-established over
   time in production.
2. Check `disha_http_requests_total{status_code=~"5.."}` for a spike
   correlated with the report.
3. Check `docker-compose ... logs -f api` for the actual exception —
   the `AllExceptionsFilter` fixed this pass (`TESTING_STRATEGY.md`)
   means most real errors now return clean 4xx/5xx JSON instead of a
   raw stack trace to the client, so the stack trace itself is only
   visible server-side in the logs.
4. If a recent deploy correlates with the incident's start time, treat
   rollback (`LAUNCH_CHECKLIST.md` § Rollback Procedure) as the default
   first move, not a last resort — debugging forward under pressure
   against live user impact is slower and riskier than reverting to a
   known-good state first and investigating calmly after.

**Data-loss or security incidents specifically:** escalate immediately
per `SUPPORT_PROCEDURES.md` § Escalation Procedure — don't wait for a
normal severity assessment first. Data loss goes straight to
`BACKUP_RECOVERY.md` § Restore Procedure; suspected security incidents
are treated as P0 regardless of measured user impact, per
`SECURITY_CHECKLIST.md`.

**After resolution:** add to `SUPPORT_PROCEDURES.md` § Known Issues if
support will see it again, or to `TESTING_STRATEGY.md` § Regression
Cases if it's a bug a test should have caught — same follow-up step
`SUPPORT_PROCEDURES.md` already defines, restated here because it's easy
to skip once the immediate pressure is off.

---

## On-Call Procedures

Not previously defined anywhere in the repo. A reasonable minimum for a
50-100 user pilot — not a 24/7 enterprise on-call program:

- **Coverage window:** business hours during the Days 3-21 pilot period
  (`ROADMAP_TO_LAUNCH.md` Phase 5), matching the support SLA's own
  business-hours assumption (`SUPPORT_PROCEDURES.md` § Ticket
  Classification & SLA) — there's no justification yet for staffing
  overnight/weekend on-call at this scale, and no rotation tooling
  (PagerDuty, Opsgenie, etc.) is configured anywhere in this repo to
  page anyone outside business hours regardless.
- **Who:** whoever owns backend/frontend that week per
  `SUPPORT_PROCEDURES.md` § Escalation Procedure's Tier 2 — this runbook
  doesn't introduce a separate on-call identity from that existing
  rotation.
- **Handoff:** at shift change, the outgoing owner should confirm the
  Daily Operations Checklist above was run today and note any open P0/P1
  ticket status in the support channel — a five-minute step that avoids
  a new on-call starting cold on an active incident.
- **Escalation beyond Tier 2:** none currently defined — for a pilot this
  size, Tier 2 (the current backend/frontend owner) is the top of the
  chain. Revisit before scaling beyond the pilot if that stops being
  sufficient.

Revisit this section entirely once real on-call load from the pilot
shows whether business-hours-only coverage was actually sufficient —
written here as a starting point, not a permanent policy.
