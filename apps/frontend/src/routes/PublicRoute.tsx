import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/constants/routes';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for public routes (login, register)
 * Redirects authenticated users to dashboard
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    // Redirect to the page they were trying to access, or dashboard
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    return <Navigate to={from || ROUTES.APP.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
