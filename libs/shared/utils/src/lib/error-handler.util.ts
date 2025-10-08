import { isAxiosError, type AxiosErrorResponse } from '@ftry/shared/types';
import { ERROR_MESSAGES } from '@ftry/shared/constants';

/**
 * Extract error message from unknown error type
 * Provides consistent error handling across the application
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const defaultMessage = fallback || 'An unexpected error occurred';

  if (isAxiosError(error)) {
    const axiosError = error as unknown as AxiosErrorResponse;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      defaultMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  // Handle plain objects with message or error property
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string') {
      return msg;
    }
  }

  if (error && typeof error === 'object' && 'error' in error) {
    const err = (error as { error?: unknown }).error;
    if (typeof err === 'string') {
      return err;
    }
  }

  return defaultMessage;
}

/**
 * Extract auth-specific error message
 */
export function getAuthErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      return message || ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
    }
    if (status === 403) {
      return message || ERROR_MESSAGES.AUTH.UNAUTHORIZED;
    }
    if (status === 429) {
      return message || 'Too many attempts. Please try again later.';
    }

    return message || ERROR_MESSAGES.AUTH.LOGIN_FAILED;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.AUTH.UNEXPECTED_ERROR;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    const axiosError = error as unknown as AxiosErrorResponse;
    return (
      !axiosError.response ||
      axiosError.code === 'ECONNABORTED' ||
      axiosError.code === 'ERR_NETWORK'
    );
  }
  return false;
}

/**
 * Check if error is due to authentication failure
 */
export function isAuthError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is due to authorization failure (forbidden)
 */
export function isForbiddenError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 403;
  }
  return false;
}

/**
 * Log error with context for debugging
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '';

  if (isAxiosError(error)) {
    const axiosError = error as unknown as AxiosErrorResponse;
    console.error(`${prefix} API Error:`, {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      url: axiosError.config?.url,
    });
  } else if (error instanceof Error) {
    console.error(`${prefix} Error:`, error.message, error.stack);
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
}
