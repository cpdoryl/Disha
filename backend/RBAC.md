# Role-Based Access Control (RBAC) Guide

This document explains the Role-Based Access Control system in Disha v2.0 backend.

## Overview

RBAC restricts endpoint access based on user roles. Five roles are supported:
- **RYL Admin** - Full system access, organization-level management
- **School Admin** - School-level management and reporting
- **Teacher** - Class and student management
- **Parent** - View child's data and assessments
- **Student** - Submit assessments, view own data

## Architecture

### 1. Roles & Permissions

Defined in `src/common/constants/permissions.ts`:

```typescript
// Role definitions
export enum Permission {
  VIEW_SCHOOLS = 'view_schools',
  CREATE_SCHOOL = 'create_school',
  EDIT_SCHOOL = 'edit_school',
  // ... more permissions
}

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ryl_admin: [ /* all permissions */ ],
  school_admin: [ /* school-level permissions */ ],
  teacher: [ /* teaching permissions */ ],
  parent: [ /* parent-specific permissions */ ],
  student: [ /* student permissions */ ],
};
```

### 2. Guards

Two guards protect endpoints:

**JwtAuthGuard** (`src/common/guards/jwt-auth.guard.ts`)
- Verifies JWT token is valid
- Extracts user info (id, role, email)
- Applied to all protected endpoints

**RolesGuard** (`src/common/guards/roles.guard.ts`)
- Checks if user has required role
- Used with `@Roles()` decorator
- Throws `ForbiddenException` if role not allowed

**PermissionsGuard** (`src/common/guards/permissions.guard.ts`)
- Checks if user has specific permissions
- Used with `@RequirePermissions()` decorator
- More granular than role-based access

### 3. Decorators

```typescript
// Restrict to specific roles
@Roles('ryl_admin', 'school_admin')
async deleteSchool(@Param('id') id: string) { }

// Require specific permissions
@RequirePermissions(Permission.CREATE_SCHOOL, Permission.MANAGE_USERS)
async createSchoolWithUsers(@Body() data: any) { }
```

## Implementing RBAC

### Step 1: Add Guards to Module

Update your module to include guards in providers:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Module({
  providers: [
    SchoolService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class SchoolModule {}
```

Or apply to controller:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController { }
```

### Step 2: Apply Role Decorators

```typescript
@Post()
@Roles('ryl_admin')  // Only RYL Admin can create schools
async createSchool(@Body() createSchoolDto: CreateSchoolDto) {
  return this.schoolService.createSchool(createSchoolDto);
}

@Get(':id')
@Roles('ryl_admin', 'school_admin', 'teacher')  // Multiple roles allowed
async getSchool(@Param('id') schoolId: string) {
  return this.schoolService.getSchool(schoolId);
}

@Delete(':id')
@Roles('ryl_admin')  // Only RYL Admin can delete
async deleteSchool(@Param('id') schoolId: string) {
  return this.schoolService.deleteSchool(schoolId);
}
```

### Step 3: Permission-Based Access (Optional)

For more granular control:

```typescript
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { Permission } from 'src/common/constants/permissions';

@Post('/:schoolId/bulk-create-students')
@RequirePermissions(Permission.CREATE_STUDENT, Permission.MANAGE_ACADEMICS)
async bulkCreateStudents(
  @Param('schoolId') schoolId: string,
  @Body() students: CreateStudentDto[],
) {
  // Only users with both permissions can call this
  return this.studentService.bulkCreate(schoolId, students);
}
```

## Role Permissions Matrix

### RYL Admin
- Full access to all endpoints
- Can create/manage organizations, districts, schools
- Can manage users and roles
- Access to all analytics and reports

### School Admin
- Manage their school's data
- Create/edit students and staff
- Publish assessments
- View all school reports
- Send notifications
- Cannot create new schools or manage other schools

### Teacher
- View their assigned students
- Mark attendance and academics
- Submit assessments
- View student progress reports
- Refer students for counselling
- Cannot create new students (admin only)

### Parent
- View only their child's data
- Submit assessments for their child
- View their child's reports
- Cannot access other students' data

### Student
- Submit assessments
- View their own progress
- Manage preferences
- Cannot access other students' data

## Database Integration

User roles are stored in the `users` table:

```sql
-- User record
INSERT INTO users (
  id, email, firstName, lastName, passwordHash,
  userType,  -- 'school_admin', 'teacher', 'parent', 'student', 'ryl_admin'
  roleType,  -- 'admin', 'user', 'viewer'
  schoolId,
  isActive,
  createdAt, updatedAt
) VALUES (...)
```

The JWT token includes the role:

```typescript
// auth.service.ts
async generateTokens(userId: string, schoolId: string, role: string, email: string) {
  const payload = {
    sub: userId,
    schoolId,
    role,        // 'ryl_admin', 'school_admin', 'teacher', etc.
    email,
  };
  // ... generate JWT with payload
}
```

## Testing RBAC

### 1. Login with different roles

```bash
# RYL Admin
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@school.edu",
    "password": "admin123"
  }'

# Teacher
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@school.edu",
    "password": "teacher123"
  }'
```

### 2. Try accessing restricted endpoint

```bash
# With admin token (should succeed)
curl -X POST http://localhost:3000/api/v2/schools \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "New School", "district": "Pune", ...}'

# With teacher token (should fail with 403)
curl -X POST http://localhost:3000/api/v2/schools \
  -H "Authorization: Bearer {teacher_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "New School", "district": "Pune", ...}'

# Response: 403 Forbidden
# {
#   "statusCode": 403,
#   "message": "This action requires one of the following roles: ryl_admin. Your role: teacher"
# }
```

### 3. Check in seeded data

```bash
# Login with test credentials from seed.ts
admin1@school.edu / admin123    # ryl_admin role
teacher1@school.edu / teacher123  # teacher role
```

## Best Practices

### Do ✅
- Use `@Roles()` for simple role-based checks
- Use `@RequirePermissions()` for complex permission requirements
- Always apply `JwtAuthGuard` first, then `RolesGuard`
- Test with multiple user roles
- Document role requirements in API comments
- Use Swagger's `@ApiBearerAuth()` to indicate auth requirement

### Don't ❌
- Don't hardcode role strings (use role constants instead)
- Don't skip role checks for "internal" endpoints
- Don't mix role and permission checks unnecessarily
- Don't allow permission escalation (e.g., teacher creating new teachers)
- Don't expose role information in error messages to external users

## Adding New Roles

To add a new role (e.g., 'counsellor'):

### 1. Update UserType enum

```typescript
// User.entity.ts
export enum UserType {
  SCHOOL_ADMIN = 'school_admin',
  TEACHER = 'teacher',
  PARENT = 'parent',
  STUDENT = 'student',
  RYL_ADMIN = 'ryl_admin',
  RYL_SUPPORT = 'ryl_support',
  COUNSELLOR = 'counsellor',  // Add new role
}
```

### 2. Add permissions mapping

```typescript
// permissions.ts
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // ... existing roles
  counsellor: [
    Permission.VIEW_STUDENTS,
    Permission.VIEW_STUDENT_DETAILS,
    Permission.VIEW_WELLBEING,
    Permission.MANAGE_COUNSELLOR_REFERRAL,
    Permission.MANAGE_INTERVENTIONS,
    // Add specific permissions
  ],
};
```

### 3. Use in controllers

```typescript
@Post()
@Roles('ryl_admin', 'school_admin', 'counsellor')  // Add new role
async createReferral(@Body() data: CreateReferralDto) {
  return this.wellbeingService.createReferral(data);
}
```

## Troubleshooting

### 403 Forbidden - Role not allowed
**Error:** `This action requires one of the following roles: ryl_admin. Your role: teacher`

**Solution:** User doesn't have required role. Either:
1. Login with correct user (e.g., admin account)
2. Change endpoint role requirements
3. Create test user with correct role

### 401 Unauthorized - Invalid token
**Error:** `Unauthorized`

**Solution:**
1. Verify JWT token is valid and not expired
2. Login to get new token
3. Include `Authorization: Bearer {token}` header

### Roles not recognized
**Error:** `User role not found`

**Solution:**
1. Check user record has userType or roleType set
2. Verify role value matches enum values
3. Check JWT payload includes role claim

## Advanced: Custom Permission Logic

For complex scenarios needing more than role-based checks:

```typescript
// Create custom decorator
export const RequireSchoolAccess = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata('requireSchoolAccess', true)(target, propertyKey, descriptor);
  };
};

// Create custom guard
@Injectable()
export class SchoolAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requireSchoolAccess = this.reflector.get('requireSchoolAccess', 
      context.getHandler());
    if (!requireSchoolAccess) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const schoolId = request.params.schoolId;

    // Check if user belongs to this school
    if (user.schoolId !== schoolId && user.role !== 'ryl_admin') {
      throw new ForbiddenException('Access denied to this school');
    }
    return true;
  }
}

// Use in controller
@Get(':schoolId/students')
@RequireSchoolAccess()
async getSchoolStudents(@Param('schoolId') schoolId: string) {
  return this.studentService.getBySchool(schoolId);
}
```

## API Documentation

In Swagger, role requirements appear in endpoint descriptions:

```typescript
@Get(':id')
@Roles('ryl_admin', 'school_admin', 'teacher')
@ApiOperation({ 
  summary: 'Get school details',
  description: 'Allowed roles: RYL Admin, School Admin, Teacher'
})
async getSchool(@Param('id') schoolId: string) { }
```

This displays in the generated OpenAPI spec at `/docs`.
