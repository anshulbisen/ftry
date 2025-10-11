import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';

/**
 * usePermissions Hook
 *
 * Provides permission checking utilities for admin features.
 * Delegates to auth store for single source of truth.
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
  // Delegate core permission checks to store (single source of truth)
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, user } = useAuthStore();

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
   * Check if user can perform action across all tenants
   */
  const hasGlobalAccess = useCallback(
    (resource: string, action: string): boolean => {
      return hasPermission(`${resource}:${action}:all`);
    },
    [hasPermission],
  );

  /**
   * Check if user can perform action within their tenant
   */
  const hasTenantAccess = useCallback(
    (resource: string, action: string): boolean => {
      return hasPermission(`${resource}:${action}:tenant`);
    },
    [hasPermission],
  );

  return {
    // Core permission checks from store
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    // Derived/convenience methods
    canAccessResource,
    hasGlobalAccess,
    hasTenantAccess,
    permissions: user?.permissions || user?.role?.permissions || [],
  };
};
