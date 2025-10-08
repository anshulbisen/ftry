/**
 * API Response Utilities
 * Provides consistent response formatting across the backend
 */

import { ApiResponse } from '@ftry/shared/types';

/**
 * Create a standardized API response
 */
export function createResponse<T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string,
): ApiResponse<T> {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a success response
 */
export function successResponse<T>(message: string, data?: T): ApiResponse<T> {
  return createResponse(true, message, data);
}

/**
 * Create an error response
 */
export function errorResponse(message: string, error?: string): ApiResponse<undefined> {
  return createResponse<undefined>(false, message, undefined, error);
}
