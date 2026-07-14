# Integration Tests Guide

This document explains the integration test suite for Disha v2.0 backend API.

## Overview

Integration tests verify that API endpoints work correctly with real database access, authentication, and business logic. Tests cover:
- Authentication (login, refresh, logout)
- School management (CRUD operations)
- Student management
- Assessment endpoints
- RBAC enforcement
- Error handling

## Test Structure

```
test/
├── setup.ts                      # Test environment setup
├── auth.integration.spec.ts      # Authentication tests
├── schools.integration.spec.ts   # School endpoint tests
├── students.integration.spec.ts  # Student endpoint tests (optional)
└── jest-setup.ts                 # Jest configuration
```

## Prerequisites

### 1. Test Database

Create a separate test database:

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create test database
CREATE DATABASE disha_test_db;
```

Or let the tests create it automatically with proper permissions.

### 2. Environment Configuration

Test configuration is in `.env.test`:

```env
NODE_ENV=test
PORT=3001
DB_NAME=disha_test_db
JWT_SECRET=test-secret-key-for-testing-only
```

### 3. Dependencies

Ensure testing dependencies are installed:

```bash
npm install --save-dev @nestjs/testing supertest @types/supertest ts-jest
```

## Running Tests

### Run all integration tests

```bash
npm run test:integration
```

### Run specific test file

```bash
npm run test:integration -- auth.integration.spec.ts
```

### Run with coverage

```bash
npm run test:cov
```

### Run with watch mode

```bash
npm run test:watch
```

### Run in debug mode

```bash
npm run test:debug
```

## Test Database Setup

### Automatic Setup (Recommended)

Tests automatically:
1. Run database migrations before tests
2. Seed test data
3. Clean up after tests

### Manual Setup

If needed, manually set up test database:

```bash
# Create test database
createdb -h localhost -U postgres disha_test_db

# Run migrations
DB_NAME=disha_test_db npm run migration:run

# Seed test data
DB_NAME=disha_test_db npm run seed:db
```

## Test Data

### Seeded Users (from seed.ts)

Test users are created during database seeding:

```typescript
// RYL Admin
admin1@school.edu / admin123  (role: ryl_admin)

// Teachers
teacher1@school.edu / teacher123  (role: teacher)

// Schools created
- Modern Public School (with students)
- Central High School (with students)
- Green Valley Academy (with students)
- Knowledge Plus School (with students)

// Students
- 30 students per school (120+ total)
```

## Test Patterns

### Authentication Test Example

```typescript
describe('Authentication', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('should login with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: 'admin1@school.edu',
        password: 'admin123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user.role).toBe('ryl_admin');
  });

  it('should fail with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: 'admin1@school.edu',
        password: 'wrongpassword',
      })
      .expect(401);
  });
});
```

### Authenticated Request Example

```typescript
describe('Protected Endpoints', () => {
  let accessToken: string;

  beforeAll(async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: 'admin1@school.edu',
        password: 'admin123',
      });

    accessToken = response.body.accessToken;
  });

  it('should access protected endpoint with token', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200); // or 404 if school doesn't exist
  });

  it('should deny access without token', async () => {
    await request(app.getHttpServer())
      .get('/api/v2/schools/550e8400-e29b-41d4-a716-446655440000')
      .expect(401);
  });
});
```

### RBAC Test Example

```typescript
describe('Role-Based Access Control', () => {
  let adminToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    // Get admin token
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: 'admin1@school.edu',
        password: 'admin123',
      });
    adminToken = adminLogin.body.accessToken;

    // Get teacher token
    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: 'teacher1@school.edu',
        password: 'teacher123',
      });
    teacherToken = teacherLogin.body.accessToken;
  });

  it('admin should be able to create school', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/schools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New School',
        district: 'Pune',
        state: 'Maharashtra',
      })
      .expect([201, 400]); // Created or validation error
  });

  it('teacher should NOT be able to create school', async () => {
    await request(app.getHttpServer())
      .post('/api/v2/schools')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'New School',
        district: 'Pune',
        state: 'Maharashtra',
      })
      .expect(403); // Forbidden
  });
});
```

## Common Test Assertions

```typescript
// Status code checks
.expect(200)
.expect(201)
.expect(400)
.expect(401)
.expect(403)
.expect(404)
.expect([200, 404]) // Multiple acceptable status codes

// Response structure checks
expect(response.body).toHaveProperty('accessToken');
expect(response.body.user.email).toBe('admin1@school.edu');
expect(response.body.user.role).toBe('ryl_admin');

// Array checks
expect(Array.isArray(response.body)).toBe(true);
expect(response.body.length).toBeGreaterThan(0);

// Error checks
expect(response.body.message).toContain('Forbidden');
expect(response.body.statusCode).toBe(403);
```

## Coverage Goals

Aim for comprehensive test coverage:

### Authentication (100%)
- ✅ Login success
- ✅ Login failure (invalid email, wrong password)
- ✅ Token refresh
- ✅ Token validation
- ✅ Logout

### Schools (80%+)
- ✅ GET /api/v2/schools/:id
- ✅ PATCH /api/v2/schools/:id
- ✅ POST /api/v2/schools
- ✅ GET /api/v2/schools/:id/metrics
- ✅ PATCH /api/v2/schools/:id/deactivate

### Students (80%+)
- ✅ GET /api/v2/students/:id
- ✅ POST /api/v2/students
- ✅ GET /api/v2/students/school/:schoolId
- ✅ PATCH /api/v2/students/:id/status

### RBAC (100%)
- ✅ Admin can perform admin actions
- ✅ Teacher cannot perform admin actions
- ✅ Role-based endpoint access
- ✅ Permission-based access

### Error Handling (90%+)
- ✅ 401 Unauthorized (missing token)
- ✅ 403 Forbidden (insufficient role)
- ✅ 404 Not Found (missing resource)
- ✅ 400 Bad Request (validation error)
- ✅ 500 Server Error (unhandled exception)

## Troubleshooting

### Test Connection Failed

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
1. Ensure PostgreSQL is running: `psql --version`
2. Start PostgreSQL: `pg_ctl -D /usr/local/var/postgres start`
3. Check .env.test has correct DB_HOST and DB_PORT

### Test Database Already Exists

**Error:** `database "disha_test_db" already exists`

**Solution:**
```bash
# Drop old test database
dropdb -h localhost -U postgres disha_test_db

# Or let tests recreate it
npm run test:integration
```

### Timeout Errors

**Error:** `Test Timeout - Async callback was not invoked within the timeout`

**Solution:**
1. Increase Jest timeout in jest.config.js:
   ```javascript
   testTimeout: 30000 // 30 seconds
   ```
2. Ensure database is responding quickly
3. Check for hanging database connections

### Migration Failures

**Error:** `Migration failed: relation "users" does not exist`

**Solution:**
```bash
# Run migrations manually
npm run migration:run

# Or seed test database
npm run seed:db
```

## Performance Tips

### 1. Use maxWorkers=1
Ensures tests run sequentially to avoid database conflicts:
```bash
npm run test:integration
```

### 2. Seed Once Per Suite
Load test data in `beforeAll` hook, not each test:
```typescript
let testToken: string;

beforeAll(async () => {
  // Get token once for all tests
  testToken = await getTestToken();
});
```

### 3. Clean Up After Tests
Always clean up in `afterAll`:
```typescript
afterAll(async () => {
  await teardownTestApp();
});
```

### 4. Use Transactions for Isolation
Consider running tests in transactions that rollback:
```typescript
beforeEach(async () => {
  // Start transaction
});

afterEach(async () => {
  // Rollback transaction
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: disha_test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run migration:run
      - run: npm run seed:db
      - run: npm run test:integration
```

## Writing New Integration Tests

### Template for New Test File

```typescript
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestApp, teardownTestApp, TEST_USERS } from './setup';

describe('Feature Name (Integration)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    app = await setupTestApp();

    // Login to get token
    const response = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({
        email: TEST_USERS.rylAdmin.email,
        password: TEST_USERS.rylAdmin.password,
      });

    accessToken = response.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  describe('Endpoint Name', () => {
    it('should perform action successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v2/feature/action')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ /* test data */ })
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });

    it('should fail with invalid input', async () => {
      await request(app.getHttpServer())
        .post('/api/v2/feature/action')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ /* invalid data */ })
        .expect(400);
    });
  });
});
```

## Best Practices

### Do ✅
- Test happy path and error cases
- Use descriptive test names
- Keep tests focused and independent
- Use meaningful test data
- Clean up resources after tests
- Test RBAC enforcement
- Verify response structure

### Don't ❌
- Don't make tests dependent on execution order
- Don't use hardcoded IDs (use seeded data)
- Don't skip error case tests
- Don't test implementation details
- Don't forget to test authorization
- Don't use real production data
- Don't leave tests in pending state

## Support

For test issues:
1. Check database connection
2. Verify migrations ran successfully
3. Review error message and stack trace
4. Check test data in database
5. Review similar working tests for patterns
