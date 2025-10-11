/**
 * Type Guards and Predicates
 *
 * Provides runtime type checking with TypeScript type narrowing.
 * These guards ensure type safety at runtime boundaries (API responses, user input, etc.)
 */

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid number (not NaN)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isValidNumber(value) && value > 0;
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if a value is a valid array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if a value is an object (not null, array, or Date)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
}

/**
 * Check if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  property: K,
): value is Record<K, unknown> {
  return isObject(value) && property in value;
}

/**
 * Check if a value has multiple properties
 */
export function hasProperties<K extends string>(
  value: unknown,
  properties: K[],
): value is Record<K, unknown> {
  return isObject(value) && properties.every((prop) => prop in value);
}

/**
 * Create a type guard for a discriminated union
 */
export function hasDiscriminator<T extends string, V extends number | string>(
  value: unknown,
  discriminator: T,
  discriminatorValue: V,
): value is Record<T, V> {
  return hasProperty(value, discriminator) && value[discriminator] === discriminatorValue;
}

/**
 * Check if a value matches one of the allowed values (enum guard)
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  allowedValues: T,
): value is T[number] {
  return allowedValues.includes(value);
}

/**
 * Type guard for async results
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    isObject(value) &&
    typeof (value as any).then === 'function' &&
    typeof (value as any).catch === 'function'
  );
}

/**
 * Type guard for errors
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for specific error types
 */
export function isErrorWithCode(value: unknown): value is Error & { code: string } {
  return isError(value) && 'code' in value && typeof value.code === 'string';
}

/**
 * Type guard for API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    isObject(value) &&
    typeof value['success'] === 'boolean' &&
    (value['success'] ? 'data' in value : 'error' in value || 'message' in value)
  );
}

/**
 * Type guard for pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function isPaginationMeta(value: unknown): value is PaginationMeta {
  return (
    isObject(value) &&
    isValidNumber(value['page']) &&
    isValidNumber(value['limit']) &&
    isValidNumber(value['total']) &&
    isValidNumber(value['totalPages'])
  );
}

/**
 * Type guard for paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function isPaginatedResponse<T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T,
): value is PaginatedResponse<T> {
  if (!isObject(value)) return false;
  if (!isArray(value['data'])) return false;
  if (!isPaginationMeta(value['meta'])) return false;

  // If item guard provided, validate all items
  if (itemGuard) {
    return (value['data'] as unknown[]).every(itemGuard);
  }

  return true;
}

/**
 * Create a type guard for an object shape
 */
export function createObjectGuard<T extends Record<string, unknown>>(shape: {
  [K in keyof T]: (value: unknown) => value is T[K];
}): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    if (!isObject(value)) return false;

    for (const [key, guard] of Object.entries(shape)) {
      if (!(key in value) || !guard(value[key as keyof typeof value])) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Create a type guard for arrays of a specific type
 */
export function createArrayGuard<T>(
  itemGuard: (value: unknown) => value is T,
): (value: unknown) => value is T[] {
  return (value: unknown): value is T[] => {
    return isArray(value) && value.every(itemGuard);
  };
}

/**
 * Assert that a value passes a type guard, throwing if it doesn't
 */
export function assertIs<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  message?: string,
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(message || 'Type assertion failed');
  }
}

/**
 * Assert that a value is never (for exhaustive checks)
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Example usage:
 *
 * ```typescript
 * // API response validation
 * const response = await fetch('/api/users');
 * const data = await response.json();
 *
 * if (isApiResponse(data) && data.success) {
 *   // TypeScript knows data.data exists
 *   console.log(data.data);
 * }
 *
 * // Creating custom guards
 * const isUser = createObjectGuard({
 *   id: isNonEmptyString,
 *   email: isNonEmptyString,
 *   age: isPositiveNumber,
 * });
 *
 * if (isUser(unknownValue)) {
 *   // TypeScript knows the shape of unknownValue
 *   console.log(unknownValue.email);
 * }
 *
 * // Exhaustive checks
 * type Status = 'pending' | 'active' | 'inactive';
 *
 * function handleStatus(status: Status) {
 *   switch (status) {
 *     case 'pending':
 *       return 'Waiting';
 *     case 'active':
 *       return 'Running';
 *     case 'inactive':
 *       return 'Stopped';
 *     default:
 *       return assertNever(status); // Compile error if cases missed
 *   }
 * }
 * ```
 */
