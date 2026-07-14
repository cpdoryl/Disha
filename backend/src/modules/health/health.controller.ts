import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * General health check - suitable for load balancers
   * Returns overall service health status
   */
  @Get()
  @ApiOperation({ summary: 'Overall health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-07-14T23:45:00.000Z',
        uptime: 3600,
        environment: 'production',
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Service degraded or unavailable' })
  async health(@Res() res: Response) {
    const result = await this.healthService.getHealth();

    const statusCode =
      result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(result);
  }

  /**
   * Liveness probe - is the application running?
   * Used by orchestration platforms to restart dead containers
   * Keep this very lightweight - just verify the app is still running
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for container orchestration' })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
    schema: {
      example: {
        status: 'alive',
        timestamp: '2026-07-14T23:45:00.000Z',
        uptime: 3600,
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Application is dead' })
  async liveness(@Res() res: Response) {
    const result = await this.healthService.getLiveness();

    const statusCode =
      result.status === 'alive' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(result);
  }

  /**
   * Readiness probe - is the application ready to accept traffic?
   * Used by load balancers to route traffic only to ready instances
   * Checks all critical dependencies (database, cache, etc.)
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for load balancing' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready for traffic',
    schema: {
      example: {
        status: 'ready',
        ready: true,
        timestamp: '2026-07-14T23:45:00.000Z',
        checks: {
          database: { status: 'up', responseTime: 12 },
          memory: { status: 'up', usage: 245 },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready (dependencies unavailable)',
  })
  async readiness(@Res() res: Response) {
    const result = await this.healthService.getReadiness();

    const statusCode =
      result.ready === true ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(result);
  }

  /**
   * Startup probe - has the application finished initialization?
   * Used by orchestration platforms to wait before sending traffic
   * Performs full checks during startup phase
   */
  @Get('startup')
  @ApiOperation({ summary: 'Startup probe for application initialization' })
  @ApiResponse({
    status: 200,
    description: 'Application startup complete',
    schema: {
      example: {
        status: 'started',
        timestamp: '2026-07-14T23:45:00.000Z',
        initializationTime: 5000,
        checks: {
          database: 'connected',
          migrations: 'completed',
          seed: 'verified',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application still initializing',
  })
  async startup(@Res() res: Response) {
    const result = await this.healthService.getStartup();

    const statusCode =
      result.status === 'started' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(result);
  }

  /**
   * Detailed metrics endpoint - provides comprehensive health information
   * Useful for monitoring dashboards and debugging
   * Only accessible to admins or monitoring systems
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Detailed health metrics' })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive health metrics',
    schema: {
      example: {
        timestamp: '2026-07-14T23:45:00.000Z',
        uptime: 3600,
        memory: {
          heapUsed: 245,
          heapTotal: 512,
          external: 12,
          percentage: 48,
        },
        database: {
          status: 'connected',
          responseTime: 12,
          poolSize: 10,
          activeConnections: 3,
        },
        api: {
          requestCount: 1250,
          errorCount: 3,
          averageResponseTime: 45,
          p95ResponseTime: 120,
          p99ResponseTime: 250,
        },
      },
    },
  })
  async metrics(@Res() res: Response) {
    const result = await this.healthService.getMetrics();
    res.status(HttpStatus.OK).json(result);
  }

  /**
   * Deep check endpoint - performs exhaustive health checks
   * Should only be called periodically, not on every load balancer check
   */
  @Get('deep')
  @ApiOperation({ summary: 'Deep health check with all diagnostics' })
  @ApiResponse({
    status: 200,
    description: 'Deep check results',
  })
  async deep(@Res() res: Response) {
    const result = await this.healthService.getDeepCheck();

    const statusCode =
      result.healthy === true ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(result);
  }
}
