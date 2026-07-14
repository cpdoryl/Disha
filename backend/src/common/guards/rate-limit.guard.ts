import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * In-memory rate limiter for API endpoints
 * Tracks requests per IP/user and enforces limits
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requestMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get rate limit config from decorator
    const rateLimit = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());

    if (!rateLimit) {
      return true; // No rate limit configured
    }

    // Get identifier (IP or user ID)
    const identifier = this.getIdentifier(request, rateLimit.type);
    const key = `${identifier}:${rateLimit.name || 'global'}`;

    // Check current limits
    const now = Date.now();
    let data = this.requestMap.get(key);

    // Reset if window expired
    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + rateLimit.windowMs,
      };
      this.requestMap.set(key, data);
    }

    // Increment request count
    data.count++;

    // Set rate limit headers
    const remaining = Math.max(0, rateLimit.maxRequests - data.count);
    const resetAt = Math.ceil(data.resetTime / 1000);

    response.setHeader('X-RateLimit-Limit', rateLimit.maxRequests);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetAt);

    // Check if limit exceeded
    if (data.count > rateLimit.maxRequests) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000);
      response.setHeader('Retry-After', retryAfter);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please retry after ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Get identifier for rate limiting
   * Can be based on IP address or authenticated user ID
   */
  private getIdentifier(request: any, type: 'ip' | 'user' | 'both'): string {
    let identifier = '';

    if (type === 'ip' || type === 'both') {
      identifier += this.getClientIp(request);
    }

    if (type === 'user' || type === 'both') {
      const user = request.user?.userId || request.user?.sub;
      if (user) {
        identifier += `:${user}`;
      }
    }

    return identifier || this.getClientIp(request);
  }

  /**
   * Extract client IP from request
   * Handles proxied requests (X-Forwarded-For, etc)
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Clear rate limit data (for testing or manual reset)
   */
  clearLimit(key: string): void {
    this.requestMap.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requestMap.clear();
  }

  /**
   * Get current rate limit stats
   */
  getStats() {
    return {
      activeKeys: this.requestMap.size,
      entries: Array.from(this.requestMap.entries()).map(([key, data]) => ({
        key,
        count: data.count,
        resetTime: new Date(data.resetTime),
      })),
    };
  }
}

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  name?: string; // Name for the limit (for logging)
  maxRequests: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
  type: 'ip' | 'user' | 'both'; // How to identify requester
  message?: string; // Custom error message
}

/**
 * Rate limit decorator
 * Usage: @RateLimit({ maxRequests: 100, windowMs: 60000, type: 'ip' })
 */
export const RateLimit = (config: RateLimitConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', config, descriptor?.value || target);
  };
};
