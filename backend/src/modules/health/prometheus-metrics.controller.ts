import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { register } from '../../common/monitoring/prometheus';

// Deliberately unauthenticated and outside the /health prefix — Prometheus
// itself expects the default scrape path to be /metrics (see
// monitoring/prometheus-staging.yml, which doesn't override metrics_path),
// and a scraper can't carry a JWT. This is standard Prometheus convention;
// restrict network access to it at the infrastructure layer (see
// MONITORING_SETUP.md), not at the application layer.
@ApiExcludeController()
@Controller('metrics')
export class PrometheusMetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
}
