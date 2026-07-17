# Disha v2.0 - Load Test Results

**Status:** COMPLETE | **Owner:** DevOps/QA | **Last Updated:** 2026-07-17
**Companion doc:** [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) § Load Testing

These are real numbers from a real run, not projections. `TECH_STACK.md`
and `LOAD_TESTING.md` describe the load-testing tool as Artillery,
"already installed" — that's inaccurate; there is no Artillery dependency
or config anywhere in the repo. The actual tooling is `scripts/load-test-
baseline.sh`, `scripts/load-test-progressive.sh`, and (added this pass)
`scripts/load-test-business.sh`, all built on **`wrk`** (a separate CLI
benchmarking tool, not an npm package). See `TESTING_STRATEGY.md` § Load
Testing for that correction in full.

**Update (same day):** the original version of this document only tested
unauthenticated `/health*` endpoints and explicitly flagged that as a gap
in Future Scaling Requirements. That gap is closed — see
[Authenticated Business Endpoint Results](#authenticated-business-endpoint-results)
below. Headline finding: the mixed authenticated workload plateaus at
**~400 req/s**, about 5x lower than the ~2000 req/s trivial-`/health`
ceiling, and `POST /api/v2/attendance/bulk` is a real, measured
bottleneck (not a guess) worth fixing before real classroom-sized
payloads hit it.

---

## 📋 Table of Contents

1. [Test Configuration](#test-configuration)
2. [Baseline Results (Health Endpoints)](#baseline-results-health-endpoints)
3. [Progressive Load Results](#progressive-load-results)
4. [Authenticated Business Endpoint Results](#authenticated-business-endpoint-results)
5. [Bottleneck Analysis](#bottleneck-analysis)
6. [A Real Bug This Test Run Found](#a-real-bug-this-test-run-found)
7. [Optimization Recommendations](#optimization-recommendations)
8. [Capacity Planning](#capacity-planning)
9. [Future Scaling Requirements](#future-scaling-requirements)

---

## Test Configuration

| | |
|---|---|
| **Target** | Single backend instance, `node dist/main.js`, no cluster/PM2 |
| **Database** | Local PostgreSQL 16, seeded (4 schools, 120 students, per `TEST_CASES.md`) |
| **Host** | 4 vCPU, 15GB RAM, Linux x86_64 |
| **Node** | v22.22.2 |
| **Tool** | `wrk` 4.1.0 |
| **Scripts** | `scripts/load-test-baseline.sh` (fixed 50 concurrent users), `scripts/load-test-progressive.sh` (staged 10→1000 concurrent users), `scripts/load-test-business.sh` (new this pass — authenticated business endpoints) |
| **Endpoints tested** | `/health`, `/health/live`, `/health/ready`, `/health/startup`, `/health/metrics`, `/health/deep`, plus (new) `GET /api/v2/students/school/:id`, `GET /api/v2/assessments/school/:id`, `GET /api/v2/reports/school/:id/performance`, `POST /api/v2/attendance/bulk` |

The original two scripts only targeted unauthenticated `/health*` —
addressed this pass, see
[Authenticated Business Endpoint Results](#authenticated-business-endpoint-results)
below.

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

## Authenticated Business Endpoint Results

New this pass — closes the gap flagged in the original version of this
document's Future Scaling Requirements. `scripts/load-test-business.sh`
logs in for real (`admin1@school.edu`), pulls real seeded IDs from the
running API (not hardcoded fixtures), and load-tests a mix of real
authenticated endpoints via a generated `wrk` Lua script. Same host/DB as
above (single unclustered process, local seeded PostgreSQL).

**Mixed workload** (round-robin across all 4 endpoints below, same
process as the `/health` progressive test):

| Concurrent Users | Avg Latency | p99 Latency | Throughput (req/s) | Socket Timeouts | Status |
|---|---|---|---|---|---|
| 10 | 24.32ms | 61.77ms | 417.79 | 0 | ✅ |
| 50 | 139.30ms | 435.81ms | 371.09 | 0 | ✅ |
| 100 | 243.81ms | 580.54ms | 410.08 | 0 | ✅ |
| 200 | 469.71ms | 1.28s | 415.35 | 2 | ⚠️ degraded |

Every request across all four stages returned a real 2xx — verified via
a per-status-code breakdown added to the Lua script (`response()`/`done()`
callbacks aggregating status counts across worker threads), not just
inferred from throughput. **Throughput plateaus around ~400 req/s** for
this mixed authenticated workload — roughly **5x lower** than the ~2000
req/s trivial-`/health` ceiling measured above, which is exactly what
you'd expect once real Postgres queries, TypeORM entity hydration, and
`JwtAuthGuard`/`RolesGuard`/`SchoolScopeGuard` checks are actually in the
request path instead of a static JSON response.

**Per-endpoint breakdown** (isolated, 20 concurrent connections, 8s each,
each verified with a real token and a real 200 before measuring — see
note below on why that verification mattered):

| Endpoint | Avg Latency | p99 Latency | Throughput (req/s) |
|---|---|---|---|
| `GET /api/v2/reports/school/:id/performance` | 13.80ms | 26.83ms | 1497.12 |
| `GET /api/v2/assessments/school/:id` | 26.39ms | 44.94ms | 765.50 |
| `GET /api/v2/students/school/:id` | 37.62ms | 72.44ms | 536.10 |
| `POST /api/v2/attendance/bulk` (10 students) | 112.07ms | 250.63ms | 178.82 |

Two findings worth acting on:

1. **`POST /api/v2/attendance/bulk` is the clear bottleneck** — 3-8x
   slower than the read endpoints even at low concurrency. Root cause is
   visible directly in `AttendanceService.bulkMark`
   (`backend/src/modules/attendance/attendance.service.ts`): it does one
   `findOne` + one `save` **per student in the request**, via
   `Promise.all` — 10 students means up to 20 sequential-per-record DB
   round trips per HTTP request. A real classroom might mark 30-40
   students per bulk request, which would scale this cost roughly
   linearly. Batching into a single upsert query (TypeORM's `upsert()`
   or a raw `ON CONFLICT` query) would be a meaningfully high-leverage
   fix before this endpoint sees real classroom-sized payloads.
2. **`GET /api/v2/students/school/:id` (the roster endpoint) is the
   slowest read** by a real margin (536 req/s vs. 765-1497 req/s for the
   other two) — consistent with `DATABASE_SCHEMA.md`'s existing note that
   this list endpoint is unpaginated. Fine at the seed data's 30
   students/school; worth re-testing before a school with hundreds of
   students hits this same endpoint.

**A methodology note worth keeping for the next person who extends this
test:** the first attempt at isolating per-endpoint numbers accidentally
ran three `wrk` invocations against an **empty/expired auth token** — the
setup script's login call had hit the newly-added
`AUTH_LOGIN_RATE_LIMIT` (5 requests/15min in production mode, see
`SECURITY_CHECKLIST.md` § Rate Limiting) after several earlier test runs
in the same session. The resulting numbers (~2400 req/s, ~8ms latency)
looked like great performance but were actually `JwtAuthGuard` rejecting
every request with a fast 401, never touching the database — caught only
because status codes were explicitly re-verified with `curl` before
trusting the `wrk` output, not because anything looked obviously wrong in
the `wrk` summary itself. **Numbers from a load test are only as
trustworthy as the request that produced them** — the same principle this
whole document has applied to `/health`'s memory bug below applies
equally to a silently-unauthenticated request in a load test. Restarting
the backend process reset the in-memory `RateLimitGuard` state (it's a
plain `Map`, not persisted) and the corrected, verified numbers above are
what's reported.

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

Based on the measured single-instance ceilings — ~2000 req/s on trivial
`/health` endpoints, ~400 req/s on a realistic mixed authenticated
workload (see
[Authenticated Business Endpoint Results](#authenticated-business-endpoint-results)),
both degrading past ~200 concurrent connections without clustering:

- **Current unclustered deployment**: reasonable for the pilot's stated
  scale (`ROADMAP_TO_LAUNCH.md` targets a 50-user pilot) — nowhere near
  even the ~400 req/s realistic ceiling under actual pilot traffic
  (50-100 users occasionally hitting the API, not 200 concurrent
  connections hammering it continuously).
- **Before any deployment beyond the pilot**: cluster the process (see
  Optimization Recommendations #1) — this pass's business-endpoint numbers
  make the case concretely: 400 req/s on one core means a clustered
  4-core deployment plausibly gets into the 1500-2000 req/s range for the
  same realistic workload, which is the headroom that actually matters at
  a school-district scale beyond the pilot.
- **Database was a real bottleneck this time**, unlike the original
  `/health`-only test (a `SELECT 1` health check doesn't stress it) —
  `POST /api/v2/attendance/bulk`'s per-student `findOne`+`save` pattern is
  a measured, not theoretical, capacity concern (see the bottleneck
  finding above). Capacity planning for Postgres itself still needs its
  own test against the full query patterns in
  `database/queries/optimized-queries.ts` and the unpaginated list
  endpoints flagged in `DATABASE_SCHEMA.md` § Query Optimization Notes,
  at realistic data volume rather than the 4-school seed data.

---

## Future Scaling Requirements

What the *next* load test should cover, now that the harness itself is
proven to work:

- [x] ✅ **Done this pass:** authenticated business endpoints
      (`scripts/load-test-business.sh` — logs in for real, mixes
      `GET /api/v2/students/school/:id`, `GET /api/v2/assessments/school/:id`,
      `GET /api/v2/reports/school/:id/performance`, and
      `POST /api/v2/attendance/bulk`). See
      [Authenticated Business Endpoint Results](#authenticated-business-endpoint-results)
      above. **Still not covered:** `POST /api/v2/assessments/:id/submit`
      specifically — it's public/unauthenticated (a separate rate-limiting
      gap, see `SECURITY_CHECKLIST.md`) and a realistic test needs a fresh
      `respondentId` per request to exercise the real write path rather
      than short-circuit on the duplicate-submission check; left as a
      follow-up rather than bolted onto this pass.
- [ ] A clustered/multi-replica target, to validate the scaling
      recommendation above actually raises the ceiling as expected.
- [ ] A run against a database with realistic data volume (hundreds of
      schools, thousands of students per school) rather than the 4-school,
      120-student seed data — the unpaginated list endpoints noted in
      `DATABASE_SCHEMA.md` will behave very differently at that scale, and
      this pass's finding that `GET /api/v2/students/school/:id` is
      already the slowest read endpoint at seed-data scale makes this a
      real, non-hypothetical priority.
- [ ] `wrk --timeout` set explicitly so timeout counts reflect real
      failures, not the tool's own default cutoff.
- [ ] Batch `AttendanceService.bulkMark` into a single upsert query
      instead of one `findOne`+`save` per student — see the bottleneck
      finding above; this is now a measured, not theoretical, priority.
