/**
 * User Sanitization Utility
 * Provides consistent user object sanitization across the application
 */

import type { SafeUser, UserWithPermissions } from '@ftry/shared/types';

/**
 * Fields that should be removed for security reasons
 */
const SENSITIVE_FIELDS = [
  'password',
  'loginAttempts',
  'lockedUntil',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpiry',
] as const;

/**
 * Remove sensitive fields from a user object
 */
export function sanitizeUser<T extends Record<string, unknown>>(
  user: T,
  fieldsToRemove: readonly string[] = SENSITIVE_FIELDS,
): Omit<T, (typeof fieldsToRemove)[number]> {
  const sanitized = { ...user };

  for (const field of fieldsToRemove) {
    delete sanitized[field];
  }

  return sanitized;
}

/**
 * Create a safe user object for client consumption
 * Removes all sensitive authentication and security fields
 */
export function toSafeUser(user: UserWithPermissions): SafeUser {
  // Use type assertion through unknown to handle the transformation
  const userObj = user as unknown as Record<string, unknown>;

  // Create a copy and remove sensitive fields
  const safeUser = { ...userObj };

  // Remove all sensitive fields
  for (const field of SENSITIVE_FIELDS) {
    delete safeUser[field];
  }

  return safeUser as SafeUser;
}

/**
 * Remove only the password field
 * Used when other security fields might be needed internally
 */
export function removePassword<T extends { password?: unknown }>(user: T): Omit<T, 'password'> {
  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Check if a user object contains sensitive fields
 * Useful for validation and testing
 */
export function hasSensitiveFields(user: Record<string, unknown>): boolean {
  return SENSITIVE_FIELDS.some((field) => field in user);
}

/**
 * Get list of sensitive fields
 * Useful for documentation and testing
 */
export function getSensitiveFields(): readonly string[] {
  return SENSITIVE_FIELDS;
}
