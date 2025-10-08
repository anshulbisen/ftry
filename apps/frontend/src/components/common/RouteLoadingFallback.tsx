import { useLocation } from 'react-router-dom';
import { DashboardSkeleton } from './skeletons/DashboardSkeleton';
import { ROUTES } from '@/constants/routes';

/**
 * Loading fallback component for lazy-loaded routes
 * Shows skeleton UI for better perceived performance
 */
export function RouteLoadingFallback() {
  const location = useLocation();

  // Show dashboard skeleton for app routes, spinner for public routes
  const isAppRoute = location.pathname.startsWith('/app');

  if (isAppRoute) {
    return (
      <div className="p-4 md:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Public routes: centered spinner
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Loading...</p>
          <p className="text-xs text-muted-foreground">Please wait</p>
        </div>
      </div>
    </div>
  );
}
