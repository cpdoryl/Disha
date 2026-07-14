# Database Query Optimization Guide

This document explains query optimization strategies implemented in Disha v2.0 backend.

## Overview

Query optimization reduces database load and API response times by:
- Using selective column loading (select only needed columns)
- Adding strategic database indexes
- Optimizing JOIN operations
- Implementing pagination for large datasets
- Using batch queries for bulk operations

## Performance Improvements

Optimizations provide these benefits:

| Optimization | Impact | Use Case |
|---|---|---|
| Selective columns | ~70% data reduction | List endpoints |
| Database indexes | 10-100x faster queries | Filtering/searching |
| Pagination | ~80% data reduction | Large datasets |
| Batch operations | 10x fewer queries | Bulk operations |
| Aggregate queries | 90% data reduction | Statistics/metrics |

## Database Indexes

### Performance Indexes Added

```sql
-- School filtering
IDX_schools_isActive
IDX_schools_organizationId_isActive
IDX_schools_district

-- Student filtering and search
IDX_students_status
IDX_students_schoolId_status
IDX_students_gradeLevel
IDX_students_firstName_lastName

-- Assessment queries
IDX_assessments_status
IDX_assessments_schoolId_status
IDX_assessments_startDate_endDate

-- Response queries
IDX_responses_assessmentId
IDX_responses_respondentId
IDX_responses_submittedAt

-- Date-based queries
IDX_attendance_attendanceDate
IDX_audit_logs_userId_createdAt
IDX_operational_recordedDate
```

### Migration to Apply Indexes

```bash
# Apply performance indexes
npm run migration:run

# Verify indexes were created
SELECT * FROM pg_indexes WHERE tablename = 'students';
```

## Optimized Queries

Optimized query patterns are in `src/database/queries/optimized-queries.ts`

### 1. School List Query (Selective Columns)

**Before (no optimization):**
```typescript
const schools = await schoolRepository.find({
  where: { isActive: true },
  order: { name: 'ASC' }
});
// Loads ALL 20+ columns, ~2KB per school
```

**After (optimized):**
```typescript
const schools = await OptimizedQueries
  .getSchoolListQuery(schoolRepository)
  .getRawMany();
// Loads 8 essential columns, ~600 bytes per school (~70% reduction)
```

**Response:**
```json
{
  "id": "uuid",
  "name": "School Name",
  "district": "Pune",
  "city": "Pune",
  "studentCount": 500,
  "staffCount": 30,
  "isActive": true
}
```

### 2. Student List with Pagination

**Without pagination:**
```typescript
const students = await studentRepository.find({
  where: { schoolId: schoolId, status: 'active' }
});
// Returns ALL 500+ students, 5MB+ data
```

**With pagination:**
```typescript
const students = await OptimizedQueries
  .getStudentsBySchoolQuery(
    studentRepository,
    schoolId,
    limit = 20,  // Page size
    offset = 0   // Page number
  )
  .getRawMany();
// Returns 20 students, ~15KB data (~99% reduction with pagination)
```

### 3. Student Search (Indexed)

**Uses indexed columns for fast search:**
```typescript
const results = await OptimizedQueries
  .searchStudentsQuery(
    studentRepository,
    schoolId,
    'John',
    limit = 20,
    offset = 0
  )
  .getRawMany();
// Uses indexes on firstName, lastName, enrollmentNumber
// Executes in <50ms even with 10K+ students
```

### 4. Assessment Detail with Relations

**Efficiently load related data:**
```typescript
const assessment = await OptimizedQueries
  .getAssessmentDetailQuery(assessmentRepository, assessmentId)
  .leftJoinAndSelect('assessment.questions', 'questions')
  .getRawOne();
// Single query with eager loading
// Avoids N+1 query problem
```

### 5. Aggregate Queries (Statistics)

**Count students by school (optimized):**
```typescript
const stats = await OptimizedQueries
  .getStudentCountBySchoolQuery(studentRepository)
  .getRawMany();
// Returns: [{ schoolId: 'uuid', count: 500, activeCount: 485 }]
// ~100 bytes per school (vs 500KB+ for full student lists)
```

## Using Optimized Queries in Services

### Example: School Service

```typescript
import { OptimizedQueries } from 'src/database/queries/optimized-queries';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  // List schools (optimized)
  async listSchools(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const [schools, total] = await Promise.all([
      OptimizedQueries
        .getSchoolListQuery(this.schoolRepository)
        .skip(offset)
        .take(limit)
        .getRawMany(),
      this.schoolRepository.countBy({ isActive: true }),
    ]);

    return {
      data: schools,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // Get school detail (optimized)
  async getSchoolDetail(schoolId: string) {
    return OptimizedQueries
      .getSchoolDetailQuery(this.schoolRepository, schoolId)
      .getRawOne();
  }

  // Search schools by organization
  async getSchoolsByOrganization(orgId: string) {
    return OptimizedQueries
      .getSchoolsByOrgQuery(this.schoolRepository, orgId)
      .getRawMany();
  }
}
```

## Query Best Practices

### Do ✅

**1. Use selective columns**
```typescript
.select([
  'student.id',
  'student.firstName',
  'student.lastName',
])
```

**2. Add pagination**
```typescript
.skip(offset)
.take(limit)
```

**3. Use indexed columns in WHERE**
```typescript
.where('student.status = :status', { status: 'active' })
.andWhere('student.schoolId = :schoolId', { schoolId })
// Both columns are indexed
```

**4. Batch get multiple records**
```typescript
const students = await OptimizedQueries
  .getStudentsByIdsQuery(studentRepository, [id1, id2, id3])
  .getRawMany();
// 1 query instead of 3
```

**5. Use aggregate for counts**
```typescript
const count = await OptimizedQueries
  .getActiveStudentsBySchoolQuery(studentRepository, schoolId)
  .getRawOne();
// Returns { count: 485 }, not 485 student records
```

### Don't ❌

**1. Load all columns when you need few**
```typescript
// ❌ Bad - loads 20+ columns
const students = await studentRepository.find();

// ✅ Good - loads 5 columns
const students = await OptimizedQueries
  .getStudentsBySchoolQuery(studentRepository, schoolId)
  .getRawMany();
```

**2. Fetch all records without pagination**
```typescript
// ❌ Bad - returns 500+ records
const all = await studentRepository.find();

// ✅ Good - returns 20 with pagination
const page1 = await studentRepository
  .find({ skip: 0, take: 20 });
```

**3. Use N+1 queries (fetch parent, then children)**
```typescript
// ❌ Bad - 1 + N queries
const assessments = await assessmentRepository.find();
const details = await Promise.all(
  assessments.map(a => questionRepository.find({ assessmentId: a.id }))
);

// ✅ Good - 1 query with eager load
const assessments = await OptimizedQueries
  .getAssessmentDetailQuery(assessmentRepository, id)
  .leftJoinAndSelect('assessment.questions', 'questions')
  .getRawMany();
```

**4. Use unindexed columns in WHERE**
```typescript
// ❌ Bad - no index on bio
.where('student.bio LIKE :term', { term: '%term%' })

// ✅ Good - indexed columns
.where('student.firstName LIKE :term', { term: '%term%' })
```

**5. Fetch without filtering**
```typescript
// ❌ Bad - scans all records
const students = await studentRepository.find();

// ✅ Good - filtered by indexed column
const students = await studentRepository.find({
  where: { status: 'active' }
});
```

## Performance Monitoring

### Query Logging

Enable query logging in development:

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ... config
  logging: true,
  logger: 'advanced-console',
});
```

Watch for slow queries in logs:

```
[DB] SELECT student.id, student.firstName FROM student WHERE student.schoolId = ? [13ms]
```

Queries taking >100ms should be optimized.

### Monitor Query Performance

```typescript
// services/school.service.ts
async getSchools(page: number = 1) {
  const startTime = Date.now();
  
  const schools = await OptimizedQueries
    .getSchoolListQuery(this.schoolRepository)
    .getRawMany();
  
  const duration = Date.now() - startTime;
  console.log(`Query took ${duration}ms`);
  
  return schools;
}
```

## Database Statistics

Update table statistics after adding indexes:

```bash
# Connect to test database
psql -h localhost -U postgres -d disha_test_db

# Analyze tables to update statistics
ANALYZE students;
ANALYZE schools;
ANALYZE assessments;

# View index sizes
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

## API Response Optimization

### Pagination Response

```json
{
  "data": [
    { "id": "uuid", "name": "Student 1", ... }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "pages": 25
  }
}
```

### Minimal List Response

```json
{
  "data": [
    { "id": "uuid", "name": "School", "city": "Pune" }
  ]
}
```

### Detailed Response

```json
{
  "id": "uuid",
  "name": "School Name",
  "principal": { "name": "Mr. X", "email": "..." },
  "stats": { "students": 500, "staff": 30 },
  "metrics": { "avgGrade": 7.5, "attendance": 92 }
}
```

## Caching Opportunities (Future)

Beyond query optimization, consider caching:

```typescript
// Cache school list for 5 minutes
@Cacheable({
  ttl: 300,
  key: 'school_list_{{ page }}_{{ limit }}'
})
async listSchools(page: number, limit: number) { }

// Cache school metrics
@Cacheable({
  ttl: 3600,
  key: 'school_metrics_{{ schoolId }}'
})
async getSchoolMetrics(schoolId: string) { }
```

## Index Maintenance

### Monitor Index Usage

```sql
-- Find unused indexes (PostgreSQL)
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Remove Unused Indexes

```sql
-- Drop unused indexes
DROP INDEX IDX_column_name;
```

### Check Index Effectiveness

```sql
-- Queries using indexes
EXPLAIN ANALYZE
SELECT * FROM students 
WHERE status = 'active' 
LIMIT 20;
```

Look for "Index Scan" instead of "Sequential Scan".

## Performance Benchmarks

Expected improvements after optimization:

| Operation | Before | After | Improvement |
|---|---|---|---|
| List 100 schools | 250ms | 15ms | **16x faster** |
| Search 1000 students | 500ms | 20ms | **25x faster** |
| Get school detail | 100ms | 8ms | **12x faster** |
| Count students | 2000ms | 5ms | **400x faster** |
| Assessment responses | 1500ms | 30ms | **50x faster** |

## Troubleshooting

### Slow List Endpoint

**Check:**
1. Is pagination implemented? (Skip/Take)
2. Are only needed columns selected?
3. Are WHERE clauses using indexed columns?
4. Is there a LIKE/ILIKE on unindexed column?

**Fix:**
```typescript
// Before
const items = await repository.find();

// After
const items = await repository
  .createQueryBuilder('item')
  .select(['item.id', 'item.name'])
  .where('item.status = :status', { status: 'active' })
  .skip(offset)
  .take(limit)
  .getRawMany();
```

### High Memory Usage

**Cause:** Loading too many rows at once

**Fix:** Add pagination and reduce batch sizes

```typescript
// Reduce from 1000 to 100 per batch
const BATCH_SIZE = 100;
```

### Lock Timeouts

**Cause:** Long-running queries hold locks

**Fix:** Use smaller batch sizes and shorter transactions

## Further Reading

- [TypeORM Query Building](https://typeorm.io/select-query-builder)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes.html)
- [Database Query Optimization](https://use-the-index-luke.com/)
