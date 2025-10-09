import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store required permissions
 * Should match the key used in AdminPermissionGuard
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * RequirePermissions Decorator
 *
 * Marks an endpoint as requiring specific permissions.
 * Used in conjunction with AdminPermissionGuard.
 *
 * @param permissions - Array of permission strings (OR logic)
 *
 * @example
 * // User needs EITHER 'users:read:all' OR 'users:read:own'
 * @RequirePermissions(['users:read:all', 'users:read:own'])
 * async getUsers() { ... }
 *
 * @example
 * // User needs 'tenants:create' (only super admin)
 * @RequirePermissions(['tenants:create'])
 * async createTenant() { ... }
 */
export const RequirePermissions = (permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
