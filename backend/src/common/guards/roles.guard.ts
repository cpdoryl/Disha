import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_PERMISSIONS } from '../constants/permissions';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator — check the handler (method) first,
    // falling back to the class. Several controllers (Audit, Wellbeing,
    // Data, Notification) declare @Roles(...) once at the class level;
    // reading only context.getHandler() misses that metadata entirely,
    // so requiredRoles comes back empty and every route in those
    // controllers silently allows any authenticated user through
    // regardless of role. getAllAndOverride checks both and lets a
    // method-level @Roles(...) override the class-level default, matching
    // standard NestJS guard convention.
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      // No role requirement, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Check if user's role is in the required roles
    const userRole = user.role || user.roleType;
    if (!userRole) {
      throw new ForbiddenException('User role not found');
    }

    const hasRequiredRole = requiredRoles.includes(userRole);
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`,
      );
    }

    return true;
  }
}
