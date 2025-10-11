/**
 * Permissions Debug Page
 *
 * Temporary debugging page to diagnose the blank permissions page issue.
 */

import { useAllPermissions } from '@/hooks/useAdminData';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';

export function PermissionsDebug() {
  const { data, isLoading, error, isError } = useAllPermissions();
  const { user, isAuthenticated } = useAuthStore();
  const { hasPermission, hasAnyPermission, permissions: userPermissions } = usePermissions();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Permissions Debug Info</h1>

      {/* Auth State */}
      <div className="bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Auth State</h2>
        <pre className="text-xs overflow-auto max-h-60 bg-muted p-2 rounded">
          {JSON.stringify(
            {
              isAuthenticated,
              userId: user?.id,
              email: user?.email,
              roleName: user?.role?.name,
              userPermissions: user?.permissions,
              rolePermissions: user?.role?.permissions,
            },
            null,
            2,
          )}
        </pre>
      </div>

      {/* Permission Checks */}
      <div className="bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Permission Checks</h2>
        <ul className="space-y-1 text-sm">
          <li>
            hasPermission('permissions:read:all'):{' '}
            {hasPermission('permissions:read:all').toString()}
          </li>
          <li>
            hasAnyPermission(['permissions:read:all']):{' '}
            {hasAnyPermission(['permissions:read:all']).toString()}
          </li>
          <li>User Permissions Count: {userPermissions.length}</li>
        </ul>
      </div>

      {/* Query State */}
      <div className="bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">TanStack Query State</h2>
        <ul className="space-y-1 text-sm">
          <li>isLoading: {isLoading.toString()}</li>
          <li>isError: {isError.toString()}</li>
          <li>error: {error ? error.message : 'null'}</li>
          <li>data: {data ? `Array with ${data.length} items` : 'null or empty'}</li>
        </ul>
      </div>

      {/* API Response Data */}
      <div className="bg-card p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">API Response Data</h2>
        <pre className="text-xs overflow-auto max-h-80 bg-muted p-2 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
