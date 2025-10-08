import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean;
}

/**
 * Route guard for authenticated routes
 * Redirects to login if user is not authenticated
 * Optionally checks for required permissions
 */
export function ProtectedRoute({
  children,
  requiredPermissions,
  requireAll = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasAnyPermission, hasAllPermissions, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted location
    return <Navigate to={ROUTES.PUBLIC.LOGIN} state={{ from: location }} replace />;
  }

  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasPermission) {
      // Redirect to dashboard with error state
      return (
        <Navigate
          to={ROUTES.APP.DASHBOARD}
          state={{ error: 'You do not have permission to access this page.' }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
}
