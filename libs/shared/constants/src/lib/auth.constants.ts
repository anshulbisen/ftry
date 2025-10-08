/**
 * Authentication and Authorization Constants
 * Centralized constants to prevent magic strings and numbers
 */

// Field length limits
export const FIELD_LIMITS = {
  MAX_DEVICE_INFO_LENGTH: 255,
  MAX_IP_ADDRESS_LENGTH: 45, // IPv6 max length
  MAX_REASON_LENGTH: 255,
} as const;

// Token Configuration
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  ACCESS_TOKEN_EXPIRY_SECONDS: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  REFRESH_TOKEN_LENGTH: 32, // bytes for crypto generation
} as const;

// Account Security
export const ACCOUNT_SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_DURATION_MINUTES: 15,
  SALT_ROUNDS: 12,
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
  LOCKED: 'locked',
} as const;

// Role Names
export const ROLE_NAMES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_OWNER: 'tenant_owner',
  TENANT_ADMIN: 'tenant_admin',
  TENANT_MANAGER: 'tenant_manager',
  TENANT_USER: 'tenant_user',
} as const;

// Error Messages
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_LOCKED: 'Account is locked. Try again later',
  ACCOUNT_NOT_ACTIVE: 'Account is not active',
  ACCOUNT_DELETED: 'Account has been deleted',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  ROLE_NOT_FOUND: 'Role not found',
  TENANT_NOT_FOUND: 'Tenant not found',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid refresh token',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_REVOKED: 'Token has been revoked',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
} as const;

// API Response Messages
export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
} as const;
