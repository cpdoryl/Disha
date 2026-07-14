# Database Migrations Guide

This document explains how to manage database migrations for the Disha API.

## Overview

We use TypeORM migrations to version control the database schema. Migrations are version-controlled SQL scripts that define the database structure and changes over time.

## Migration Files

Migrations are stored in `src/database/migrations/` and follow the naming convention:
- `{timestamp}-{description}.ts`

Example:
- `1724056800000-InitialSchema.ts` - Creates initial tables
- `1724056801000-AdditionalTables.ts` - Creates additional tables

## Configuration

The migration configuration is defined in:
- `src/database/datasource.ts` - TypeORM data source configuration

Environment variables required:
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USERNAME` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (default: postgres)
- `DB_NAME` - Database name (default: disha_db)

## Available Commands

### Run Migrations
Applies all pending migrations to the database.

```bash
npm run migration:run
```

### Show Migration Status
Shows which migrations have been applied and which are pending.

```bash
npm run migration:show
```

### Revert Last Migration
Reverts the last applied migration (use with caution).

```bash
npm run migration:revert
```

### Generate New Migration
Generates a new migration file based on entity changes.

```bash
npm run migration:generate -- -n MigrationName
```

Example:
```bash
npm run migration:generate -- -n AddEmailToUsers
```

### Create Empty Migration
Creates an empty migration file for manual SQL queries.

```bash
npm run migration:create -- -n MigrationName
```

## Migration Workflow

### 1. Develop New Feature
- Create/modify entities in `src/database/entities/`
- Update services and DTOs as needed

### 2. Generate Migration
```bash
npm run migration:generate -- -n DescribeYourChanges
```

This automatically detects entity changes and creates a migration.

### 3. Review Migration
- Check the generated migration file in `src/database/migrations/`
- Verify the SQL is correct
- Ensure both `up()` and `down()` methods are implemented

### 4. Test Locally
```bash
npm run migration:run
```

### 5. Commit & Deploy
```bash
git add src/database/migrations/
git commit -m "Add migration: DescribeYourChanges"
```

On the deployment server:
```bash
npm run migration:run
npm start
```

## Manual Migrations

For complex schema changes, write migrations manually:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewFeature1724056802000 implements MigrationInterface {
  name = 'AddNewFeature1724056802000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new column
    await queryRunner.query(`
      ALTER TABLE "schools"
      ADD COLUMN "newField" character varying(255)
    `);
    
    // Create index
    await queryRunner.query(`
      CREATE INDEX "IDX_new_field" ON "schools" ("newField")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_new_field"`);
    await queryRunner.query(`
      ALTER TABLE "schools"
      DROP COLUMN "newField"
    `);
  }
}
```

## Best Practices

### Do ✅
- Always implement both `up()` and `down()` methods
- Use descriptive migration names
- Test migrations locally before deploying
- Keep migrations small and focused
- Add indexes for frequently queried columns
- Include foreign key constraints

### Don't ❌
- Don't skip the `down()` method
- Don't assume table ordering (use foreign keys)
- Don't make breaking changes without a migration plan
- Don't forget to commit migration files to git
- Don't run migrations directly in production without backup

## Deployment

### Development Environment
```bash
npm install
npm run migration:run
npm run start:dev
```

### Production Environment
```bash
npm install --production
npm run build
npm run migration:run
npm start
```

## Troubleshooting

### Migration won't run
1. Check database connection: `echo "SELECT 1" | psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME`
2. Verify migration file syntax
3. Check TypeORM logs: add `logging: true` to datasource

### Migration stuck
1. Check migration status: `npm run migration:show`
2. Manually check `typeorm_metadata` table
3. If needed, manually mark migration as applied in database

### Rollback issue
1. Verify `down()` method is correct
2. Restore from backup if needed
3. Never force delete migration files without reverting first

## Initial Schema

The initial schema includes:
- `users` - User accounts and authentication
- `organizations` - RYL organization structure
- `districts` - District management
- `schools` - School information
- `students` - Student enrollment
- `student_attendance` - Attendance tracking
- `assessments` - Assessment cycles
- `assessment_responses` - Student responses
- `audit_logs` - Activity logging
- `operational_data` - Operational metrics
- `challenges` - Challenge domains
- `gap_predictions` - Gap analysis
- `monitoring_scorecards` - Performance monitoring
- `parent_communication` - Parent notifications
- `counsellor_referrals` - Wellbeing referrals
- `remediation_interventions` - Support programs
- `bullying_incidents` - Safety reporting
- `student_academic_assessments` - Academic performance

## Support

For migration issues, check:
- `.env` or `.env.local` for database credentials
- PostgreSQL logs for SQL errors
- TypeORM documentation: https://typeorm.io/migrations
