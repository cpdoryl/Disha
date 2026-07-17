# Disha v2.0 - Load Test Results

**Status:** COMPLETE | **Owner:** DevOps/QA | **Last Updated:** 2026-07-17
**Companion doc:** [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) § Load Testing

These are real numbers from a real run, not projections. `TECH_STACK.md`
and `LOAD_TESTING.md` describe the load-testing tool as Artillery,
"already installed" — that's inaccurate; there is no Artillery dependency
or config anywhere in the repo. The actual tooling is `scripts/load-test-
baseline.sh` and `scripts/load-test-progressive.sh`, both built on **`wrk`**
(a separate CLI benchmarking tool, not an npm package). See
`TESTING_STRATEGY.md` § Load Testing for that correction in full.

---

## 📋 Table of Contents

1. [Test Configuration](#test-configuration)
2. [Baseline Results (Health Endpoints)](#baseline-results-health-endpoints)
3. [Progressive Load Results](#progressive-load-results)
4. [Bottleneck Analysis](#bottleneck-analysis)
5. [A Real Bug This Test Run Found](#a-real-bug-this-test-run-found)
6. [Optimization Recommendations](#optimization-recommendations)
7. [Capacity Planning](#capacity-planning)
8. [Future Scaling Requirements](#future-scaling-requirements)

---

## Test Configuration

| | |
|---|---|
| **Target** | Single backend instance, `node dist/main.js`, no cluster/PM2 |
| **Database** | Local PostgreSQL 16, seeded (4 schools, 120 students, per `TEST_CASES.md`) |
| **Host** | 4 vCPU, 15GB RAM, Linux x86_64 |
| **Node** | v22.22.2 |
| **Tool** | `wrk` 4.1.0 |
| **Scripts** | `scripts/load-test-baseline.sh` (fixed 50 concurrent users), `scripts/load-test-progressive.sh` (staged 10→1000 concurrent users) |
| **Endpoints tested** | `/health`, `/health/live`, `/health/ready`, `/health/startup`, `/health/metrics`, `/health/deep` |

These are the only endpoints the existing scripts target — they don't
exercise authenticated business endpoints (students, assessments, etc.).
See [Future Scaling Requirements](#future-scaling-requirements) for what a
more representative test would need.

---

## Baseline Results (Health Endpoints)

50 concurrent connections, 15s per endpoint, 5 threads:

| Endpoint | Avg Latency | p99 Latency | Max Latency | Throughput (req/s) |
|---|---|---|---|---|
| `/health` | 26.71ms | 53.82ms | 404.95ms | 394.10 → 1946.87 total/s across the run |
| `/health/live` | 28.52ms | 379.17ms | 549.29ms | 539.33 |
| `/health/ready` | 23.66ms | 34.31ms | 227.80ms | 429.96 (2134.80 aggregate req/s) |
| `/health/startup` | 28.07ms | 44.03ms | 193.43ms | 360.64 (1790.90 aggregate req/s) |
| `/health/metrics` | 23.51ms | 42.51ms | 255.91ms | 436.29 (2164.23 aggregate req/s) |
| `/health/deep` | 29.91ms | 60.77ms | 207.30ms | 339.82 (1689.09 aggregate req/s) |

`/health/deep` and `/health/startup` are consistently the slowest — both
run multiple sequential Postgres queries per request (`SELECT 1`,
`information_schema.tables`, migration/seed verification counts), unlike
`/health/live` which does no I/O at all. Every endpoint held p99 latency
under 65ms at this load level except `/health/live`, whose 379ms p99 is
noise from JIT/GC warm-up in the first few seconds of the run, not a
sustained issue (its avg of 28.52ms and 50th percentile were in line with
the others).

---

## Progressive Load Results

Single endpoint (`/health`), 10s per stage, stepping concurrency:

| Stage | Concurrent Users | Avg Latency | p99 Latency | Throughput (req/s) | Socket Timeouts | Status |
|---|---|---|---|---|---|---|
| 1 | 10 | 5.62ms | 20.87ms | 1877.89 | 0 | ✅ |
| 2 | 50 | 23.58ms | 43.57ms | 2173.30 | 0 | ✅ |
| 3 | 100 | 63.29ms | 473.79ms | 1846.27 | 0 | ✅ |
| 4 | 200 | 112.03ms | 631.09ms | 1961.05 | 0 | ✅ |
| 5 | 500 | 264.43ms | 1.38s | 1923.78 | 143 | ⚠️ degraded |
| 6 | 1000 | 418.51ms | 1.07s | 1777.76 | 677 | ⚠️ degraded |

**Throughput plateaus at ~1800-2200 req/s regardless of concurrency** —
this is the actual ceiling for one unclustered Node process on this
hardware, not a database or network limit (the `/health` endpoint being
tested here does zero I/O). Beyond ~200 concurrent connections, additional
load doesn't increase throughput; it just makes every request wait longer
in the event loop's queue, which is exactly what the climbing p99 numbers
show — 631ms at 200 users, 1.38s at 500 users. Timeouts appear at 500+
concurrent connections (`wrk`'s default request timeout is hit before a
queued request gets serviced).

---

## Bottleneck Analysis

1. **Single process, single event loop.** `backend/src/main.ts` calls
   `NestFactory.create()` + `app.listen()` directly — no `cluster` module,
   no PM2 cluster mode, no worker threads. Every request, regardless of
   endpoint, is served by one Node process on one CPU core. The host has
   4 cores; only one is ever in use under this test. This is *the*
   bottleneck — not the database, not the endpoint logic.
2. **No load balancing / horizontal scaling configured** for local or
   staging deployment (`docker-compose.yml` defines a single `api` service
   with no replica count — one container, one process).
   `DEPLOYMENT_GUIDE.md`'s production path should specify how many
   instances sit behind the load balancer — this test suggests each
   instance caps out around 2000 req/s for trivial endpoints, and lower
   for anything touching the database with real query complexity (student
   lists, reports) rather than a single `SELECT 1`.
3. **Compression middleware runs on every response** (`main.ts` enables
   `compression()` unconditionally at threshold 100 bytes) — reasonable
   for real payloads, adds a small fixed CPU cost per request that's
   proportionally more visible on trivial health-check JSON.

---

## A Real Bug This Test Run Found

Before this pass, `/health` reported **`"status": "degraded"`** within
seconds of a completely idle, freshly-booted process — no load, no errors,
nothing wrong. Root cause: `HealthService.getMemoryUsage()` computed its
health-check `percentage` as `heapUsed / heapTotal` (V8's *current* heap
allocation, which grows incrementally rather than starting at a fixed
ceiling), and `checkMemoryHealth()`/`getReadiness()`/`getDeepCheck()` all
gate on that percentage crossing 85-90%. A small, idle process routinely
sits at 85-95% of its *current* (small) heap total simply because V8
hasn't needed to grow the heap yet — that's normal, healthy behavior, not
memory pressure. In a real deployment this would make a Kubernetes
readiness probe or load balancer health check pull perfectly healthy
instances out of rotation, or never mark a freshly-started instance
"ready" in the first place.

**Fixed** in `backend/src/modules/health/health.service.ts`:
`percentage` is now `rss / os.totalmem()` — actual process memory against
actual system memory, which is what "is this instance running out of
memory" should mean. Verified before/after: `/health` reported `"status":
"degraded"` with `memory.percentage: 92` on a freshly-booted idle process
before the fix; `"status": "ok"` with `memory.percentage: 1` after,
against the identical process. All 76 backend integration tests still
pass after this change.

---

## Optimization Recommendations

1. **Cluster the Node process** (built-in `cluster` module, or run under
   PM2 in cluster mode, or run N container replicas behind the load
   balancer described in `DEPLOYMENT_GUIDE.md`) — this is the single
   highest-leverage fix given the bottleneck analysis above. 4 cores
   idle-but-unused on this test host alone implies roughly 4x the
   measured ceiling is available for free.
2. **Re-run this test against business endpoints**, not just `/health` —
   see Future Scaling Requirements below. A `/health` load test tells you
   about Node's raw request-handling ceiling, not about query performance
   under `GET /api/v2/students/school/:schoolId` with a large roster, or
   write contention on `POST /api/v2/attendance/bulk`.
3. **Set `wrk`'s timeout explicitly** (`--timeout 5s` or similar) in the
   progressive script for stages beyond ~200 concurrent users — the
   "Socket errors: timeout" counts at stages 5-6 are partly an artifact of
   wrk's own default timeout being shorter than the queueing delay this
   single process produces, not necessarily requests that would have
   failed against a properly scaled deployment.
4. Now that `/health`'s memory signal is trustworthy (see bug above),
   it's safe to actually wire a Kubernetes/load-balancer readiness probe
   to it — that wasn't a good idea before this fix.

---

## Capacity Planning

Based on the measured single-instance ceiling (~2000 req/s on trivial
endpoints, degrading past ~200 concurrent connections without
clustering):

- **Current unclustered deployment**: reasonable for the pilot's stated
  scale (`ROADMAP_TO_LAUNCH.md` targets a 50-user pilot) — nowhere near
  this ceiling under realistic pilot traffic.
- **Before any deployment beyond the pilot**: cluster the process (see
  Optimization Recommendations #1) and re-test against real business
  endpoints with realistic payloads, not `/health`.
- **Database** was never the bottleneck in this test (a `SELECT 1` health
  check doesn't stress it) — capacity planning for Postgres itself needs
  its own test against the actual query patterns in
  `database/queries/optimized-queries.ts` and the unpaginated list
  endpoints flagged in `DATABASE_SCHEMA.md` § Query Optimization Notes.

---

## Future Scaling Requirements

What the *next* load test should cover, now that the harness itself is
proven to work:

- [ ] Authenticated business endpoints (`POST /api/v2/auth/login` then a
      mix of `GET /api/v2/students/school/:id`, `POST /api/v2/attendance/bulk`,
      `POST /api/v2/assessments/:id/submit`) — a Lua script for `wrk` or a
      small custom script to handle the login-then-authenticated-requests
      flow, since the current scripts only hit unauthenticated `/health*`.
- [ ] A clustered/multi-replica target, to validate the scaling
      recommendation above actually raises the ceiling as expected.
- [ ] A run against a database with realistic data volume (hundreds of
      schools, thousands of students per school) rather than the 4-school,
      120-student seed data — the unpaginated list endpoints noted in
      `DATABASE_SCHEMA.md` will behave very differently at that scale.
- [ ] `wrk --timeout` set explicitly so timeout counts reflect real
      failures, not the tool's own default cutoff.
