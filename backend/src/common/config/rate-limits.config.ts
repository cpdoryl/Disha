import { RateLimitConfig } from '../guards/rate-limit.guard';

/**
 * Predefined rate limit configurations for different endpoint categories
 * Adjustable based on environment and requirements
 */

/**
 * Strict rate limits (authentication endpoints)
 * Prevent brute force attacks on login
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  name: 'strict',
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  type: 'ip',
  message: 'Too many login attempts. Please try again later.',
};

/**
 * Moderate rate limits (most API endpoints)
 * Standard rate limiting for regular API usage
 */
export const MODERATE_RATE_LIMIT: RateLimitConfig = {
  name: 'moderate',
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  type: 'both', // Per IP and per authenticated user
  message: 'API rate limit exceeded. Please try again later.',
};

/**
 * Relaxed rate limits (internal/trusted endpoints)
 * Higher limits for bulk operations or internal APIs
 */
export const RELAXED_RATE_LIMIT: RateLimitConfig = {
  name: 'relaxed',
  maxRequests: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user', // Per authenticated user only
  message: 'Rate limit exceeded for bulk operations.',
};

/**
 * Public endpoints rate limits
 * Lower limits for unauthenticated public endpoints
 */
export const PUBLIC_RATE_LIMIT: RateLimitConfig = {
  name: 'public',
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  type: 'ip',
  message: 'Public endpoint rate limit exceeded.',
};

/**
 * Authentication endpoints (login, refresh, register)
 * Very strict to prevent brute force
 */
export const AUTH_LOGIN_RATE_LIMIT: RateLimitConfig = {
  name: 'auth_login',
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  type: 'ip',
  message: 'Too many login attempts. Please try again after 15 minutes.',
};

export const AUTH_REFRESH_RATE_LIMIT: RateLimitConfig = {
  name: 'auth_refresh',
  maxRequests: 30,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
  message: 'Too many refresh token requests.',
};

/**
 * School operations rate limits
 */
export const SCHOOL_LIST_RATE_LIMIT: RateLimitConfig = {
  name: 'school_list',
  maxRequests: 200,
  windowMs: 15 * 60 * 1000, // 15 minutes
  type: 'both',
};

export const SCHOOL_CREATE_RATE_LIMIT: RateLimitConfig = {
  name: 'school_create',
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
};

export const SCHOOL_UPDATE_RATE_LIMIT: RateLimitConfig = {
  name: 'school_update',
  maxRequests: 50,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
};

/**
 * Student operations rate limits
 */
export const STUDENT_LIST_RATE_LIMIT: RateLimitConfig = {
  name: 'student_list',
  maxRequests: 300,
  windowMs: 15 * 60 * 1000, // 15 minutes
  type: 'both',
};

export const STUDENT_CREATE_RATE_LIMIT: RateLimitConfig = {
  name: 'student_create',
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
};

/**
 * Assessment operations rate limits
 */
export const ASSESSMENT_SUBMIT_RATE_LIMIT: RateLimitConfig = {
  name: 'assessment_submit',
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour per assessment
  type: 'user',
};

/**
 * Bulk/Export operations rate limits
 * Lower limits to protect database
 */
export const BULK_EXPORT_RATE_LIMIT: RateLimitConfig = {
  name: 'bulk_export',
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
};

export const BULK_IMPORT_RATE_LIMIT: RateLimitConfig = {
  name: 'bulk_import',
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
};

/**
 * Report generation rate limits
 */
export const REPORT_GENERATION_RATE_LIMIT: RateLimitConfig = {
  name: 'report_generation',
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
};

/**
 * Notification sending rate limits
 */
export const NOTIFICATION_SEND_RATE_LIMIT: RateLimitConfig = {
  name: 'notification_send',
  maxRequests: 50,
  windowMs: 60 * 60 * 1000, // 1 hour
  type: 'user',
};

/**
 * Get rate limit based on environment
 * Adjusts limits for development vs production
 */
export function getRateLimitConfig(
  baseConfig: RateLimitConfig,
  environment?: string,
): RateLimitConfig {
  const env = environment || process.env.NODE_ENV || 'development';

  if (env === 'development') {
    // Much higher limits for development
    return {
      ...baseConfig,
      maxRequests: baseConfig.maxRequests * 10,
    };
  }

  if (env === 'testing') {
    // Disable rate limiting for testing
    return {
      ...baseConfig,
      maxRequests: 999999,
    };
  }

  return baseConfig;
}

/**
 * Rate limit presets by category
 * Easy to apply consistent limits across similar endpoints
 */
export const RATE_LIMIT_PRESETS = {
  strict: STRICT_RATE_LIMIT,
  moderate: MODERATE_RATE_LIMIT,
  relaxed: RELAXED_RATE_LIMIT,
  public: PUBLIC_RATE_LIMIT,
  auth: {
    login: AUTH_LOGIN_RATE_LIMIT,
    refresh: AUTH_REFRESH_RATE_LIMIT,
  },
  school: {
    list: SCHOOL_LIST_RATE_LIMIT,
    create: SCHOOL_CREATE_RATE_LIMIT,
    update: SCHOOL_UPDATE_RATE_LIMIT,
  },
  student: {
    list: STUDENT_LIST_RATE_LIMIT,
    create: STUDENT_CREATE_RATE_LIMIT,
  },
  assessment: {
    submit: ASSESSMENT_SUBMIT_RATE_LIMIT,
  },
  bulk: {
    export: BULK_EXPORT_RATE_LIMIT,
    import: BULK_IMPORT_RATE_LIMIT,
  },
  report: {
    generate: REPORT_GENERATION_RATE_LIMIT,
  },
  notification: {
    send: NOTIFICATION_SEND_RATE_LIMIT,
  },
};
