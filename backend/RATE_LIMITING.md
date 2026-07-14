# Rate Limiting Guide

This document explains rate limiting implementation in Disha v2.0 API.

## Overview

Rate limiting protects the API by:
- Preventing brute force attacks on authentication endpoints
- Protecting against accidental API abuse
- Ensuring fair resource allocation among users
- Protecting database from overload
- Defending against DDoS attacks

## Rate Limit Categories

### Authentication (Strict)
```
5 requests per 15 minutes per IP
```
Prevents brute force login attempts.

```bash
GET /api/v2/auth/login      # 5 attempts / 15 min
POST /api/v2/auth/refresh   # 30 attempts / 1 hour
POST /api/v2/auth/logout    # 100 attempts / 1 hour
```

### API Endpoints (Moderate)
```
100 requests per 15 minutes per IP/User
```
Standard limits for most API endpoints.

```bash
GET /api/v2/schools         # 200 per 15 min
GET /api/v2/students        # 300 per 15 min
GET /api/v2/assessments     # 100 per 15 min
```

### Create Operations (Restrictive)
```
20-100 requests per hour per user
```
Prevents bulk creation without explicit bulk API.

```bash
POST /api/v2/schools        # 20 per hour
POST /api/v2/students       # 100 per hour
POST /api/v2/assessments    # 10 per hour
```

### Bulk Operations (Very Restrictive)
```
5 requests per hour per user
```
Protects database from bulk import/export.

```bash
POST /api/v2/data/import        # 5 per hour
GET /api/v2/data/export         # 5 per hour
POST /api/v2/students/bulk      # 5 per hour
```

## Implementation

### Using Rate Limit Decorator

Apply to individual endpoints:

```typescript
import { RateLimit } from 'src/common/guards/rate-limit.guard';
import { RATE_LIMIT_PRESETS } from 'src/common/config/rate-limits.config';

@Controller('api/v2/auth')
export class AuthController {
  
  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit(RATE_LIMIT_PRESETS.auth.login)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit(RATE_LIMIT_PRESETS.auth.refresh)
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshTokens(
      refreshDto.refreshToken,
      refreshDto.userId
    );
  }
}
```

### Using Class-Level Limits

Apply to all methods in controller:

```typescript
@Controller('api/v2/schools')
@UseGuards(RateLimitGuard)
@RateLimit(RATE_LIMIT_PRESETS.school.list)
export class SchoolController {
  
  @Get()
  async listSchools(@Query() query: SchoolListQueryDto) {
    return this.schoolService.listSchools(query);
  }

  @Get(':id')
  async getSchool(@Param('id') schoolId: string) {
    return this.schoolService.getSchool(schoolId);
  }
}
```

### Custom Rate Limits

Define custom limits for specific use cases:

```typescript
@Post('bulk-import')
@UseGuards(RateLimitGuard)
@RateLimit({
  name: 'bulk-student-import',
  maxRequests: 3,
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  type: 'user',
  message: 'Only 3 bulk imports per day allowed'
})
async bulkImportStudents(@Body() data: any) {
  return this.studentService.bulkImport(data);
}
```

## Response Headers

Rate limit information is returned in response headers:

```
X-RateLimit-Limit: 5          # Max requests allowed
X-RateLimit-Remaining: 2      # Requests remaining
X-RateLimit-Reset: 1721075200 # Unix timestamp when limit resets
Retry-After: 890              # Seconds to wait before retrying (if rate limited)
```

## Status Codes

### 200 OK
Request succeeded, within limits.

```json
{
  "X-RateLimit-Remaining": 99,
  "X-RateLimit-Reset": 1721075200
}
```

### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please retry after 890 seconds.",
  "retryAfter": 890
}
```

## Rate Limit Types

### IP-Based (`type: 'ip'`)
```
Limits per client IP address
Example: 5 login attempts per IP per 15 minutes
```

**Use for:**
- Authentication endpoints (prevent brute force)
- Public endpoints (prevent scraping)
- Unauthenticated endpoints

**Example:**
```typescript
@RateLimit({
  type: 'ip',
  maxRequests: 5,
  windowMs: 15 * 60 * 1000
})
async login() { }
```

### User-Based (`type: 'user'`)
```
Limits per authenticated user
Example: 100 requests per user per hour
```

**Use for:**
- Authenticated endpoints
- Bulk operations
- Resource-intensive operations

**Example:**
```typescript
@RateLimit({
  type: 'user',
  maxRequests: 100,
  windowMs: 60 * 60 * 1000
})
async listSchools() { }
```

### Both (`type: 'both'`)
```
Limits per both IP and authenticated user
Stricter of the two limits applies
```

**Use for:**
- Regular API endpoints
- Prevents both external and internal abuse

**Example:**
```typescript
@RateLimit({
  type: 'both',
  maxRequests: 100,
  windowMs: 15 * 60 * 1000
})
async getSchools() { }
```

## Testing Rate Limits

### Simulate Rate Limiting

```bash
# Make 10 rapid requests
for i in {1..10}; do
  curl -i http://localhost:3000/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"wrong"}' \
    -H "X-Forwarded-For: 192.168.1.1"
done
```

Expected output after 5 requests:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1721075200
Retry-After: 895

{
  "statusCode": 429,
  "message": "Too many requests. Please retry after 895 seconds.",
  "retryAfter": 895
}
```

### Check Rate Limit Headers

```bash
curl -v http://localhost:3000/api/v2/schools \
  -H "Authorization: Bearer $TOKEN"
```

Look for headers:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 199
X-RateLimit-Reset: 1721075200
```

### Monitor Rate Limit Stats

```typescript
// In a debug endpoint
@Get('debug/rate-limits')
getRateLimitStats(@Inject(RateLimitGuard) guard: RateLimitGuard) {
  return guard.getStats();
}
```

Response:
```json
{
  "activeKeys": 45,
  "entries": [
    {
      "key": "192.168.1.1:auth_login",
      "count": 3,
      "resetTime": "2026-07-14T10:30:00.000Z"
    }
  ]
}
```

## Recommended Limits by Endpoint

### Authentication
```
POST /auth/login           5 per 15 min (IP)
POST /auth/refresh        30 per 1 hour (User)
POST /auth/logout        100 per 1 hour (User)
```

### Schools
```
GET /schools             200 per 15 min (Both)
GET /schools/:id        500 per 15 min (Both)
POST /schools            20 per 1 hour (User)
PATCH /schools/:id       50 per 1 hour (User)
```

### Students
```
GET /students           300 per 15 min (Both)
GET /students/:id       500 per 15 min (Both)
POST /students          100 per 1 hour (User)
PATCH /students/:id     200 per 1 hour (User)
```

### Assessments
```
GET /assessments        100 per 15 min (Both)
POST /assessments        20 per 1 hour (User)
POST /assessments/submit 10 per 1 hour (User)
```

### Bulk Operations
```
POST /data/import         5 per 1 day (User)
GET /data/export          5 per 1 day (User)
POST /students/bulk       5 per 1 day (User)
```

## Environment-Specific Configuration

### Development

```typescript
// 10x higher limits for testing
getRateLimitConfig(RATE_LIMIT_PRESETS.auth.login, 'development')
// Result: 50 requests per 15 minutes
```

### Testing

```typescript
// Disable rate limiting
getRateLimitConfig(RATE_LIMIT_PRESETS.auth.login, 'testing')
// Result: 999999 requests (effectively disabled)
```

### Production

```typescript
// Standard limits
getRateLimitConfig(RATE_LIMIT_PRESETS.auth.login, 'production')
// Result: 5 requests per 15 minutes
```

## Handling Rate Limit Errors

### Client-Side Retry Logic

```typescript
async function fetchWithRetry(url: string, options: any = {}) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}
```

### React Hook with Rate Limit Handling

```typescript
function useFetchWithRateLimit(url: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setRateLimited(false);

    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        setRateLimited(true);
        setError(`Rate limited. Retry after ${retryAfter} seconds`);
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, rateLimited, fetch };
}
```

## Monitoring & Alerts

### Monitor Rate Limit Usage

```typescript
// Log when rate limit is near
if (remaining < 10) {
  logger.warn({
    message: 'Rate limit approaching',
    endpoint: request.url,
    remaining,
    limit: maxRequests,
    userId: user?.id,
  });
}
```

### Alert on Suspicious Activity

```typescript
// Alert if many IPs hit rate limit
const limitedIps = new Set();
if (count > maxRequests) {
  limitedIps.add(ip);
  
  if (limitedIps.size > 100) {
    alert('Potential DDoS attack detected');
    logger.error('Possible DDoS attack');
  }
}
```

## Best Practices

### Do ✅

1. **Apply rate limits to authentication endpoints**
```typescript
@Post('login')
@RateLimit(RATE_LIMIT_PRESETS.auth.login)
async login() { }
```

2. **Use IP-based limits for public endpoints**
```typescript
@RateLimit({ type: 'ip', maxRequests: 30, windowMs: 60000 })
async publicEndpoint() { }
```

3. **Use user-based limits for authenticated endpoints**
```typescript
@RateLimit({ type: 'user', maxRequests: 100, windowMs: 3600000 })
async authenticatedEndpoint() { }
```

4. **Provide clear error messages**
```typescript
message: 'Too many login attempts. Please try again after 15 minutes.'
```

5. **Return Retry-After header**
```typescript
response.setHeader('Retry-After', retrySeconds);
```

### Don't ❌

1. **Don't apply strict limits to read endpoints**
```typescript
// ❌ Bad
@Get('/schools')
@RateLimit({ maxRequests: 5, windowMs: 60000 })
```

2. **Don't forget rate limits on create/delete operations**
```typescript
// ❌ Bad - creates unprotected
@Post('/schools')
async createSchool() { }

// ✅ Good
@Post('/schools')
@RateLimit(RATE_LIMIT_PRESETS.school.create)
async createSchool() { }
```

3. **Don't use only IP-based limits for authenticated APIs**
```typescript
// ❌ Bad - shared corporate IP breaks for all users
@RateLimit({ type: 'ip', maxRequests: 100 })

// ✅ Good - per user limits
@RateLimit({ type: 'user', maxRequests: 100 })
```

4. **Don't ignore rate limit warnings in logs**
```typescript
// Monitor and investigate unusual patterns
if (rateLimitHits > threshold) {
  investigate();
}
```

## Performance Considerations

### Memory Usage

In-memory storage uses minimal memory:
- Per rate limit key: ~30-50 bytes
- 10,000 active users: ~500KB
- 100,000 active users: ~5MB

### Cleanup

Old entries are automatically cleaned on request:
```typescript
if (now > data.resetTime) {
  // Reset entry
}
```

Manual cleanup available:
```typescript
guard.clearLimit(key);
guard.clearAll(); // Use sparingly
```

## Deployment Checklist

- ✅ Rate limits defined for all endpoints
- ✅ Authentication endpoints have strict limits
- ✅ Bulk operations have very restrictive limits
- ✅ Environment-specific configuration in place
- ✅ Client-side retry logic implemented
- ✅ Monitoring and alerting configured
- ✅ Error messages are user-friendly
- ✅ Retry-After headers returned
- ✅ Rate limit stats endpoint available (debug only)
- ✅ Load tested under concurrent traffic

## Summary

Rate limiting provides:
- **Security**: Prevents brute force attacks (5 login attempts/15 min)
- **Stability**: Protects database from overload (100 requests/15 min)
- **Fairness**: Ensures equitable resource allocation
- **DDoS Protection**: Limits damage from external attacks
- **User Feedback**: Clear Retry-After headers guide clients
