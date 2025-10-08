import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type PermissionsMetadata } from '@ftry/shared/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionsMetadata = this.reflector.getAllAndOverride<PermissionsMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionsMetadata || permissionsMetadata.permissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      return false;
    }

    const { permissions: requiredPermissions, requireAll } = permissionsMetadata;

    if (requireAll) {
      // AND logic: User must have ALL required permissions
      return requiredPermissions.every((permission) => user.permissions.includes(permission));
    } else {
      // OR logic: User needs at least ONE of the required permissions (default behavior)
      return requiredPermissions.some((permission) => user.permissions.includes(permission));
    }
  }
}
