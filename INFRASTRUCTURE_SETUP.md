# Disha v2.0 - Infrastructure Setup

**Status:** COMPLETE | **Owner:** DevOps Lead | **Last Updated:** 2026-07-17
**Companion docs:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) · [MONITORING_SETUP.md](./MONITORING_SETUP.md) · [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md) · [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

`DEPLOYMENT_GUIDE.md` walks through a single DigitalOcean deployment
top-to-bottom. This document is the reference view: what infrastructure
actually exists in this repo today, the real bugs found and fixed in it
this pass, and the topology/scaling picture `DEPLOYMENT_GUIDE.md` doesn't
spell out on its own.

---

## 📋 Table of Contents

1. [Three Deployment Targets — Pick One](#three-deployment-targets--pick-one)
2. [Server Requirements](#server-requirements)
3. [Network Topology](#network-topology)
4. [Firewall Rules](#firewall-rules)
5. [What Was Actually Fixed This Pass](#what-was-actually-fixed-this-pass)
6. [High Availability](#high-availability)
7. [Disaster Recovery Setup](#disaster-recovery-setup)

---

## Three Deployment Targets — Pick One

The repo describes **three different deployment strategies** that were
never reconciled with each other. Know which one you're actually using
before following any instructions:

| | `docker-compose.yml` | `docker-compose.staging.yml` | `.github/workflows/deploy.yml` |
|---|---|---|---|
| Target | Local dev | A single staging VM (DigitalOcean-style) | AWS ECS |
| Services | postgres, api, redis (opt-in) | postgres, api, nginx, prometheus, grafana, redis (opt-in) | none — deploys a pre-built image to ECS |
| Frontend included? | No | No | No |
| Reverse proxy | None | `nginx-staging.conf` | AWS ALB (implied, not in-repo) |

None of the three includes the frontend as a deployed service. `frontend/`
has its own `Dockerfile` (moved to the correct location this pass — see
`TESTING_STRATEGY.md` bug #16) but nothing currently builds or runs it in
any compose file. `DEPLOYMENT_GUIDE.md`'s inline `docker-compose.prod.yml`
template is a **fourth**, hand-written-in-the-guide variant that does
include a frontend service — it was never reconciled with the two
docker-compose files that actually live in the repo either.

**Pick one path deliberately before deploying anything:**
- **Local dev** → `docker-compose.yml` (or run backend/frontend directly with `npm run dev`/`start:dev`, per `README.md`)
- **A single staging box** → `docker-compose.staging.yml` + `nginx-staging.conf`, following `DEPLOYMENT_GUIDE.md`'s DigitalOcean steps but substituting the real staging compose file for its inline `docker-compose.prod.yml` template where they conflict
- **AWS ECS** → `.github/workflows/deploy.yml`'s `deploy` job (requires `AWS_ROLE_TO_ASSUME`, `ECS_CLUSTER_NAME`, `ECS_SERVICE_NAME` secrets and a pre-existing ECS cluster/service/task definition — none of that infrastructure-as-code exists in this repo; `terraform/` referenced in `README.md`'s aspirational project structure does not exist on disk)

---

## Server Requirements

Sized from what's actually measured, not guessed — see
`LOAD_TEST_RESULTS.md` for the numbers behind these:

| Component | Minimum | Recommended | Notes |
|---|---|---|---|
| API server | 1 vCPU, 1GB RAM | 2 vCPU, 2GB RAM | One unclustered Node process caps around ~2000 req/s on trivial endpoints on 4 vCPUs (measured) — a single vCPU box is fine for the pilot's 50-user scale, but cluster before scaling beyond it (see below) |
| PostgreSQL | 1 vCPU, 1GB RAM | 2 vCPU, 4GB RAM | Never stress-tested in this pass — `LOAD_TEST_RESULTS.md`'s test only hit `SELECT 1` health checks, not real query load |
| Redis | — | 512MB | Currently provisioned but unused by any application code — see `ARCHITECTURE_GUIDE.md` § Known Gaps. Don't provision this until something actually needs it |
| Nginx | shares API box is fine | dedicated at scale | `nginx-staging.conf` and the fixed `nginx.conf` are both API-only (no frontend `location /`) — see `DEPLOYMENT_GUIDE.md` § Step 4 for the version that also proxies the frontend |

---

## Network Topology

```
Internet
   │
   ▼
┌─────────────────────────────────┐
│  Nginx (80/443)                  │
│  - TLS termination               │
│  - /health, /api/, /docs → api   │
│  - /metrics → api (IP-restricted)│  ← fixed this pass, see below
└──────────────┬───────────────────┘
               │ internal network only
               ▼
┌─────────────────────────────────┐
│  API container (port 3001)       │
└──────────────┬───────────────────┘
               │ internal network only
               ▼
┌─────────────────────────────────┐
│  PostgreSQL (port 5432)          │
│  Not exposed to the internet —   │
│  docker-compose.staging.yml maps │
│  it to the host port, which is   │
│  fine on a single-box staging    │
│  deploy but must NOT be publicly │
│  reachable in production (see    │
│  Firewall Rules below)           │
└─────────────────────────────────┘
```

Prometheus/Grafana (staging compose file) sit on the same internal network
as the API and should never be exposed publicly either — see
`MONITORING_SETUP.md` for the access-control story now that `/metrics` is
a real, working, unauthenticated endpoint.

---

## Firewall Rules

`DEPLOYMENT_GUIDE.md` § Security Hardening already covers UFW setup for a
DigitalOcean droplet — the essential rule set:

| Port | Source | Purpose |
|---|---|---|
| 22 (SSH) | Your IP / bastion only | Admin access — never 0.0.0.0/0 |
| 80, 443 | 0.0.0.0/0 | Public HTTP/HTTPS via Nginx |
| 5432 (Postgres) | Internal network only | Never expose publicly — `docker-compose.staging.yml` currently maps this to the host, which only stays safe if the host's own firewall blocks external access to it |
| 9090 (Prometheus), 3001 host-mapped for Grafana | Internal / VPN only | See `MONITORING_SETUP.md` — these dashboards have no application-level auth beyond Grafana's own login, don't rely on that alone |
| Everything else | Deny | Default-deny, per `DEPLOYMENT_GUIDE.md`'s UFW steps |

---

## What Was Actually Fixed This Pass

Infrastructure files had real, verifiable bugs — found by reading them
closely against what the application actually does, not by assuming
prior sessions got them right:

1. **`docker-compose.staging.yml` mounted a nonexistent path**
   (`./backend/database/migrations`) into Postgres's
   `docker-entrypoint-initdb.d` — even the correct migrations path
   wouldn't have worked there, since those are TypeORM `.ts` classes and
   Postgres's init mechanism only runs `.sh`/`.sql`/`.sql.gz`. Removed;
   schema setup is the explicit `npm run migration:run` step already
   documented in `DEPLOYMENT_GUIDE.md` § 6.2 (also fixed — see below).
2. **`nginx.conf`** (the file implied to be the production counterpart to
   `nginx-staging.conf`) **was a literal copy of the staging config** —
   still named `disha_api_staging`, still pointing at an `api-staging`
   hostname and `staging.example.com` domain. Retargeted to real
   production naming (`disha_api` → `api:3001`, matching
   `DEPLOYMENT_GUIDE.md`'s compose template) and added an IP-restricted
   `/metrics` location now that endpoint actually exists (see
   `MONITORING_SETUP.md`).
3. **`DEPLOYMENT_GUIDE.md`'s `.env.production` template used env var names
   the app doesn't read**: `DB_SYNC` (real: `DB_SYNCHRONIZE`), `API_PORT`
   (real: `PORT`), `JWT_EXPIRATION` (real: `JWT_EXPIRES_IN`) — see
   `backend/src/config/configuration.ts`. Each wrong name meant the
   setting was silently ignored in favor of a hardcoded default. Fixed,
   with comments explaining why each one matters.
4. **The `docker-compose.prod.yml` template's `api` service had a port
   mismatch that guaranteed its own healthcheck could never pass** — it
   mapped host/container port 3001 but never set `PORT` in the
   container's environment, so the app would default to listening on
   3000 while the healthcheck curled 3001. Fixed by setting `PORT: 3001`
   explicitly.
5. **Several health-check URLs and npm script names were wrong**
   throughout `DEPLOYMENT_GUIDE.md`: `/api/v2/health` (real: `/health` —
   `HealthController` has no `/api/v2` prefix), `npm run typeorm
   migration:run` / `npm run typeorm seed:run` (real script names:
   `migration:run` / `seed:db`). All fixed at every occurrence.
6. **The Prometheus config template scraped `/api/v2/metrics`** — a route
   that has never existed. See `MONITORING_SETUP.md` for the full story;
   fixed alongside actually building the `/metrics` endpoint it was
   supposed to hit.
7. **`.github/workflows/deploy.yml`'s test job** ran `npm run test` (no DB
   env vars configured for that step, so its `beforeAll` hooks would hang
   against an unconfigured connection) and never ran migrations/seed
   before the integration-test step that depends on seeded login
   credentials. Fixed — see `TESTING_STRATEGY.md` for the equivalent fix
   already applied to `backend-ci.yml`.

None of these were caught by any previous pass because none of them had
ever actually been exercised — provisioning real infrastructure from
these files for the first time is exactly when copy-paste artifacts like
these surface.

---

## High Availability

Not configured anywhere in this repo today, and shouldn't be treated as
"done" by any status doc that claims otherwise:

- **No load balancing across multiple API instances.** `LOAD_TEST_RESULTS.md`
  found the single-process throughput ceiling (~2000 req/s) — clustering
  (Node's `cluster` module, PM2 cluster mode, or multiple container
  replicas behind Nginx `least_conn` — the directive is already in both
  nginx configs, just pointing at a single upstream server today) is the
  documented recommendation once traffic approaches that ceiling.
- **No database replication or failover.** A single Postgres container/
  instance is a single point of failure in every deployment target above.
- **No automated instance restart beyond Docker's own `restart:
  unless-stopped`** (present in `docker-compose.staging.yml`, absent from
  the base `docker-compose.yml` — intentional, since that one's for local
  dev).

Given the pilot's stated scale (`ROADMAP_TO_LAUNCH.md` — 50 users), none
of this is urgent yet. Revisit before any deployment beyond the pilot.

---

## Disaster Recovery Setup

Covered in `BACKUP_RECOVERY.md` — not duplicated here.
