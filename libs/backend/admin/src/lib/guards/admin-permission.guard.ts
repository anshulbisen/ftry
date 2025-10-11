import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

/**
 * Admin Permission Guard
 *
 * Enforces permission-based access control for admin endpoints.
 * Works in conjunction with @RequirePermissions decorator.
 *
 * Permission Logic:
 * - If no permissions required, allows access
 * - If permissions required, checks if user has ANY of them (OR logic)
 * - Throws ForbiddenException if user lacks required permissions
 */
@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());

    // If no specific permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // User must be authenticated (handled by JwtAuthGuard)
    // Return false instead of throwing - let JwtAuthGuard handle auth errors
    if (!user?.permissions) {
      return false;
    }

    // Check if user has ANY of the required permissions (OR logic)
    // This allows flexible access control:
    // - Super admin has 'users:read:all'
    // - Tenant admin has 'users:read:own'
    // - Both can access the endpoint
    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Required permissions: ${requiredPermissions.join(' OR ')}`);
    }

    return true;
  }
}
