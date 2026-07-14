# API Pagination & Filtering Guide

This document explains pagination and filtering strategies for Disha v2.0 APIs.

## Overview

Pagination and filtering provide:
- Reduced data transfer (~80-99% reduction with pagination)
- Better user experience with manageable datasets
- Flexible search and discovery capabilities
- Improved API performance and responsiveness

## Pagination Fundamentals

### Query Parameters

```
GET /api/v2/schools?page=1&limit=20&sort=name&order=ASC
```

| Parameter | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | number | 1 | 10000 | Page number (1-indexed) |
| `limit` | number | 20 | 100 | Items per page |
| `sort` | string | - | - | Column to sort by |
| `order` | string | ASC | - | Sort order (ASC/DESC) |

### Response Format

```json
{
  "data": [
    { "id": "uuid", "name": "School 1", ... }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "pages": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Basic Pagination

### Example 1: Simple Pagination

```bash
# Get first page
GET /api/v2/schools?page=1&limit=20

# Get second page
GET /api/v2/schools?page=2&limit=20

# Get third page
GET /api/v2/schools?page=3&limit=20
```

Response:
```json
{
  "data": [
    { "id": "1", "name": "School 21", "city": "Pune" },
    { "id": "2", "name": "School 22", "city": "Mumbai" }
  ],
  "pagination": {
    "total": 500,
    "page": 2,
    "limit": 20,
    "pages": 25,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Example 2: Custom Page Size

```bash
# Get 50 items per page
GET /api/v2/schools?page=1&limit=50

# Get 10 items per page
GET /api/v2/schools?page=1&limit=10
```

## Sorting

### Sort by Column

```bash
# Sort by name (ascending)
GET /api/v2/schools?sort=name&order=ASC

# Sort by name (descending)
GET /api/v2/schools?sort=name&order=DESC

# Sort by creation date
GET /api/v2/schools?sort=createdAt&order=DESC

# Sort by student count
GET /api/v2/schools?sort=studentCount&order=DESC
```

### Valid Sort Columns

Each endpoint has a list of sortable columns:

**Schools:**
- `name`, `district`, `city`, `studentCount`, `createdAt`

**Students:**
- `firstName`, `lastName`, `gradeLevel`, `enrollmentDate`, `createdAt`

**Assessments:**
- `cycleName`, `startDate`, `endDate`, `createdAt`

## Filtering

### Single Filter

```bash
# Filter by district
GET /api/v2/schools?district=Pune

# Filter by city
GET /api/v2/schools?city=Mumbai

# Filter by status
GET /api/v2/students?status=active
```

### Multiple Filters

```bash
# Combine multiple filters
GET /api/v2/schools?district=Pune&city=Pune&sort=name

# Multiple filters with pagination
GET /api/v2/students?schoolId=123&status=active&gradeLevel=10&page=1&limit=20
```

### Search

```bash
# Search by name
GET /api/v2/schools?search=Public

# Search students by name or enrollment number
GET /api/v2/students?schoolId=123&search=John

# Search with pagination
GET /api/v2/students?search=Smith&page=1&limit=20
```

## Complex Filtering

### Example 1: School Listing with Filters

```bash
GET /api/v2/schools?district=Pune&city=Pune&sort=studentCount&order=DESC&page=1&limit=20
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Central High School",
      "district": "Pune",
      "city": "Pune",
      "studentCount": 800,
      "isActive": true
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Example 2: Student Filtering

```bash
GET /api/v2/students?schoolId=school-123&status=active&gradeLevel=10&sort=lastName&order=ASC&page=1&limit=30
```

Returns 30 active students in grade 10 at specified school, sorted by last name.

### Example 3: Attendance Query

```bash
GET /api/v2/students/attendance?schoolId=school-123&fromDate=2024-01-01&toDate=2024-12-31&status=present&page=1&limit=50
```

## Implementation

### DTOs

Define query parameter DTOs:

```typescript
export class SchoolListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
```

### Service Layer

Use pagination utilities:

```typescript
async listSchools(query: SchoolListQueryDto) {
  const { page = 1, limit = 20, sort, order, district, city, search } = query;

  let queryBuilder = this.schoolRepository
    .createQueryBuilder('school')
    .select(['school.id', 'school.name', 'school.district'])
    .where('school.isActive = :isActive', { isActive: true });

  // Apply filters
  if (search) {
    PaginationUtil.applySearch(queryBuilder, search, ['name', 'district', 'city']);
  }
  if (district) {
    queryBuilder.andWhere('school.district = :district', { district });
  }

  // Count total
  const total = await queryBuilder.getCount();

  // Apply pagination
  PaginationUtil.applyPagination(
    queryBuilder,
    page,
    limit,
    ['name', 'district', 'createdAt'],
    sort,
    order,
  );

  const schools = await queryBuilder.getRawMany();

  return PaginationUtil.buildPaginatedResponse(schools, page, limit, total);
}
```

### Controller

Use pagination DTOs:

```typescript
@Get()
async listSchools(@Query() query: SchoolListQueryDto) {
  return this.schoolService.listSchools(query);
}

@Get('search')
async searchSchools(
  @Query('q') searchTerm: string,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
) {
  return this.schoolService.searchSchools(searchTerm, page, limit);
}
```

## Pagination Utilities

### PaginationUtil Methods

```typescript
// Apply pagination to query builder
PaginationUtil.applyPagination(
  query,
  page = 1,
  limit = 20,
  validSortColumns = ['name'],
  sort = 'name',
  order = 'ASC'
);

// Apply search filter
PaginationUtil.applySearch(
  query,
  'John',
  ['firstName', 'lastName', 'email']
);

// Apply status filter
PaginationUtil.applyStatusFilter(query, 'active');

// Apply date range filter
PaginationUtil.applyDateRangeFilter(
  query,
  '2024-01-01',
  '2024-12-31',
  'createdAt'
);

// Build paginated response
PaginationUtil.buildPaginatedResponse(
  schools,
  page = 1,
  limit = 20,
  total = 500
);
```

## Performance Considerations

### Data Reduction

With pagination:
- Default limit: 20 items
- Each school: ~600 bytes
- Total response: ~12KB
- Without pagination: 500 schools × 600 bytes = 300KB (~96% reduction)

### Query Optimization

Pagination automatically:
- Uses SKIP/TAKE in SQL
- Applies ORDER BY clauses
- Filters with indexed columns
- Returns only needed columns

### Response Time

Expected response times with pagination:

```
Page 1: ~20ms (indexed query)
Page 100: ~25ms (skip 1980 records)
Page 1000: ~40ms (skip 19980 records)
```

Deep pagination still performs well with proper indexes.

## Best Practices

### Do ✅

1. Always use pagination for list endpoints
```typescript
GET /api/v2/students?page=1&limit=20
```

2. Validate sort columns
```typescript
const validSort = PaginationUtil.validateSortColumn(sort, allowedColumns);
```

3. Set reasonable limits
```typescript
// Min: 1, Max: 100, Default: 20
```

4. Use filters for discovery
```typescript
GET /api/v2/students?schoolId=123&status=active&gradeLevel=10
```

5. Document sortable columns
```typescript
/**
 * Sortable columns: name, email, createdAt
 */
```

6. Provide next/prev indicators
```json
{
  "pagination": {
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Don't ❌

1. Don't return all records
```typescript
// ❌ Bad
const students = await repository.find();

// ✅ Good
const students = await repository
  .find({ skip: offset, take: limit });
```

2. Don't allow arbitrary sort columns
```typescript
// ❌ Bad - user controls sort
const sort = req.query.sort; // Potential SQL injection
query.orderBy(sort);

// ✅ Good - whitelist columns
const sort = this.validateSortColumn(req.query.sort, ['name', 'email']);
```

3. Don't set unlimited page size
```typescript
// ❌ Bad
limit = req.query.limit; // Could be 1000000

// ✅ Good
limit = Math.min(req.query.limit, 100);
```

4. Don't use offset/limit for "get all"
```typescript
// ❌ Bad - infinite loop getting all pages
for (let page = 1; page < Infinity; page++) {
  const data = await api.getStudents({ page });
  if (!data.pagination.hasNext) break;
}

// ✅ Good - use cursor-based or batch API
const allStudents = await api.bulkGetStudents(schoolId);
```

5. Don't return record count in every page
```typescript
// This is OK - returns count with every response
"total": 500

// Alternative: only on first page
```

## API Examples

### Real-World Examples

**1. Browse Schools by District**
```bash
GET /api/v2/schools?district=Pune&sort=studentCount&order=DESC&page=1&limit=20
```

**2. Find Active Students in a School**
```bash
GET /api/v2/students?schoolId=school-123&status=active&sort=lastName&page=1&limit=50
```

**3. Search Students**
```bash
GET /api/v2/students?schoolId=school-123&search=John&page=1&limit=20
```

**4. Get Recent Assessments**
```bash
GET /api/v2/assessments?schoolId=school-123&status=active&sort=startDate&order=DESC&page=1&limit=10
```

**5. Attendance Report**
```bash
GET /api/v2/attendance?schoolId=school-123&fromDate=2024-01-01&toDate=2024-01-31&page=1&limit=100
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  [key: string]: any;
}

async function fetchSchools(params: PaginationParams) {
  const queryString = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();

  const response = await fetch(`/api/v2/schools?${queryString}`);
  return response.json();
}

// Usage
const data = await fetchSchools({
  page: 1,
  limit: 20,
  district: 'Pune',
  sort: 'name',
  order: 'ASC'
});

console.log(data.data); // Array of schools
console.log(data.pagination.hasNext); // true
```

### React Hook Example

```typescript
function useSchools(page = 1, filters = {}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchSchools({ page, limit: 20, ...filters }).then(res => {
      setData(res.data);
      setPagination(res.pagination);
    });
  }, [page, filters]);

  return { data, pagination };
}

// Usage
const { data: schools, pagination } = useSchools(currentPage, { district: 'Pune' });
```

## Troubleshooting

### Too Much Data Returned

**Issue:** Response is still 1MB+

**Solutions:**
1. Reduce `limit` parameter
2. Add more specific filters
3. Use selective columns in service

### Slow Pagination

**Issue:** Page 100 is slow

**Solutions:**
1. Add indexes on sort and filter columns
2. Consider cursor-based pagination for deep pages
3. Limit maximum page number

### Invalid Sort Column Error

**Issue:** "Invalid sort column: xyz"

**Solutions:**
1. Check sortable columns documentation
2. Use allowed column names only
3. Query endpoint documentation for valid columns

### Filter Not Working

**Issue:** Filter parameter ignored

**Solutions:**
1. Check filter is implemented in service
2. Verify parameter name matches
3. Ensure filter column exists

## Advanced: Cursor-Based Pagination

For very large datasets, consider cursor-based pagination:

```bash
# Get first page
GET /api/v2/students?schoolId=123&limit=50

# Get next page using cursor
GET /api/v2/students?schoolId=123&cursor=ABCD1234&limit=50
```

Benefits:
- Consistent results even with insertions
- Better performance for deep pages
- No "duplicate" items across pages

See [Cursor-Based Pagination](https://use-the-index-luke.com/sql/pagination) for details.

## Migration Guide

### Adding Pagination to Existing Endpoint

1. Create pagination DTO
```typescript
export class StudentListQueryDto extends PaginationDto {
  @IsOptional()
  schoolId?: string;
}
```

2. Update service method signature
```typescript
async getStudents(query: StudentListQueryDto) { }
```

3. Implement pagination in service
```typescript
const { page, limit, sort, order } = query;
PaginationUtil.applyPagination(queryBuilder, page, limit, [...], sort, order);
```

4. Update controller
```typescript
@Get()
async listStudents(@Query() query: StudentListQueryDto) {
  return this.studentService.getStudents(query);
}
```

5. Test endpoint
```bash
GET /api/v2/students?page=1&limit=20
```
