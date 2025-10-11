import { SetMetadata } from '@nestjs/common';
import type { PermissionsMetadata } from '@ftry/shared/types';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for a route
 * @param permissions - Array of permission strings required
 * @param requireAll - If true, user must have ALL permissions (AND). If false, user needs ANY (OR). Default: false
 * @example
 * ```typescript
 * // User needs appointments:read OR appointments:write
 * @Permissions(['appointments:read', 'appointments:write'])
 *
 * // User needs BOTH appointments:read AND billing:read
 * @Permissions(['appointments:read', 'billing:read'], true)
 * ```
 */
export const Permissions = (permissions: string[], requireAll = false) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, requireAll } as PermissionsMetadata);
