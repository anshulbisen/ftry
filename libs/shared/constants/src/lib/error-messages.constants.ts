/**
 * Standardized error messages for the application
 * Centralized to ensure consistency across frontend and backend
 */

export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    LOGIN_FAILED: 'Login failed. Please try again.',
    DEMO_LOGIN_FAILED: 'Demo login failed. Please try again.',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    TOKEN_INVALID: 'Invalid or expired token. Please login again.',
    TOKEN_REUSE: 'Token reuse detected. All sessions have been revoked for security.',
    ACCOUNT_LOCKED: 'Account locked due to multiple failed login attempts. Try again later.',
    EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
  },

  // Network errors
  NETWORK: {
    ERROR: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  },

  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    PASSWORD_TOO_LONG: 'Password cannot exceed 128 characters',
    PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number, and special character',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    INVALID_FORMAT: 'Invalid format',
  },

  // User management errors
  USER: {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'A user with this email already exists',
    CREATE_FAILED: 'Failed to create user',
    UPDATE_FAILED: 'Failed to update user',
    DELETE_FAILED: 'Failed to delete user',
    INVITE_FAILED: 'Failed to send user invitation',
  },

  // Role & Permission errors
  RBAC: {
    ROLE_NOT_FOUND: 'Role not found',
    PERMISSION_NOT_FOUND: 'Permission not found',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
    CANNOT_DELETE_DEFAULT_ROLE: 'Cannot delete default system role',
    ROLE_IN_USE: 'Cannot delete role that is assigned to users',
  },

  // Generic errors
  GENERIC: {
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
    NOT_FOUND: 'Resource not found',
    FORBIDDEN: 'Access forbidden',
    BAD_REQUEST: 'Invalid request',
    INTERNAL_ERROR: 'Internal server error',
  },
} as const;

/**
 * Demo credentials for development and testing
 * WARNING: Remove or secure these before production deployment
 */
export const DEMO_CREDENTIALS = {
  SUPER_ADMIN: {
    email: 'super@ftry.com',
    password: '123123',
    label: 'Super Admin',
  },
  TENANT_ADMIN: {
    email: 'admin@glamour.com',
    password: '123123',
    label: 'Tenant Admin',
  },
  STAFF: {
    email: 'staff@glamour.com',
    password: '123123',
    label: 'Staff Member',
  },
} as const;
