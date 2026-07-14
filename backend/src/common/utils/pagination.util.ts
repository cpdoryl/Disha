import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationDto, PaginationMetadata, PaginatedResponse } from '../dto/pagination.dto';

/**
 * Pagination utilities for consistent pagination across all endpoints
 */
export class PaginationUtil {
  /**
   * Apply pagination to a query builder
   * @param query - TypeORM query builder
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param validSortColumns - Allowed columns for sorting
   * @param sort - Column to sort by
   * @param order - Sort order (ASC/DESC)
   */
  static applyPagination<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 20,
    validSortColumns: string[] = [],
    sort?: string,
    order: 'ASC' | 'DESC' = 'ASC',
  ): SelectQueryBuilder<T> {
    // Validate page and limit
    page = Math.max(1, Math.min(page, 10000)); // Prevent excessive pagination
    limit = Math.max(1, Math.min(limit, 100)); // Prevent huge responses

    // Apply sorting if valid column provided
    if (sort && validSortColumns.includes(sort)) {
      const alias = query.alias;
      query = query.orderBy(`${alias}.${sort}`, order);
    }

    // Apply offset and limit
    query = query.skip((page - 1) * limit).take(limit);

    return query;
  }

  /**
   * Create paginated response with metadata
   * @param data - Array of paginated items
   * @param page - Current page
   * @param limit - Items per page
   * @param total - Total items count
   */
  static buildPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Apply search filter to query
   * Searches multiple columns with ILIKE (case-insensitive)
   */
  static applySearch<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    searchTerm: string,
    searchColumns: string[],
  ): SelectQueryBuilder<T> {
    if (!searchTerm || !searchColumns.length) {
      return query;
    }

    const alias = query.alias;
    const term = `%${searchTerm}%`;

    // Build OR condition for multiple columns
    const conditions = searchColumns
      .map((col, idx) => `${alias}.${col} ILIKE :searchTerm${idx}`)
      .join(' OR ');

    const parameters = searchColumns.reduce(
      (acc, _, idx) => {
        acc[`searchTerm${idx}`] = term;
        return acc;
      },
      {} as Record<string, string>,
    );

    query = query.andWhere(`(${conditions})`, parameters);

    return query;
  }

  /**
   * Apply status filter
   */
  static applyStatusFilter<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    status?: string,
  ): SelectQueryBuilder<T> {
    if (status) {
      query = query.andWhere(`${query.alias}.status = :status`, { status });
    }
    return query;
  }

  /**
   * Apply date range filter
   */
  static applyDateRangeFilter<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    fromDate?: string,
    toDate?: string,
    dateColumn: string = 'createdAt',
  ): SelectQueryBuilder<T> {
    const alias = query.alias;

    if (fromDate) {
      query = query.andWhere(`${alias}.${dateColumn} >= :fromDate`, {
        fromDate: new Date(fromDate),
      });
    }

    if (toDate) {
      query = query.andWhere(`${alias}.${dateColumn} <= :toDate`, {
        toDate: new Date(toDate),
      });
    }

    return query;
  }

  /**
   * Apply multiple filters
   * @param query - Query builder
   * @param filters - Object with column: value pairs
   */
  static applyFilters<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    filters: Record<string, any>,
  ): SelectQueryBuilder<T> {
    const alias = query.alias;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
      }
    }

    return query;
  }

  /**
   * Calculate pagination offset
   */
  static getOffset(page: number, limit: number): number {
    return Math.max(0, (page - 1) * limit);
  }

  /**
   * Validate sort column against whitelist
   */
  static validateSortColumn(sort: string, allowedColumns: string[]): string | null {
    return allowedColumns.includes(sort) ? sort : null;
  }
}

/**
 * Decorator for automatic pagination
 * Usage: @ApplyPagination(['name', 'email'])
 * @param sortableColumns - Columns that can be sorted
 */
export function ApplyPagination(sortableColumns: string[] = []) {
  return function <T extends { new (...args: any[]): {} }>(
    constructor: T,
  ) {
    return class extends constructor {
      sortableColumns = sortableColumns;
    };
  };
}
