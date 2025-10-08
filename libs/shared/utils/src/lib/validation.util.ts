/**
 * Shared validation utilities for forms
 * Use these to avoid duplicating validation logic
 */

export const ValidationPatterns = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PASSWORD_MEDIUM: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,
  PHONE_INDIA: /^(\+91)?[6-9]\d{9}$/,
  NAME: /^[a-zA-Z\s'-]{1,50}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

export const ValidationMessages = {
  REQUIRED: (field: string) => `${field} is required`,
  EMAIL: 'Please provide a valid email address',
  PASSWORD_WEAK: 'Password must be at least 6 characters long',
  PASSWORD_MEDIUM: 'Password must contain uppercase, lowercase, and number',
  PASSWORD_STRONG: 'Password must contain uppercase, lowercase, number, and special character',
  PHONE: 'Please provide a valid phone number',
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} cannot exceed ${max} characters`,
  UUID: 'Invalid ID format',
} as const;

/**
 * Email validation
 */
export function validateEmail(email: string): string | undefined {
  if (!email) return ValidationMessages.REQUIRED('Email');
  if (!ValidationPatterns.EMAIL.test(email)) return ValidationMessages.EMAIL;
  return undefined;
}

/**
 * Password validation with configurable strength
 */
export function validatePassword(
  password: string,
  strength: 'weak' | 'medium' | 'strong' = 'medium',
): string | undefined {
  if (!password) return ValidationMessages.REQUIRED('Password');

  switch (strength) {
    case 'weak':
      if (password.length < 6) return ValidationMessages.PASSWORD_WEAK;
      break;
    case 'medium':
      if (!ValidationPatterns.PASSWORD_MEDIUM.test(password)) {
        return ValidationMessages.PASSWORD_MEDIUM;
      }
      break;
    case 'strong':
      if (!ValidationPatterns.PASSWORD_STRONG.test(password)) {
        return ValidationMessages.PASSWORD_STRONG;
      }
      break;
  }

  return undefined;
}

/**
 * Name validation (first name, last name)
 */
export function validateName(name: string, field = 'Name'): string | undefined {
  if (!name) return ValidationMessages.REQUIRED(field);
  if (name.trim().length < 1) return ValidationMessages.MIN_LENGTH(field, 1);
  if (name.length > 50) return ValidationMessages.MAX_LENGTH(field, 50);
  if (!ValidationPatterns.NAME.test(name)) {
    return `${field} contains invalid characters`;
  }
  return undefined;
}

/**
 * Phone number validation (Indian format)
 */
export function validatePhoneNumber(phone: string, required = false): string | undefined {
  if (!phone && required) return ValidationMessages.REQUIRED('Phone number');
  if (phone && !ValidationPatterns.PHONE_INDIA.test(phone)) {
    return ValidationMessages.PHONE;
  }
  return undefined;
}

/**
 * UUID validation
 */
export function validateUUID(id: string, field = 'ID'): string | undefined {
  if (!id) return ValidationMessages.REQUIRED(field);
  if (!ValidationPatterns.UUID.test(id)) return ValidationMessages.UUID;
  return undefined;
}

/**
 * Form-level validation composer
 * Combines multiple field validations
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  validators: Partial<Record<keyof T, (value: unknown) => string | undefined>>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};

  Object.entries(validators).forEach(([field, validator]) => {
    if (validator) {
      const error = validator(values[field as keyof T]);
      if (error) {
        errors[field as keyof T] = error;
      }
    }
  });

  return errors;
}

/**
 * Login form validation
 */
export function validateLoginForm(values: { email: string; password: string }) {
  return validateForm(values, {
    email: (value: unknown) => validateEmail(value as string),
    password: (value: unknown) => validatePassword(value as string, 'weak'),
  });
}

/**
 * Registration form validation
 */
export function validateRegistrationForm(values: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  return validateForm(values, {
    email: (value: unknown) => validateEmail(value as string),
    password: (value: unknown) => validatePassword(value as string, 'medium'),
    firstName: (value: unknown) => validateName(value as string, 'First name'),
    lastName: (value: unknown) => validateName(value as string, 'Last name'),
    phone: (value: unknown) => validatePhoneNumber((value as string) || '', false),
  });
}
