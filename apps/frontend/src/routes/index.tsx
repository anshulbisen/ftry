import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout, PublicLayout } from '@/components/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from '@/constants/routes';

// Public pages
import { LandingPage, LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/public';

// Authenticated pages
import {
  DashboardPage,
  AppointmentsPage,
  ClientsPage,
  StaffPage,
  ServicesPage,
  BillingPage,
  ReportsPage,
  SettingsPage,
} from '@/pages/app';

/**
 * Application router configuration
 * Uses React Router v6 with nested routes and layouts
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
        element: <LandingPage />,
      },
      {
        path: ROUTES.PUBLIC.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTES.PUBLIC.REGISTER,
        element: <RegisterPage />,
      },
      {
        path: ROUTES.PUBLIC.FORGOT_PASSWORD,
        element: <ForgotPasswordPage />,
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
        element: <DashboardPage />,
      },
      {
        path: ROUTES.APP.APPOINTMENTS,
        element: <AppointmentsPage />,
      },
      {
        path: ROUTES.APP.CLIENTS,
        element: <ClientsPage />,
      },
      {
        path: ROUTES.APP.STAFF,
        element: <StaffPage />,
      },
      {
        path: ROUTES.APP.SERVICES,
        element: <ServicesPage />,
      },
      {
        path: ROUTES.APP.BILLING,
        element: <BillingPage />,
      },
      {
        path: ROUTES.APP.REPORTS,
        element: <ReportsPage />,
      },
      {
        path: ROUTES.APP.SETTINGS,
        element: <SettingsPage />,
      },
    ],
  },

  // Catch all - redirect to home
  {
    path: '*',
    element: <Navigate to={ROUTES.PUBLIC.HOME} replace />,
  },
]);
