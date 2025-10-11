import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * PermissionGate Component
 *
 * Conditionally renders children based on user permissions.
 * Uses OR logic - user needs ANY of the specified permissions.
 *
 * @example
 * <PermissionGate permissions={['users:create:all', 'users:create:own']}>
 *   <Button>Add User</Button>
 * </PermissionGate>
 *
 * @example
 * <PermissionGate
 *   permissions="tenants:read:all"
 *   fallback={<div>Access Denied</div>}
 * >
 *   <TenantList />
 * </PermissionGate>
 */
export interface PermissionGateProps {
  /**
   * Required permission(s) - can be a single string or array
   * If array, user needs ANY of the permissions (OR logic)
   */
  permissions: string[] | string;

  /**
   * Optional component to render when permission is denied
   */
  fallback?: React.ReactNode;

  /**
   * Children to render when permission is granted
   */
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permissions,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Normalize to array
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  // Check if user has ANY of the required permissions
  const canAccess = hasAnyPermission(requiredPermissions);

  return canAccess ? <>{children}</> : <>{fallback}</>;
};
