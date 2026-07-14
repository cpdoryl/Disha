import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  [key: string]: any;
}

interface ReadinessStatus {
  status: string;
  ready: boolean;
  timestamp: string;
  checks: { [key: string]: any };
}

interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentage: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private readonly startupTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;
  private responseTimes: number[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get overall health status
   * Used by general health checks and monitoring systems
   */
  async getHealth(): Promise<HealthStatus> {
    try {
      const dbHealthy = await this.checkDatabaseHealth();
      const memoryHealthy = this.checkMemoryHealth();
      const uptime = this.getUptime();

      const status = dbHealthy && memoryHealthy ? 'ok' : 'degraded';

      return {
        status,
        timestamp: new Date().toISOString(),
        uptime,
        environment: process.env.NODE_ENV || 'production',
        version: '2.0.0',
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Liveness probe - is the app still running?
   * Keep this extremely fast and simple
   */
  async getLiveness(): Promise<{ status: string; timestamp: string; uptime: number }> {
    try {
      // Just verify the app is responding - no external calls
      return {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
      };
    } catch (error) {
      this.logger.error('Liveness check failed', error);
      return {
        status: 'dead',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
      };
    }
  }

  /**
   * Readiness probe - is the app ready to accept traffic?
   * Checks critical dependencies but timeout quickly
   */
  async getReadiness(): Promise<ReadinessStatus> {
    const checks: { [key: string]: any } = {};
    let ready = true;

    // Check database with timeout
    try {
      const startTime = Date.now();
      checks.database = await Promise.race([
        this.checkDatabaseHealth().then((healthy) => ({
          status: healthy ? 'up' : 'down',
          responseTime: Date.now() - startTime,
        })),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000),
        ),
      ]);
    } catch (error) {
      checks.database = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      ready = false;
    }

    // Check memory
    try {
      const memory = this.getMemoryUsage();
      checks.memory = {
        status: memory.percentage < 90 ? 'up' : 'warning',
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        percentage: memory.percentage,
      };

      if (memory.percentage > 90) {
        ready = false;
      }
    } catch (error) {
      checks.memory = {
        status: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return {
      status: ready ? 'ready' : 'not_ready',
      ready,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Startup probe - has initialization completed?
   * Performs comprehensive checks to ensure app is ready for production
   */
  async getStartup(): Promise<{
    status: string;
    timestamp: string;
    initializationTime: number;
    checks: { [key: string]: string };
  }> {
    const checks: { [key: string]: string } = {};
    const initializationTime = Date.now() - this.startupTime;

    // Check database connection
    try {
      const isConnected = this.dataSource.isInitialized;
      checks.database = isConnected ? 'connected' : 'not_connected';
    } catch (error) {
      checks.database = 'error';
    }

    // Check if migrations were run
    try {
      const migrations = await this.dataSource.query(
        "SELECT COUNT(*) as count FROM migrations WHERE success = true",
      );
      checks.migrations = migrations[0]?.count > 0 ? 'completed' : 'pending';
    } catch (error) {
      checks.migrations = 'unknown';
    }

    // Verify seed data exists (check if test users exist)
    try {
      const userCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM users',
      );
      checks.seed = userCount[0]?.count > 0 ? 'verified' : 'empty';
    } catch (error) {
      checks.seed = 'unknown';
    }

    const allChecksGood = Object.values(checks).every(
      (status) => status !== 'error' && status !== 'not_connected',
    );

    return {
      status: allChecksGood ? 'started' : 'starting',
      timestamp: new Date().toISOString(),
      initializationTime,
      checks,
    };
  }

  /**
   * Detailed metrics endpoint
   * Provides comprehensive information for monitoring dashboards
   */
  async getMetrics(): Promise<{
    timestamp: string;
    uptime: number;
    memory: MemoryInfo;
    database: any;
    api: any;
  }> {
    const memory = this.getMemoryUsage();

    // Calculate API metrics
    const averageResponseTime =
      this.requestCount > 0 ? Math.round(this.totalResponseTime / this.requestCount) : 0;
    const errorRate =
      this.requestCount > 0 ? ((this.errorCount / this.requestCount) * 100).toFixed(2) : '0.00';

    // Calculate percentiles
    const sortedTimes = this.responseTimes.sort((a, b) => a - b);
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    // Database info
    let databaseInfo = {
      status: 'unknown',
      responseTime: 0,
      poolSize: 0,
      activeConnections: 0,
    };

    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      databaseInfo.responseTime = Date.now() - startTime;
      databaseInfo.status = 'connected';

      // Try to get connection pool info (if available)
      try {
        const driver = this.dataSource.driver as any;
        if (driver?.pool) {
          databaseInfo.poolSize = driver.pool.totalCount || 0;
          databaseInfo.activeConnections = driver.pool.activeCount || 0;
        }
      } catch {
        // Pool info not available, continue
      }
    } catch (error) {
      databaseInfo.status = 'error';
    }

    return {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      memory,
      database: databaseInfo,
      api: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        errorRate: `${errorRate}%`,
        averageResponseTime,
        p95ResponseTime: p95,
        p99ResponseTime: p99,
      },
    };
  }

  /**
   * Deep health check - exhaustive diagnostics
   * Should not be called frequently
   */
  async getDeepCheck(): Promise<{
    healthy: boolean;
    timestamp: string;
    checks: { [key: string]: any };
  }> {
    const checks: { [key: string]: any } = {};
    let healthy = true;

    // Database connectivity
    try {
      const startTime = Date.now();
      const isConnected = this.dataSource.isInitialized;
      const responseTime = Date.now() - startTime;

      if (isConnected) {
        // Perform actual query
        await this.dataSource.query('SELECT 1');
        checks.database = {
          status: 'healthy',
          connected: true,
          responseTime,
        };
      } else {
        checks.database = {
          status: 'unhealthy',
          connected: false,
        };
        healthy = false;
      }
    } catch (error) {
      checks.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      healthy = false;
    }

    // Table existence check
    try {
      const tables: any[] = await this.dataSource.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
      );
      checks.tables = {
        status: tables.length > 0 ? 'present' : 'missing',
        count: tables.length,
        tables: tables.map((t: any) => t.table_name),
      };
    } catch (error) {
      checks.tables = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Memory check
    const memory = this.getMemoryUsage();
    checks.memory = {
      status: memory.percentage < 85 ? 'healthy' : 'warning',
      ...memory,
    };

    if (memory.percentage > 85) {
      healthy = false;
    }

    // Environment check
    checks.environment = {
      nodeEnv: process.env.NODE_ENV || 'production',
      port: process.env.PORT || 3000,
      uptime: this.getUptime(),
    };

    return {
      healthy,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Check database health
   * Returns true if database is accessible and responsive
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        return false;
      }

      // Perform a simple query with timeout
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 3000),
        ),
      ]);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('Database health check failed', errorMessage);
      return false;
    }
  }

  /**
   * Check memory health
   * Returns true if memory usage is below 85% threshold
   */
  private checkMemoryHealth(): boolean {
    const memory = this.getMemoryUsage();
    return memory.percentage < 85; // Warn at 85%, fail at 95%
  }

  /**
   * Get memory usage information in MB
   */
  private getMemoryUsage(): MemoryInfo {
    const memUsage = process.memoryUsage();
    const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
    const external = Math.round(memUsage.external / 1024 / 1024);
    const rss = Math.round(memUsage.rss / 1024 / 1024);
    const percentage = Math.round((heapUsed / heapTotal) * 100);

    return {
      heapUsed,
      heapTotal,
      external,
      rss,
      percentage,
    };
  }

  /**
   * Get application uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Track API request for metrics
   * Call this from middleware to track all requests
   */
  trackRequest(statusCode: number, responseTime: number): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times to avoid memory issues
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Track errors (5xx status codes)
    if (statusCode >= 500) {
      this.errorCount++;
    }
  }
}
