import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserWithPermissions } from '@ftry/shared/types';

/**
 * Data Scoping Service
 *
 * Provides automatic data scoping based on user permissions.
 * This service ensures users only see data they have permission to access.
 *
 * Permission Scope Logic:
 * - :all suffix = can access across all tenants (super admin)
 * - :own suffix = can access only within own tenant (tenant admin)
 */

// Type for Prisma query objects
interface PrismaQueryBase {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: Array<Record<string, unknown>> | Record<string, unknown>;
  take?: number;
  skip?: number;
}

// Type for entities with tenantId
interface EntityWithTenant {
  tenantId: string | null;
  [key: string]: unknown;
}

@Injectable()
export class DataScopingService {
  /**
   * Apply data scoping to a Prisma query based on user permissions
   *
   * @param user - Current authenticated user with permissions
   * @param query - Base Prisma query object
   * @param resource - Resource type (e.g., 'users', 'tenants', 'roles')
   * @returns Modified query with appropriate where clauses
   */
  scopeQuery<T extends PrismaQueryBase>(user: UserWithPermissions, query: T, resource: string): T {
    // If user has "all" permission, no scoping needed
    if (user.permissions?.includes(`${resource}:read:all`)) {
      return query; // Return unmodified query
    }

    // If user has "own" permission, add tenant filter
    if (user.permissions?.includes(`${resource}:read:own`)) {
      return {
        ...query,
        where: {
          ...query.where,
          tenantId: user.tenantId,
        },
      };
    }

    // No read permissions - throw error
    throw new ForbiddenException('Insufficient permissions');
  }

  /**
   * Check if user can access a specific entity
   *
   * @param user - Current authenticated user
   * @param entity - Entity to check access for
   * @param permission - Required permission (e.g., 'users:update:all')
   * @returns boolean indicating if access is allowed
   */
  canAccessEntity(
    user: UserWithPermissions,
    entity: EntityWithTenant,
    permission: string,
  ): boolean {
    if (!entity) {
      return false;
    }

    // Super admin (tenantId === null) can access everything
    if (user.tenantId === null) {
      return true;
    }

    // Check if permission allows cross-tenant access
    if (permission.endsWith(':all')) {
      return user.permissions?.includes(permission) || false;
    }

    // Check if permission is for own tenant only
    if (permission.endsWith(':own')) {
      return (user.permissions?.includes(permission) || false) && entity.tenantId === user.tenantId;
    }

    return false;
  }

  /**
   * Validate tenant access for create/update operations
   *
   * @param user - Current authenticated user
   * @param targetTenantId - Tenant ID being accessed
   * @param operation - Operation type ('create', 'update', 'delete')
   * @param resource - Resource type
   * @throws ForbiddenException if access is denied
   */
  validateTenantAccess(
    user: UserWithPermissions,
    targetTenantId: string | null,
    operation: 'create' | 'delete' | 'update',
    resource: string,
  ): void {
    // Super admin can access any tenant
    if (user.tenantId === null) {
      return;
    }

    // Check if user has "all" permission for this operation
    if (user.permissions?.includes(`${resource}:${operation}:all`)) {
      return;
    }

    // Check if user has "own" permission and is accessing own tenant
    if (
      user.permissions?.includes(`${resource}:${operation}:own`) &&
      targetTenantId === user.tenantId
    ) {
      return;
    }

    throw new ForbiddenException(`Cannot ${operation} ${resource} in tenant ${targetTenantId}`);
  }

  /**
   * Get filtered role list based on user permissions
   * - Super admin: all roles
   * - Tenant admin: system roles + tenant-specific roles
   */
  getRoleScope(user: UserWithPermissions): Record<string, unknown> {
    // Super admin sees all roles
    if (user.tenantId === null) {
      return {}; // No filter
    }

    // Tenant admin sees system roles + own tenant roles
    return {
      OR: [{ type: 'system' }, { tenantId: user.tenantId }],
    };
  }
}
