import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout, PublicLayout } from '@/components/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from '@/constants/routes';
import { RouteLoadingFallback } from '@/components/common/RouteLoadingFallback';
import { PermissionGate } from '@/components/admin/common';

// Lazy load all pages for optimal bundle splitting
// Import directly from individual files to avoid barrel export bundling
// Public pages
const LandingPage = lazy(async () =>
  import('@/pages/public/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(async () =>
  import('@/pages/public/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(async () =>
  import('@/pages/public/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);

// Authenticated pages
const DashboardPage = lazy(async () =>
  import('@/pages/app/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const AppointmentsPage = lazy(async () =>
  import('@/pages/app/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })),
);
const ClientsPage = lazy(async () =>
  import('@/pages/app/ClientsPage').then((m) => ({ default: m.ClientsPage })),
);
const StaffPage = lazy(async () =>
  import('@/pages/app/StaffPage').then((m) => ({ default: m.StaffPage })),
);
const ServicesPage = lazy(async () =>
  import('@/pages/app/ServicesPage').then((m) => ({ default: m.ServicesPage })),
);
const BillingPage = lazy(async () =>
  import('@/pages/app/BillingPage').then((m) => ({ default: m.BillingPage })),
);
const ReportsPage = lazy(async () =>
  import('@/pages/app/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const SettingsPage = lazy(async () =>
  import('@/pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

// Admin pages - Using ResourceManager pattern
const Users = lazy(async () => import('@/pages/admin/Users').then((m) => ({ default: m.Users })));
const Tenants = lazy(async () =>
  import('@/pages/admin/Tenants').then((m) => ({ default: m.Tenants })),
);
const Roles = lazy(async () => import('@/pages/admin/Roles').then((m) => ({ default: m.Roles })));
const Permissions = lazy(async () =>
  import('@/pages/admin/Permissions').then((m) => ({ default: m.Permissions })),
);
const PermissionsDebug = lazy(async () =>
  import('@/pages/admin/PermissionsDebug').then((m) => ({ default: m.PermissionsDebug })),
);

/**
 * Application router configuration
 * Uses React Router v7 with nested routes and layouts
 * All pages are lazy-loaded for optimal bundle splitting
 */
export const router = createBrowserRouter([
  // Public routes
  {
    element: (
      <PublicRoute>
        <PublicLayout />
      </PublicRoute>
    ),
    children: [
      {
        path: ROUTES.PUBLIC.HOME,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <LandingPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PUBLIC.LOGIN,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.PUBLIC.FORGOT_PASSWORD,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
    ],
  },

  // Authenticated routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.APP.DASHBOARD,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.APP.APPOINTMENTS,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <AppointmentsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.APP.CLIENTS,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ClientsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.APP.STAFF,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <StaffPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.APP.SERVICES,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ServicesPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.APP.BILLING,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <BillingPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.APP.REPORTS,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.APP.SETTINGS,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      // Admin routes - permission-gated
      {
        path: ROUTES.APP.ADMIN_USERS,
        element: (
          <PermissionGate permissions={['users:read:all', 'users:read:own']}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Users />
            </Suspense>
          </PermissionGate>
        ),
      },
      {
        path: ROUTES.APP.ADMIN_TENANTS,
        element: (
          <PermissionGate permissions={['tenants:read:all', 'tenants:read:own']}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Tenants />
            </Suspense>
          </PermissionGate>
        ),
      },
      {
        path: ROUTES.APP.ADMIN_ROLES,
        element: (
          <PermissionGate permissions={['roles:read:all', 'roles:read:own']}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Roles />
            </Suspense>
          </PermissionGate>
        ),
      },
      {
        path: ROUTES.APP.ADMIN_PERMISSIONS,
        element: (
          <PermissionGate permissions={['permissions:read']}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Permissions />
            </Suspense>
          </PermissionGate>
        ),
      },
      // Temporary debug route
      {
        path: '/admin/permissions-debug',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <PermissionsDebug />
          </Suspense>
        ),
      },
    ],
  },

  // Catch all - redirect to dashboard if authenticated, else home
  {
    path: '*',
    element: <Navigate to={ROUTES.APP.DASHBOARD} replace />,
  },
]);
