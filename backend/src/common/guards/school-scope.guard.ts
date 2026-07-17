import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SCHOOL_SCOPE_PARAM_KEY = 'schoolScopeParam';

/**
 * Declares which request field carries the school being accessed, for
 * SchoolScopeGuard to check. Defaults to 'schoolId' (route param, query
 * param, or body field, checked in that order) — pass an explicit name
 * for routes where the identifier is called something else, e.g. the
 * SchoolController's `:id`.
 */
export const SchoolScope = (paramName: string = 'schoolId') => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(SCHOOL_SCOPE_PARAM_KEY, paramName, descriptor?.value || target);
  };
};

/**
 * Enforces that non-ryl_admin callers can only access data scoped to
 * their own school. `ryl_admin` is a platform-wide role by design and is
 * always allowed through.
 *
 * Must run after JwtAuthGuard (needs request.user.schoolId/role) — put it
 * after JwtAuthGuard/RolesGuard in @UseGuards(). Only attach this to
 * routes that actually carry a school identifier in params/query/body;
 * if the identifier is missing on a route this guard is attached to,
 * that's treated as a misconfiguration and access is denied rather than
 * silently allowed, so a wrong param name fails loudly instead of
 * quietly reopening the gap this guard exists to close.
 */
@Injectable()
export class SchoolScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role === 'ryl_admin') {
      return true;
    }

    const paramName =
      this.reflector.get<string>(SCHOOL_SCOPE_PARAM_KEY, context.getHandler()) || 'schoolId';

    const requestedSchoolId =
      request.params?.[paramName] ?? request.query?.[paramName] ?? request.body?.[paramName];

    if (!requestedSchoolId || requestedSchoolId !== user.schoolId) {
      throw new ForbiddenException("You do not have access to this school's data");
    }

    return true;
  }
}
