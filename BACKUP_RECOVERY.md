# Disha v2.0 - Backup & Recovery

**Status:** COMPLETE | **Owner:** DevOps Lead | **Last Updated:** 2026-07-17
**Companion docs:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) § Step 7 · [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) · [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)

`DEPLOYMENT_GUIDE.md` § Step 7 already has a working backup script and
cron schedule — this document is the fuller picture: what it actually
backs up, what it doesn't, how to restore, and the gaps worth closing
before this is a real disaster-recovery story rather than a single script.

---

## 📋 Table of Contents

1. [What's Actually Backed Up Today](#whats-actually-backed-up-today)
2. [Backup Procedure](#backup-procedure)
3. [Backup Schedule](#backup-schedule)
4. [Restore Procedure](#restore-procedure)
5. [RTO / RPO](#rto--rpo)
6. [Testing Backup Restoration](#testing-backup-restoration)
7. [What This Doesn't Cover](#what-this-doesnt-cover)
8. [Disaster Recovery Plan](#disaster-recovery-plan)

---

## What's Actually Backed Up Today

Only the PostgreSQL database, via `pg_dump` — see
`DEPLOYMENT_GUIDE.md` § 7.1's `backup-db.sh`. That's the right thing to
back up: it holds everything that matters (all 26 entities in
`DATABASE_SCHEMA.md`, including the diagnostic engine's `assessment_responses`,
which is the one dataset that can't be regenerated from anywhere else).

Nothing else is currently backed up by any script in this repo:
- **Application code** is safe by virtue of being in git — not a backup
  concern in the traditional sense, but worth stating explicitly so it's
  not assumed to be covered by the DB backup script.
- **`.env`/`.env.production` files** (secrets: `JWT_SECRET`, `DB_PASSWORD`,
  any third-party API keys) are **not backed up anywhere**, deliberately —
  see `SECURITY_CHECKLIST.md`. Losing the server without a secrets backup
  means regenerating `JWT_SECRET` (invalidates every existing session —
  acceptable) and re-entering third-party credentials from their original
  source, not from a backup.
- **Uploaded files / documents.** The `extraction/` OCR service (not yet
  implemented — see `ARCHITECTURE_GUIDE.md`) would eventually produce
  documents worth backing up; nothing exists here yet to back up.
- **Prometheus/Grafana data** (metrics history, dashboard definitions) —
  reasonable to treat as disposable/regenerable rather than
  backup-worthy; the dashboards themselves should live in git once they
  exist (see `MONITORING_SETUP.md`), not rely on a running Grafana
  instance's state.

---

## Backup Procedure

From `DEPLOYMENT_GUIDE.md` § 7.1, verified logically consistent with the
actual `docker-compose.prod.yml` template (container name `disha-db`,
matches):

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DB_CONTAINER="disha-db"
DB_NAME="disha_prod"
DB_USER="disha_user"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/disha_backup_$BACKUP_DATE.sql"
RETENTION_DAYS=30

docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
  -U $DB_USER $DB_NAME > $BACKUP_FILE

gzip $BACKUP_FILE
find $BACKUP_DIR -name "disha_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
```

**Two things worth doing before relying on this in production:**

1. **Off-box storage.** The script's own comment marks the S3/DigitalOcean
   Spaces upload line as optional (`# aws s3 cp ...`) — a backup that
   only lives on the same disk as the database it's backing up doesn't
   survive the failure modes that actually matter (disk failure, instance
   termination, accidental `rm`). Uncomment and configure that line before
   this counts as a real backup strategy, not just a local snapshot.
2. **Verify the container name matches your actual deployment.** The
   script hardcodes `disha-db` — that's `docker-compose.prod.yml`'s
   `container_name` for the `postgres` service (verified). If you deploy
   via `docker-compose.staging.yml` instead, the container is named
   `disha-staging-postgres` and the database name is
   `${DB_NAME:-disha_staging_db}`, not `disha_prod` — update the script's
   variables accordingly rather than assuming one script covers both
   compose files.

---

## Backup Schedule

```bash
chmod +x /home/disha/scripts/backup-db.sh
crontab -e
# Add:
0 2 * * * /home/disha/scripts/backup-db.sh >> /var/log/disha-backup.log 2>&1
```

Daily at 2 AM, 30-day local retention (per the script's `RETENTION_DAYS`).
Reasonable for the pilot's scale — revisit frequency (e.g. hourly, or
point-in-time via WAL archiving) once real user-generated data volume
justifies a tighter RPO than 24 hours.

---

## Restore Procedure

Not documented anywhere in the repo before this pass. The inverse of the
backup script, using the same container/database naming:

```bash
# 1. Identify the backup to restore
ls -la /backups/disha_backup_*.sql.gz

# 2. Decompress
gunzip /backups/disha_backup_20260717_020000.sql.gz

# 3. Stop the API so nothing writes during restore
docker-compose -f docker-compose.prod.yml stop api

# 4. Restore — this REPLACES the current database contents.
#    Confirm you're targeting the right container/database before running.
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U disha_user -d disha_prod < /backups/disha_backup_20260717_020000.sql

# 5. Verify
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U disha_user -d disha_prod -c "SELECT COUNT(*) FROM students;"

# 6. Restart the API
docker-compose -f docker-compose.prod.yml start api
```

**This is a destructive operation** — step 4 doesn't drop-and-recreate the
database first, so restoring on top of a database that already has rows
will conflict on primary keys and unique constraints (`enrollmentNumber`,
`email`, etc. — see `DATABASE_SCHEMA.md` § Indexes) rather than cleanly
overwrite. For a full restore onto an existing database:
```bash
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U disha_user -c "DROP DATABASE disha_prod;"
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U disha_user -c "CREATE DATABASE disha_prod OWNER disha_user;"
# then the psql restore command above
```

---

## RTO / RPO

Not previously defined anywhere in the repo. Reasonable targets given the
current setup (single-instance, daily backup, no replication):

| | Target | Basis |
|---|---|---|
| **RPO** (Recovery Point Objective) | 24 hours | Daily backup cadence — worst case, restore loses up to a day of writes. Tighten this (hourly backups, or WAL-based point-in-time recovery) before this is acceptable beyond the pilot phase |
| **RTO** (Recovery Time Objective) | ~30-60 minutes | Manual process: identify backup → decompress → stop API → restore → verify → restart. No automation exists for this yet; the estimate assumes an operator following the Restore Procedure above by hand. Scripting the restore path would cut this significantly |

These are honest estimates based on what the tooling actually supports
today, not aspirational SLAs — don't commit to tighter numbers externally
without first automating the restore path and testing it for real (see
next section).

---

## Testing Backup Restoration

**Never verified in this repo before.** A backup script that's never been
tested restoring is an unverified assumption, not a working safety net.
Verify it now:

```bash
# Against a throwaway local database — NOT production
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE disha_restore_test;"

# Take a real backup from your seeded local/staging DB
pg_dump -h localhost -U postgres disha_test_db > /tmp/test_backup.sql

# Restore it into the throwaway database
psql -h localhost -U postgres -d disha_restore_test < /tmp/test_backup.sql

# Verify row counts match the source (should be 120 students, 4 schools,
# etc. per TEST_CASES.md § Seeded Test Data Reference, if restoring from
# a freshly-seeded backend/src/database/seeds/seed.ts database)
psql -h localhost -U postgres -d disha_restore_test -c "SELECT COUNT(*) FROM students;"

# Clean up
psql -h localhost -U postgres -c "DROP DATABASE disha_restore_test;"
```

Run this quarterly at minimum, and after any migration change (the
schema-drift bug found in `TESTING_STRATEGY.md` bug #3 is exactly the
kind of thing that would make an old backup fail to restore cleanly
against a newer schema without a migration path).

---

## What This Doesn't Cover

Being explicit about scope rather than implying more coverage than exists:

- **No automated failover.** If the single Postgres instance dies, a human
  has to notice and run the Restore Procedure manually.
- **No cross-region backup replication.** Backups live on the same
  provider/region as the primary database unless the optional S3 upload
  step is configured.
- **No backup encryption at rest documented** — if backups are uploaded
  to S3/Spaces, enable server-side encryption on that bucket; not
  currently specified anywhere in this repo.
- **No tested recovery from total infrastructure loss** (server + backups
  both gone) — the off-box storage step in § Backup Procedure is the only
  thing standing between "recoverable" and "total data loss" in that
  scenario, and it's currently optional/commented-out in the script.

---

## Disaster Recovery Plan

For the pilot's current scale, the plan is intentionally simple —
documenting it explicitly rather than leaving it implicit:

1. **Single server down (VM/container crash):** DigitalOcean/hosting
   provider restart, or redeploy via `DEPLOYMENT_GUIDE.md` § Step 6 onto
   a fresh instance, then restore the latest backup per this document.
   RTO/RPO as above.
2. **Database corruption:** Stop the API, restore the most recent known-good
   backup per § Restore Procedure, accept the RPO gap.
3. **Total server + local backup loss:** Only recoverable if the optional
   off-box upload step (§ Backup Procedure) was actually configured and
   running. **Verify this is turned on before treating it as covered.**
4. **Secrets lost** (`.env.production` gone, no backup by design — see
   § What's Actually Backed Up Today): regenerate `JWT_SECRET` (all
   sessions invalidated, users re-login), re-provision `DB_PASSWORD` and
   any third-party keys from their original sources (AWS console,
   Anthropic console, Razorpay dashboard, etc.), not from a backup that
   was never meant to hold them.
