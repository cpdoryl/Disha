import * as client from 'prom-client';

// A single shared registry for the whole process. Prometheus is already
// provisioned in docker-compose.staging.yml + monitoring/prometheus-staging.yml,
// configured to scrape this app's default /metrics path — but until this
// file existed, there was no prom-client dependency and no /metrics route
// anywhere in the codebase, so that scrape target was always a 404. See
// MONITORING_SETUP.md for the full story.
export const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'disha_http_requests_total',
  help: 'Total HTTP requests, labeled by method and status code',
  labelNames: ['method', 'status_code'],
  registers: [register],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'disha_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'status_code'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});
