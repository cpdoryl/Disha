# Testing Guide - Disha v2.0

Complete guide for running unit, integration, and end-to-end tests.

## Test Structure

```
backend/
├── test/
│   ├── setup.ts                    # Test app initialization & helpers
│   ├── auth.integration.spec.ts    # Authentication tests
│   ├── schools.integration.spec.ts # School endpoint tests
│   └── rbac.integration.spec.ts    # Role-based access control tests
└── src/
    └── **/*.spec.ts               # Unit tests (co-located with source)
```

## Prerequisites

### Required
- Node.js 18+ (v20 recommended)
- npm 9+
- PostgreSQL 14+ running locally
- Git

### Installation
```bash
cd backend
npm install
```

## Environment Setup

### Create Test Database

```bash
# Using PostgreSQL directly
createdb -U postgres -h localhost disha_test_db

# Or using psql
psql -U postgres -h localhost -c "CREATE DATABASE disha_test_db;"
```

### Configure Test Environment
Test environment is automatically configured via `.env.test`:
- Database: `disha_test_db`
- Host: `localhost`
- Port: `5432` (PostgreSQL), `3001` (API)
- Credentials: postgres/postgres (default)

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

Output includes coverage report for critical paths.

### Integration Tests
```bash
npm run test:integration
```

**Before running:** Ensure PostgreSQL is running and test database exists.

### Watch Mode (Development)
```bash
npm run test:watch
```

Automatically re-runs tests when files change.

### Coverage Report
```bash
npm run test:cov
```

Generates coverage report in `coverage/` directory.

### Debugging
```bash
npm run test:debug
```

Then attach debugger to `node --inspect-brk` on port 9229.

## Test Files Overview

### 1. auth.integration.spec.ts

**Purpose:** Verify authentication flow and token management

**Test Suites:**
- `POST /api/v2/auth/login`
  - ✅ Valid credentials
  - ✅ Invalid email
  - ✅ Wrong password
  - ✅ Invalid format
  - ✅ Missing fields

- `POST /api/v2/auth/refresh`
  - ✅ Refresh token successfully
  - ✅ Invalid token
  - ✅ Missing token

- `POST /api/v2/auth/logout`
  - ✅ Valid logout
  - ✅ Invalid token
  - ✅ Missing token

- `JWT Token Validation`
  - ✅ Access protected endpoint with valid token
  - ✅ Deny without token
  - ✅ Deny with malformed token

- `Different User Roles`
  - ✅ Login as different roles
  - ✅ Verify tokens differ by user

**Run only auth tests:**
```bash
npm run test:integration -- auth.integration
```

### 2. schools.integration.spec.ts

**Purpose:** Verify school endpoints work with database

**Test Suites:**
- School CRUD operations
- Permission enforcement
- RBAC for school operations
- Database integration

**Run only school tests:**
```bash
npm run test:integration -- schools.integration
```

### 3. rbac.integration.spec.ts (NEW)

**Purpose:** Comprehensively test RBAC on all 40+ endpoints

**Test Coverage:**
- **SchoolController** (7 endpoints)
  - Create: ryl_admin only
  - Read: ryl_admin, school_admin, teacher
  - Update: ryl_admin, school_admin
  - Deactivate: ryl_admin only

- **StudentController** (10 endpoints)
  - Create: ryl_admin, school_admin
  - Read: all authenticated users
  - Attendance: ryl_admin, school_admin, teacher
  - Performance: ryl_admin, school_admin, teacher, parent

- **AssessmentController** (8 endpoints)
  - Create: ryl_admin, school_admin
  - Read: ryl_admin, school_admin, teacher, student
  - Submit: public (no auth required)
  - Status update: ryl_admin, school_admin

- **DataController** (9 endpoints)
  - All: ryl_admin, school_admin, teacher

- **AuditController** (5 endpoints)
  - All: ryl_admin, school_admin

- **NotificationController** (6 endpoints)
  - All: ryl_admin, school_admin, teacher

- **ReportingController** (5 endpoints)
  - Export/Schedule: ryl_admin, school_admin
  - View: varies by report type

- **WellbeingController** (9 endpoints)
  - All: ryl_admin, school_admin, teacher

- **ChallengeController** (4 endpoints)
  - All: public (no auth required)

**Run only RBAC tests:**
```bash
npm run test:integration -- rbac.integration
```

## Test Data

### Seed Data
Located in: `src/database/seeds/seed.ts`

**Default Test Users:**
```javascript
{
  rylAdmin: {
    email: 'admin1@school.edu',
    password: 'admin123',
    role: 'ryl_admin'
  },
  schoolAdmin: {
    email: 'admin2@school.edu',
    password: 'admin123',
    role: 'school_admin'
  },
  teacher: {
    email: 'teacher1@school.edu',
    password: 'teacher123',
    role: 'teacher'
  }
}
```

### Initialize Test Database
```bash
# Run migrations
npm run migration:run

# Seed test data
npm run seed:db
```

## Interpreting Results

### Successful Test Run
```
PASS  test/auth.integration.spec.ts (5.234 s)
  Authentication (Integration)
    POST /api/v2/auth/login
      ✓ should login successfully with valid credentials (45 ms)
      ✓ should fail with invalid email (12 ms)
      ✓ should fail with incorrect password (15 ms)
    ✓ Different User Roles (23 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

### Failed Test
```
● Authentication (Integration) › POST /api/v2/auth/login › should login successfully

  Expected: 200
  Received: 401

  at Test.expect (test/auth.integration.spec.ts:24:8)
```

**Resolution Steps:**
1. Check error message for details
2. Verify test database exists and has seed data
3. Check environment variables in `.env.test`
4. Review application logs for errors
5. Verify database migrations ran: `npm run migration:show`

## Common Issues & Solutions

### Issue: Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL (Linux/macOS)
sudo systemctl start postgresql

# Windows: Use Services or pgAdmin
```

### Issue: Test Database Doesn't Exist
```
Error: database "disha_test_db" does not exist
```

**Solution:**
```bash
# Create database
createdb -U postgres -h localhost disha_test_db

# Or with psql
psql -U postgres
CREATE DATABASE disha_test_db;
```

### Issue: Seed Data Not Present
```
Error: no user found (401 Unauthorized on login)
```

**Solution:**
```bash
# Seed database
npm run seed:db

# Verify seed worked
psql -U postgres -h localhost -d disha_test_db -c "SELECT COUNT(*) FROM users;"
```

### Issue: Tests Hang
```
FAIL  test/auth.integration.spec.ts (timeout)
```

**Solution:**
```bash
# Run with longer timeout
npm run test:integration -- --testTimeout=10000

# Or check if database is responsive
psql -U postgres -h localhost -c "SELECT 1;"
```

### Issue: Import Errors
```
Cannot find module 'src/...'
```

**Solution:**
```bash
# Verify tsconfig.json paths
# Run from backend directory
cd backend
npm run test:integration
```

## RBAC Test Verification

### Test Each Role's Access

**ryl_admin role:**
- Can create schools ✅
- Can create students ✅
- Can create assessments ✅
- Can deactivate schools ✅
- Can access audit logs ✅

**school_admin role:**
- Cannot create schools ✅
- Can create students ✅
- Can create assessments ✅
- Cannot deactivate schools ✅
- Can access audit logs ✅

**teacher role:**
- Cannot create schools ✅
- Cannot create students ✅
- Cannot create assessments ✅
- Can record attendance ✅
- Cannot access audit logs ✅

**parent role:**
- Cannot create anything ✅
- Can view child's attendance ✅
- Can view child's progress ✅
- Cannot access audit logs ✅

**student role:**
- Cannot create anything ✅
- Can take assessments ✅
- Can view own data ✅
- Cannot access audit logs ✅

### Run RBAC Verification
```bash
npm run test:integration -- rbac.integration
```

Look for these test results:
- ✅ 45+ RBAC tests passing
- ❌ 0 failures (indicates proper access control)
- All 403 Forbidden responses for unauthorized access

## Performance Testing

### Stress Test Database Performance

```bash
# Run all tests multiple times
npm run test:integration -- --testNamePattern="RBAC" --maxWorkers=4

# Monitor database performance
psql -U postgres -h localhost -d disha_test_db -c "SELECT * FROM pg_stat_statements LIMIT 10;"
```

### Measure Test Execution Time

```bash
# Verbose output with timing
npm run test:integration -- --verbose --detectOpenHandles

# Expected: Auth tests <1s, Integration tests <3s, RBAC tests <5s
```

## Continuous Integration

### GitHub Actions CI
Tests run automatically on:
- Every push to main
- Every pull request
- Scheduled daily

### Local CI Simulation
```bash
# Run same suite as GitHub Actions
npm run type-check  # TypeScript check
npm run lint        # Linting
npm run test        # All tests
npm run build       # Build verification
```

## Test Coverage Goals

### Critical Paths (80% coverage target)
- Authentication (99%)
- RBAC enforcement (100%)
- Database operations (85%)
- Error handling (75%)

### View Coverage Report
```bash
npm run test:cov

# Open in browser
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html  # Windows
```

## Debugging Failed Tests

### Enable Verbose Logging
```bash
# Set debug flag
DEBUG=* npm run test:integration

# Or specific module
DEBUG=app:* npm run test:integration
```

### Use Breakpoints
```bash
npm run test:debug

# Then attach VS Code debugger or Chrome DevTools
# Navigate to chrome://inspect
```

### Isolate Single Test
```bash
# Run only one test suite
npm run test:integration -- --testNamePattern="SchoolController RBAC"

# Run single test
npm run test:integration -- --testNamePattern="should allow ryl_admin to create school"
```

### Check Database State
```bash
# Connect to test database
psql -U postgres -h localhost -d disha_test_db

# View tables
\dt

# Check users
SELECT id, email, role FROM users LIMIT 5;

# Check schools
SELECT id, name FROM schools LIMIT 5;
```

## Best Practices

### Writing New Tests

1. **Use descriptive test names**
   ```typescript
   it('should allow ryl_admin to create school but deny teacher', async () => {
     // Good - clear intent and expected behavior
   });
   ```

2. **Test both success and failure paths**
   ```typescript
   // Test success
   it('should create school successfully', async () => { });
   
   // Test failure
   it('should deny unauthorized access', async () => { });
   ```

3. **Group related tests with describe blocks**
   ```typescript
   describe('POST /api/v2/schools', () => {
     describe('Authorization', () => { });
     describe('Validation', () => { });
     describe('Database', () => { });
   });
   ```

4. **Use test helpers**
   ```typescript
   const token = await loginAndGetToken(app, email, password);
   const response = await authenticatedRequest(app, 'get', '/api/v2/schools/1', token);
   ```

### Test Maintenance

- Update tests when API changes
- Keep seed data current
- Clean up test database between test runs
- Monitor test execution time (flag if >10s)
- Review coverage reports weekly

## Deployment Testing

### Pre-deployment Verification
```bash
# Full test suite
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build

# All should pass before deployment
```

### Staging Environment Testing
```bash
# After deployment to staging
npm run test:integration -- --testURL=https://staging-api.example.com
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [PostgreSQL Testing](https://www.postgresql.org/)

## Support

For test failures:
1. Check logs: `npm run test:integration -- --verbose`
2. Review database state
3. Check environment variables
4. Verify seed data exists
5. Check for port conflicts (3000, 3001, 5432)

For issues, open GitHub issue with:
- Error message
- Test name and file
- Steps to reproduce
- Environment details (OS, Node version, PostgreSQL version)
