# Database Seeding Guide

This document explains how to seed the Disha database with sample data for testing and development.

## Overview

The seeding script creates realistic sample data including:
- 1 Organization (RYL Education Foundation)
- 1 District (Pune District)
- 4 Schools
- 8+ Users (admins, teachers)
- 200+ Students
- 9 Challenge domains
- 4 Assessments

This data allows developers to test the full API without manual data entry.

## Prerequisites

1. Database must be initialized with migrations:
```bash
npm run migration:run
```

2. Environment variables configured in `.env.local` or `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=disha_db
```

3. PostgreSQL server running and accessible

## Running the Seed Script

### Standard Seeding

Run the seeding script:
```bash
npm run seed:db
```

Output should show:
```
🌱 Starting database seeding...
📋 Creating organizations...
✅ Created organization: Ryl Education Foundation
📍 Creating districts...
✅ Created district: Pune District
🏫 Creating schools...
✅ Created school: Modern Public School
...
✨ Database seeding completed successfully!
```

## Sample Data Generated

### Organizations
- **Ryl Education Foundation**
  - Email: contact@ryl.org
  - Phone: +91-9876543210
  - Location: Maharashtra, India

### Schools
1. Modern Public School
2. Central High School
3. Green Valley Academy
4. Knowledge Plus School

Each school includes:
- 500-800 students (fictional)
- 30-50 staff members (fictional)
- 15-21 classrooms (fictional)
- Principal contact information

### Users

**School Admins** (1 per school)
- Email: `admin1@school.edu` to `admin4@school.edu`
- Password: `admin123`
- Role: Admin

**Teachers** (1 per school)
- Email: `teacher1@school.edu` to `teacher4@school.edu`
- Password: `teacher123`
- Role: User

### Students

**Per School:** ~50 students (200+ total)
- Enrollment numbers: `STU-XXXX-0001` format
- Grades: Classes 1-10
- Sections: A, B, C
- Status: All active
- Email: `student{school}{number}@school.edu`
- Admission dates: 2020-2024

Sample student data:
- First Name: Student
- Last Name: {school-index}-{student-number}
- Date of Birth: 2010-2014 (randomly distributed)
- Gender: 50/50 random distribution
- Current Class: Classes 1-10 (random)
- Section: A, B, or C (random)

### Challenges

All 9 Disha challenge domains:
1. Student Retention - Reducing Dropout Rates
2. Dropout - Re-enrollment Programs
3. Teacher Retention - Teacher Satisfaction Programs
4. Teacher Training - Professional Development
5. System Duplication - Process Optimization
6. Academic Performance - Learning Outcomes
7. Parental Satisfaction - Parent Engagement
8. Emotional Wellbeing - Student Wellness
9. Word-of-Mouth - Community Reputation

Each challenge includes:
- Domain classification
- Description
- Risk indicators (dropout rate, attendance, performance)
- Intervention strategies (counselling, remedial classes, parent engagement)

### Assessments

**Per School:** 1 baseline assessment (4 total)
- Title: Baseline Assessment 2024
- Type: Baseline
- Status: Active
- Duration: 30 days from seeding date
- Questions: 50
- Domain: Academic Performance

## Testing After Seeding

### Check Data in Database

Connect to PostgreSQL:
```bash
psql -h localhost -U postgres -d disha_db
```

Useful queries:
```sql
-- Count schools
SELECT COUNT(*) FROM schools;

-- List all students in a school
SELECT * FROM students WHERE schoolId = (SELECT id FROM schools LIMIT 1);

-- View users
SELECT id, email, userType, roleType FROM users;

-- Check challenges
SELECT * FROM challenges;
```

### Test Login with Seed Data

Use the login endpoint with seed credentials:

```bash
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@school.edu",
    "password": "admin123"
  }'
```

Expected response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "admin1@school.edu",
    "firstName": "Admin",
    "lastName": "1",
    "role": "admin"
  }
}
```

### Test API Endpoints

Get school list:
```bash
curl -X GET http://localhost:3000/api/v2/schools \
  -H "Authorization: Bearer {accessToken}"
```

Get students in school:
```bash
curl -X GET http://localhost:3000/api/v2/students/school/{schoolId} \
  -H "Authorization: Bearer {accessToken}"
```

## Reset Database

To clear all data and reseed:

### Option 1: Revert migrations and reseed
```bash
npm run migration:revert    # Revert last migration
npm run migration:revert    # Revert previous migration
npm run migration:run       # Reapply migrations
npm run seed:db            # Reseed database
```

### Option 2: Manual cleanup (caution!)
```sql
-- Connect to database
psql -h localhost -U postgres -d disha_db

-- Delete all data (order matters due to foreign keys)
DELETE FROM assessment_responses;
DELETE FROM assessments;
DELETE FROM student_academic_assessments;
DELETE FROM student_attendance;
DELETE FROM students;
DELETE FROM schools;
DELETE FROM districts;
DELETE FROM challenges;
DELETE FROM gap_predictions;
DELETE FROM monitoring_scorecards;
DELETE FROM remediation_interventions;
DELETE FROM counsellor_referrals;
DELETE FROM bullying_incidents;
DELETE FROM parent_communication;
DELETE FROM audit_logs;
DELETE FROM operational_data;
DELETE FROM users;
DELETE FROM organizations;
```

Then reseed:
```bash
npm run seed:db
```

## Extending Seed Data

To add more sample data, edit `src/database/seeds/seed.ts`:

```typescript
// Add more schools
const schoolNames = [
  'Modern Public School',
  'Central High School',
  'Green Valley Academy',
  'Knowledge Plus School',
  'Your New School',  // Add here
];

// Change student count per school
const studentCount = 100; // Increase from 50

// Add more challenges
CHALLENGES.push({
  domain: 'New Domain',
  title: 'New Title',
  description: 'New description',
});
```

Then reseed:
```bash
npm run migration:run
npm run seed:db
```

## Environment-Specific Seeding

### Development

```bash
npm run migration:run
npm run seed:db
npm run start:dev
```

### Testing

```bash
npm run migration:run
npm run seed:db
npm run test
```

### Production

**Note:** Be careful! Only run seeding on production if you intentionally want to reset the database.

```bash
# Backup first!
pg_dump disha_db > backup.sql

npm run migration:run
npm run seed:db
```

## Troubleshooting

### Seeding fails with "Cannot read property"

**Problem:** Entities not properly exported from database/entities/index.ts

**Solution:**
```bash
# Verify entity imports
cat src/database/entities/index.ts

# Rebuild if needed
npm run build
npm run seed:db
```

### Foreign key constraint error

**Problem:** Tables not created in correct order

**Solution:**
1. Check migrations were applied: `npm run migration:show`
2. Verify database is clean: `npm run migration:revert` (multiple times)
3. Reapply migrations: `npm run migration:run`

### Connection refused error

**Problem:** Database not running or wrong credentials

**Solution:**
1. Check PostgreSQL is running: `pg_isready -h localhost -p 5432`
2. Verify credentials in `.env.local`
3. Create database if missing: `createdb -h localhost -U postgres disha_db`

### Duplicate key error on second run

**Problem:** Seed script ran twice without cleanup

**Solution:**
```bash
# Option 1: Clean and reseed
npm run migration:revert
npm run migration:run
npm run seed:db

# Option 2: Just reseed (will fail on duplicates)
# Modify seed.ts to handle existing data or delete manually
```

## Support

For seeding issues:
1. Check database connection
2. Verify migrations are applied
3. Check entity exports in `src/database/entities/index.ts`
4. Review seed script output for specific errors
