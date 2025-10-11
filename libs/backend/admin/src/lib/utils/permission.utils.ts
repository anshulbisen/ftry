import { ForbiddenException } from '@nestjs/common';
import type { UserWithPermissions } from '@ftry/shared/types';
import type { DataScopingService } from '../services/data-scoping.service';

/**
 * Permission Utilities
 *
 * Centralized permission checking utilities to reduce code duplication.
 * All permission checks should use these utilities for consistency.
 */

/**
 * Require specific permission to access an entity
 *
 * @param scopingService - Data scoping service instance
 * @param currentUser - Current authenticated user
 * @param entity - Entity to check access for
 * @param operation - Operation type (read, update, delete)
 * @param resource - Resource type (users, roles, tenants, etc.)
 * @throws ForbiddenException if user lacks permission
 */
export function requirePermission(
  scopingService: DataScopingService,
  currentUser: UserWithPermissions,
  entity: { tenantId: string | null; [key: string]: unknown },
  operation: 'delete' | 'read' | 'update',
  resource: string,
): void {
  const canAccess =
    scopingService.canAccessEntity(currentUser, entity, `${resource}:${operation}:all`) ||
    scopingService.canAccessEntity(currentUser, entity, `${resource}:${operation}:own`);

  if (!canAccess) {
    throw new ForbiddenException(`Cannot ${operation} ${resource}`);
  }
}

/**
 * Require user to have at least one of the specified permissions
 *
 * @param currentUser - Current authenticated user
 * @param permissions - List of acceptable permissions (OR logic)
 * @throws ForbiddenException if user lacks all permissions
 */
export function requireAnyPermission(
  currentUser: UserWithPermissions,
  permissions: string[],
): void {
  const userPermissions = currentUser.permissions || currentUser.role?.permissions || [];
  const hasPermission = permissions.some((p) => userPermissions.includes(p));

  if (!hasPermission) {
    throw new ForbiddenException('Insufficient permissions');
  }
}

/**
 * Require user to have all of the specified permissions
 *
 * @param currentUser - Current authenticated user
 * @param permissions - List of required permissions (AND logic)
 * @throws ForbiddenException if user lacks any permission
 */
export function requireAllPermissions(
  currentUser: UserWithPermissions,
  permissions: string[],
): void {
  const userPermissions = currentUser.permissions || currentUser.role?.permissions || [];
  const hasAllPermissions = permissions.every((p) => userPermissions.includes(p));

  if (!hasAllPermissions) {
    throw new ForbiddenException('Insufficient permissions');
  }
}

/**
 * Check if user has a specific permission (boolean return)
 *
 * @param currentUser - Current authenticated user
 * @param permission - Permission to check
 * @returns true if user has permission, false otherwise
 */
export function hasPermission(currentUser: UserWithPermissions, permission: string): boolean {
  const userPermissions = currentUser.permissions || currentUser.role?.permissions || [];
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions (boolean return)
 *
 * @param currentUser - Current authenticated user
 * @param permissions - List of permissions to check (OR logic)
 * @returns true if user has at least one permission, false otherwise
 */
export function hasAnyPermission(currentUser: UserWithPermissions, permissions: string[]): boolean {
  const userPermissions = currentUser.permissions || currentUser.role?.permissions || [];
  return permissions.some((p) => userPermissions.includes(p));
}
