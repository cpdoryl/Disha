import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../../modules/health/health.service';

/**
 * Middleware to track API request metrics
 * Measures response time and status codes for health monitoring
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly healthService: HealthService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip health check endpoints from metrics tracking
    if (req.path.startsWith('/health')) {
      return next();
    }

    const startTime = Date.now();

    // Hook into response finish to track metrics
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Track the request
      try {
        this.healthService.trackRequest(statusCode, responseTime);
      } catch (error) {
        // Silently fail - metrics tracking shouldn't break the app
        console.error('Failed to track metrics:', error);
      }
    });

    next();
  }
}
