/**
 * Result Type Pattern for Error Handling
 *
 * Provides a type-safe way to handle success and failure cases
 * without throwing exceptions. Inspired by Rust's Result type.
 */

/**
 * Discriminated union for handling success and failure cases
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return { success: false, error: 'Division by zero' };
 *   }
 *   return { success: true, data: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.success) {
 *   console.log(result.data); // TypeScript knows data exists
 * } else {
 *   console.log(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export type Result<TData, TError = Error> =
  | { success: false; error: TError }
  | { success: true; data: TData };

/**
 * Option type for nullable values (like Rust's Option or Haskell's Maybe)
 */
export type Option<T> = { some: false } | { some: true; value: T };

/**
 * Helper functions for working with Result types
 */
export const Result = {
  /**
   * Create a successful result
   */
  ok: <TData>(data: TData): Result<TData, never> => ({
    success: true,
    data,
  }),

  /**
   * Create a failed result
   */
  err: <TError>(error: TError): Result<never, TError> => ({
    success: false,
    error,
  }),

  /**
   * Check if a Result is successful
   */
  isOk: <TData, TError>(
    result: Result<TData, TError>,
  ): result is { success: true; data: TData } => {
    return result.success === true;
  },

  /**
   * Check if a Result is an error
   */
  isErr: <TData, TError>(
    result: Result<TData, TError>,
  ): result is { success: false; error: TError } => {
    return result.success === false;
  },

  /**
   * Map over a successful result
   */
  map: <TData, TError, TNewData>(
    result: Result<TData, TError>,
    fn: (data: TData) => TNewData,
  ): Result<TNewData, TError> => {
    if (result.success) {
      return Result.ok(fn(result.data));
    }
    return result;
  },

  /**
   * Map over an error result
   */
  mapErr: <TData, TError, TNewError>(
    result: Result<TData, TError>,
    fn: (error: TError) => TNewError,
  ): Result<TData, TNewError> => {
    if (!result.success) {
      return Result.err(fn(result.error));
    }
    return result;
  },

  /**
   * Unwrap a result or throw if it's an error
   */
  unwrap: <TData, TError>(result: Result<TData, TError>): TData => {
    if (result.success) {
      return result.data;
    }
    throw result.error;
  },

  /**
   * Unwrap a result or return a default value
   */
  unwrapOr: <TData, TError>(result: Result<TData, TError>, defaultValue: TData): TData => {
    if (result.success) {
      return result.data;
    }
    return defaultValue;
  },

  /**
   * Convert a Promise to a Result
   */
  fromPromise: async <TData, TError = Error>(
    promise: Promise<TData>,
  ): Promise<Result<TData, TError>> => {
    try {
      const data = await promise;
      return Result.ok(data);
    } catch (error) {
      return Result.err(error as TError);
    }
  },

  /**
   * Collect an array of Results into a single Result
   */
  all: <TData, TError>(results: Array<Result<TData, TError>>): Result<TData[], TError> => {
    const data: TData[] = [];
    for (const result of results) {
      if (!result.success) {
        return result;
      }
      data.push(result.data);
    }
    return Result.ok(data);
  },
};

/**
 * Helper functions for Option types
 */
export const Option = {
  /**
   * Create a Some variant
   */
  some: <T>(value: T): Option<T> => ({
    some: true,
    value,
  }),

  /**
   * Create a None variant
   */
  none: <T>(): Option<T> => ({
    some: false,
  }),

  /**
   * Check if an Option has a value
   */
  isSome: <T>(option: Option<T>): option is { some: true; value: T } => {
    return option.some === true;
  },

  /**
   * Check if an Option is None
   */
  isNone: <T>(option: Option<T>): option is { some: false } => {
    return option.some === false;
  },

  /**
   * Convert a nullable value to an Option
   */
  fromNullable: <T>(value: T | null | undefined): Option<T> => {
    if (value === null || value === undefined) {
      return Option.none();
    }
    return Option.some(value);
  },

  /**
   * Unwrap an Option or return a default value
   */
  unwrapOr: <T>(option: Option<T>, defaultValue: T): T => {
    if (option.some) {
      return option.value;
    }
    return defaultValue;
  },
};
