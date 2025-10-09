import { useCallback } from 'react';
import { useCurrentUser } from '@/lib/api';

/**
 * usePermissions Hook
 *
 * Provides permission checking utilities for admin features.
 * Integrates with the authentication system to access user permissions.
 *
 * @example
 * const { hasPermission, canAccessResource } = usePermissions();
 *
 * if (hasPermission('users:create:all')) {
 *   // Show create user button
 * }
 *
 * if (canAccessResource('tenants', 'read')) {
 *   // Show tenants menu
 * }
 */
export const usePermissions = () => {
  const { data: user } = useCurrentUser();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user || !user.role?.permissions) {
        return false;
      }
      return user.role.permissions.includes(permission);
    },
    [user],
  );

  /**
   * Check if user has ANY of the specified permissions (OR logic)
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (permissions.length === 0) {
        return false;
      }
      if (!user || !user.role?.permissions) {
        return false;
      }
      return permissions.some((p) => user.role.permissions.includes(p));
    },
    [user],
  );

  /**
   * Check if user has ALL of the specified permissions (AND logic)
   */
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (permissions.length === 0) {
        return true;
      }
      if (!user || !user.role?.permissions) {
        return false;
      }
      return permissions.every((p) => user.role.permissions.includes(p));
    },
    [user],
  );

  /**
   * Check if user can access a resource for a specific action
   * Checks both :all and :own permission variants
   *
   * @param resource - Resource type (e.g., 'users', 'tenants')
   * @param action - Action type (e.g., 'read', 'create', 'update')
   */
  const canAccessResource = useCallback(
    (resource: string, action: string): boolean => {
      return hasAnyPermission([`${resource}:${action}:all`, `${resource}:${action}:own`]);
    },
    [hasAnyPermission],
  );

  /**
   * Check if user is a super admin
   */
  const isSuperAdmin = useCallback((): boolean => {
    if (!user) {
      return false;
    }
    // Super admin has tenantId === null
    return user.tenantId === null;
  }, [user]);

  /**
   * Check if user can perform action across all tenants
   */
  const hasGlobalAccess = useCallback(
    (resource: string, action: string): boolean => {
      return hasPermission(`${resource}:${action}:all`);
    },
    [hasPermission],
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource,
    isSuperAdmin,
    hasGlobalAccess,
    permissions: user?.role?.permissions || [],
  };
};
