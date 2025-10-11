/**
 * Application route constants
 * Centralized route definitions for type-safe navigation
 */

export const ROUTES = {
  // Public routes
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
  },

  // Authenticated routes
  APP: {
    DASHBOARD: '/app/dashboard',

    // Appointments
    APPOINTMENTS: '/app/appointments',
    APPOINTMENTS_NEW: '/app/appointments/new',
    APPOINTMENTS_VIEW: '/app/appointments/:id',

    // Clients
    CLIENTS: '/app/clients',
    CLIENTS_NEW: '/app/clients/new',
    CLIENTS_VIEW: '/app/clients/:id',

    // Staff
    STAFF: '/app/staff',
    STAFF_NEW: '/app/staff/new',
    STAFF_VIEW: '/app/staff/:id',

    // Services
    SERVICES: '/app/services',
    SERVICES_NEW: '/app/services/new',
    SERVICES_VIEW: '/app/services/:id',

    // Billing
    BILLING: '/app/billing',
    INVOICES: '/app/billing/invoices',
    INVOICE_VIEW: '/app/billing/invoices/:id',

    // Reports
    REPORTS: '/app/reports',

    // Admin
    ADMIN_USERS: '/app/admin/users',
    ADMIN_TENANTS: '/app/admin/tenants',
    ADMIN_ROLES: '/app/admin/roles',
    ADMIN_PERMISSIONS: '/app/admin/permissions',

    // Settings
    SETTINGS: '/app/settings',
    SETTINGS_PROFILE: '/app/settings/profile',
    SETTINGS_BUSINESS: '/app/settings/business',
    SETTINGS_NOTIFICATIONS: '/app/settings/notifications',
  },
} as const;

/**
 * Helper function to generate dynamic routes
 */
export const generatePath = (path: string, params: Record<string, number | string>) => {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, String(value)),
    path,
  );
};
