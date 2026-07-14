import { IsOptional, IsNumber, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base pagination query parameters
 * Usage: GET /api/v2/students?page=1&limit=20&sort=name&order=ASC
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string; // Column name to sort by

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}

/**
 * Pagination metadata in response
 */
export class PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * School list query with filtering
 */
export class SchoolListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search by name
}

/**
 * Student list query with filtering
 */
export class StudentListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'withdrawn' | 'transferred' | 'graduated';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gradeLevel?: number;

  @IsOptional()
  @IsString()
  search?: string; // Search by name or enrollment number

  @IsOptional()
  @IsString()
  classSection?: string;
}

/**
 * Assessment list query with filtering
 */
export class AssessmentListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsIn(['draft', 'active', 'closed', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search by cycle name
}

/**
 * User list query with filtering
 */
export class UserListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  userType?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search by email or name
}

/**
 * Attendance query with filtering
 */
export class AttendanceListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  fromDate?: string; // ISO format

  @IsOptional()
  @IsString()
  toDate?: string; // ISO format
}
