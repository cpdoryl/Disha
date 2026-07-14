import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../database/entities/School.entity';
import { SchoolListQueryDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils/pagination.util';
import { OptimizedQueries } from '../database/queries/optimized-queries';

/**
 * Example of paginated school service
 * This demonstrates how to add pagination to existing services
 */
@Injectable()
export class SchoolPaginatedService {
  // Columns that can be sorted
  private readonly sortableColumns = ['name', 'district', 'city', 'studentCount', 'createdAt'];

  // Columns to search in
  private readonly searchColumns = ['name', 'district', 'city'];

  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  /**
   * Get paginated list of schools with filtering and sorting
   * @param query - Pagination and filter parameters
   * @returns Paginated response with schools
   */
  async listSchools(query: SchoolListQueryDto) {
    // Extract pagination parameters
    const { page = 1, limit = 20, sort, order = 'ASC', district, city, search } = query;

    // Start with optimized query (selective columns)
    let queryBuilder = OptimizedQueries.getSchoolListQuery(this.schoolRepository);

    // Apply search filter if provided
    if (search) {
      PaginationUtil.applySearch(queryBuilder, search, this.searchColumns);
    }

    // Apply district filter
    if (district) {
      queryBuilder = queryBuilder.andWhere('school.district = :district', { district });
    }

    // Apply city filter
    if (city) {
      queryBuilder = queryBuilder.andWhere('school.city = :city', { city });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply sorting and pagination
    PaginationUtil.applyPagination(
      queryBuilder,
      page,
      limit,
      this.sortableColumns,
      sort,
      order,
    );

    // Execute query
    const schools = await queryBuilder.getRawMany();

    // Return paginated response
    return PaginationUtil.buildPaginatedResponse(schools, page, limit, total);
  }

  /**
   * Search schools by name with pagination
   * @param searchTerm - Search term
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated search results
   */
  async searchSchools(searchTerm: string, page: number = 1, limit: number = 20) {
    let query = this.schoolRepository
      .createQueryBuilder('school')
      .select(['school.id', 'school.name', 'school.district', 'school.city'])
      .where('school.isActive = :isActive', { isActive: true });

    // Apply search
    PaginationUtil.applySearch(query, searchTerm, this.searchColumns);

    // Count total
    const total = await query.getCount();

    // Apply pagination
    PaginationUtil.applyPagination(query, page, limit, this.sortableColumns, 'name', 'ASC');

    const schools = await query.getRawMany();

    return PaginationUtil.buildPaginatedResponse(schools, page, limit, total);
  }

  /**
   * Get schools by district with pagination
   * @param district - District name
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated results
   */
  async getSchoolsByDistrict(
    district: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const query = this.schoolRepository
      .createQueryBuilder('school')
      .select([
        'school.id',
        'school.name',
        'school.district',
        'school.city',
        'school.studentCount',
      ])
      .where('school.district = :district', { district })
      .andWhere('school.isActive = :isActive', { isActive: true });

    const total = await query.getCount();

    PaginationUtil.applyPagination(query, page, limit, this.sortableColumns, 'name', 'ASC');

    const schools = await query.getRawMany();

    return PaginationUtil.buildPaginatedResponse(schools, page, limit, total);
  }

  /**
   * Get schools with multiple filters
   * @param filters - Object with filter parameters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated results
   */
  async getSchoolsWithFilters(
    filters: { district?: string; city?: string; studentCountMin?: number },
    page: number = 1,
    limit: number = 20,
  ) {
    let query = this.schoolRepository
      .createQueryBuilder('school')
      .select([
        'school.id',
        'school.name',
        'school.district',
        'school.city',
        'school.studentCount',
      ])
      .where('school.isActive = :isActive', { isActive: true });

    // Apply filters
    if (filters.district) {
      query = query.andWhere('school.district = :district', { district: filters.district });
    }

    if (filters.city) {
      query = query.andWhere('school.city = :city', { city: filters.city });
    }

    if (filters.studentCountMin) {
      query = query.andWhere('school.studentCount >= :minCount', {
        minCount: filters.studentCountMin,
      });
    }

    const total = await query.getCount();

    PaginationUtil.applyPagination(query, page, limit, this.sortableColumns, 'name', 'ASC');

    const schools = await query.getRawMany();

    return PaginationUtil.buildPaginatedResponse(schools, page, limit, total);
  }

  /**
   * Get schools with custom sorting
   * @param sortBy - Column to sort by (must be in allowedColumns)
   * @param order - Sort order (ASC/DESC)
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated results
   */
  async getSchoolsSorted(
    sortBy: string,
    order: 'ASC' | 'DESC' = 'ASC',
    page: number = 1,
    limit: number = 20,
  ) {
    // Validate sort column
    const validSort = PaginationUtil.validateSortColumn(sortBy, this.sortableColumns);
    if (!validSort) {
      throw new Error(`Invalid sort column: ${sortBy}`);
    }

    const query = this.schoolRepository
      .createQueryBuilder('school')
      .select([
        'school.id',
        'school.name',
        'school.district',
        'school.city',
        'school.studentCount',
        'school.createdAt',
      ])
      .where('school.isActive = :isActive', { isActive: true });

    const total = await query.getCount();

    PaginationUtil.applyPagination(
      query,
      page,
      limit,
      this.sortableColumns,
      validSort,
      order,
    );

    const schools = await query.getRawMany();

    return PaginationUtil.buildPaginatedResponse(schools, page, limit, total);
  }
}

/**
 * Example usage in controller:
 *
 * @Get()
 * async listSchools(@Query() query: SchoolListQueryDto) {
 *   // GET /api/v2/schools?page=1&limit=20&sort=name&order=ASC&district=Pune&search=Public
 *   return this.schoolService.listSchools(query);
 * }
 */
