# Disha v2.0 - Monitoring Setup

**Status:** COMPLETE | **Owner:** DevOps Lead | **Last Updated:** 2026-07-17
**Companion docs:** [LOAD_TEST_RESULTS.md](./LOAD_TEST_RESULTS.md) · [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md) · [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)

---

## 📋 Table of Contents

1. [The Monitoring Stack Was Provisioned But Not Wired Up](#the-monitoring-stack-was-provisioned-but-not-wired-up)
2. [What Exists Now](#what-exists-now)
3. [Prometheus Configuration](#prometheus-configuration)
4. [Grafana Dashboard Setup](#grafana-dashboard-setup)
5. [The Health-Check Memory Bug](#the-health-check-memory-bug)
6. [Alert Rules and Thresholds](#alert-rules-and-thresholds)
7. [Access Control for Monitoring Endpoints](#access-control-for-monitoring-endpoints)
8. [Monitoring Runbook](#monitoring-runbook)

---

## The Monitoring Stack Was Provisioned But Not Wired Up

Before this pass: `docker-compose.staging.yml` already ran Prometheus and
Grafana containers, `monitoring/prometheus-staging.yml` already configured
Prometheus to scrape `api-staging:3000` (default path `/metrics`), and
`monitoring/grafana-datasources.yml` already pointed Grafana at that
Prometheus instance. All of that infrastructure was real and correctly
wired to *each other*.

What didn't exist: an actual `/metrics` endpoint on the API. There was no
`prom-client` dependency anywhere in `backend/package.json`, and the only
"metrics" in the codebase was `GET /health/metrics` — a custom JSON
endpoint (`{ memory, database, api }`) that a Prometheus scraper can't
parse (Prometheus expects its own text exposition format:
`# HELP`/`# TYPE` comments followed by `metric_name{labels} value` lines).
Prometheus's `disha-api` scrape target would have shown permanently
**DOWN**, and every Grafana panel backed by it would have been empty —
forever, regardless of how correctly everything else was configured.

**Fixed this pass**: added `prom-client`, a shared metrics registry
(`backend/src/common/monitoring/prometheus.ts`), a real `GET /metrics`
endpoint (`backend/src/modules/health/prometheus-metrics.controller.ts`),
and wired request counting into the existing `MetricsMiddleware`. Verified
end-to-end against a running instance — see below.

---

## What Exists Now

```
GET /metrics
```
Unauthenticated (standard Prometheus convention — a scraper can't carry a
JWT; see § Access Control below for how this is actually protected),
outside the `/health` prefix (`/health/metrics` — the pre-existing JSON
endpoint — is unrelated and unchanged).

Verified live output includes:
- **Default Node.js process metrics** (via `prom-client`'s
  `collectDefaultMetrics`): `process_cpu_user_seconds_total`,
  `process_resident_memory_bytes`, `process_heap_bytes`,
  `nodejs_eventloop_lag_seconds`, GC stats, active handles/requests, etc.
- **`disha_http_requests_total`** — Counter, labeled `method` +
  `status_code`. Incremented in `MetricsMiddleware` on every request
  (health-check paths excluded, matching the existing `/health/metrics`
  behavior).
- **`disha_http_request_duration_seconds`** — Histogram, same labels,
  buckets at 10ms/25ms/50ms/100ms/250ms/500ms/1s/2.5s/5s.

Confirmed working:
```bash
curl http://localhost:3001/metrics
# → real Prometheus text-format output, process_* and disha_http_* series present

curl -X POST http://localhost:3001/api/v2/auth/login -d '...'
curl http://localhost:3001/metrics | grep disha_http_requests_total
# → disha_http_requests_total{method="POST",status_code="200"} 1
```

---

## Prometheus Configuration

`monitoring/prometheus-staging.yml` needed **no changes** to its scrape
target once `/metrics` existed — it was already configured for the
default path (no `metrics_path` override), which is exactly right now.
`DEPLOYMENT_GUIDE.md`'s inline `prometheus.yml` template *did* need a
fix — it explicitly set `metrics_path: '/api/v2/metrics'`, which has never
been a real route. Fixed there too (see `INFRASTRUCTURE_SETUP.md` for the
full list of `DEPLOYMENT_GUIDE.md` corrections).

The `nginx`/`postgres` scrape jobs in both the staging config and the
guide's template point at exporter sidecars (`nginx-prometheus-exporter`
on 9113, `postgres_exporter` on 9187) that **aren't deployed anywhere in
this repo**. Leave those jobs commented out or remove them until those
exporters are actually running — an always-down target is noise, not
signal, in Prometheus's own service-health view.

To add them later:
```yaml
# docker-compose.staging.yml — new services
postgres-exporter:
  image: prometheuscommunity/postgres-exporter
  environment:
    DATA_SOURCE_NAME: "postgresql://staging_user:${DB_PASSWORD}@postgres-staging:5432/disha_staging_db?sslmode=disable"
  networks: [disha-staging-network]
```

---

## Grafana Dashboard Setup

`monitoring/grafana-datasources.yml` already provisions Prometheus as a
Grafana datasource correctly — verified its target matches the Prometheus
service name in `docker-compose.staging.yml`. No dashboard JSON exists yet
(`docker-compose.staging.yml` mounts
`./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards`,
but that directory doesn't exist in the repo — Grafana will just show an
empty dashboard list on first boot, which is expected, not broken).

**Minimum useful dashboard**, now that real data flows: a panel per
`disha_http_requests_total` (rate, by status code — watch for a rising
5xx rate), one for `disha_http_request_duration_seconds` (p50/p95/p99 via
`histogram_quantile`), and the default Node process panels (heap, event
loop lag, CPU). `LOAD_TEST_RESULTS.md`'s progressive-load numbers are a
reasonable baseline to compare production values against once this exists.

---

## The Health-Check Memory Bug

Also fixed this pass, discovered while running the real load test that
prompted this whole monitoring push — full details in
`LOAD_TEST_RESULTS.md` § A Real Bug This Test Run Found. Summary: `/health`,
`/health/ready`, and `/health/deep` all gated their pass/fail status on
`heapUsed / heapTotal` crossing 85-90%, but V8 grows `heapTotal`
incrementally rather than starting at a fixed ceiling — a freshly-booted,
completely idle process would routinely report itself `"degraded"` for no
real reason. Fixed to compare RSS against actual system memory
(`os.totalmem()`) instead. This matters for monitoring specifically
because it's exactly the kind of false signal that erodes trust in
alerts — a health check that cries wolf on every deploy gets ignored by
the time it matters.

---

## Alert Rules and Thresholds

No `alert_rules.yml` exists yet (`monitoring/prometheus-staging.yml` has
the `rule_files:` line present but commented out). Suggested starting
set, now that the underlying metrics are real:

| Alert | Condition | Why |
|---|---|---|
| API down | `up{job="disha-api"} == 0` for 2m | Scrape target unreachable |
| High error rate | `rate(disha_http_requests_total{status_code=~"5.."}[5m]) / rate(disha_http_requests_total[5m]) > 0.05` | >5% of requests failing |
| High p99 latency | `histogram_quantile(0.99, rate(disha_http_request_duration_seconds_bucket[5m])) > 1` | p99 over 1s — `LOAD_TEST_RESULTS.md` shows this is normal only past ~500 concurrent connections on an unclustered instance; at low/moderate load it means something's actually wrong |
| Memory pressure | `process_resident_memory_bytes / node_memory_MemTotal_bytes > 0.85` (needs `node_exporter` for the denominator, not yet deployed — see `INFRASTRUCTURE_SETUP.md`) | Real memory pressure, using the same RSS-vs-system-memory logic as the fixed `/health` check |
| Database down | `up{job="postgres"} == 0` (needs `postgres_exporter`, not yet deployed) | |

---

## Access Control for Monitoring Endpoints

`/metrics` is deliberately unauthenticated at the application layer — a
Prometheus scraper has no way to carry a JWT, and adding one would just
mean storing a static token in Prometheus's config, which isn't
meaningfully more secure than network-level restriction. The actual
control is at the network/proxy layer:

- **`nginx.conf`** (fixed this pass) now has an explicit `/metrics`
  location that `allow`s only `127.0.0.1` and denies everything else —
  update the commented-out line with your actual Prometheus server's
  IP/CIDR before relying on it.
- **`docker-compose.staging.yml`** doesn't publish the API's `/metrics`
  path externally at all by default — Prometheus reaches it over the
  internal `disha-staging-network`, not through the public Nginx.
- **Never** map the API's container port directly to a public host port
  without going through Nginx's access-controlled `/metrics` location —
  that would expose it with no restriction at all.

Grafana and Prometheus's own UIs (ports 3001/9090 in
`docker-compose.staging.yml`) should sit behind the firewall rules in
`INFRASTRUCTURE_SETUP.md` § Firewall Rules — internal/VPN access only,
not public.

---

## Monitoring Runbook

**Deploying a change:** watch `disha_http_requests_total{status_code=~"5.."}`
and `/health` for the few minutes after rollout — this is now a
trustworthy signal post-fix, unlike before.

**Investigating high latency:** check `disha_http_request_duration_seconds`
by endpoint (add a `route` label if you need per-endpoint granularity —
not currently labeled, only `method`+`status_code`), cross-reference
against `LOAD_TEST_RESULTS.md`'s known single-instance ceiling before
assuming it's a code regression rather than a capacity limit.

**A scrape target shows DOWN:** check the container is actually running
(`docker-compose -f docker-compose.staging.yml ps`) before assuming the
app is broken — `nginx`/`postgres` exporter jobs are *expected* to show
DOWN until those exporters are deployed (see § Prometheus Configuration).
