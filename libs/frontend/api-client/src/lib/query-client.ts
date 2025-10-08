/**
 * React Query Client Configuration
 *
 * Provides a pre-configured QueryClient for TanStack Query with:
 * - Sensible defaults for caching and stale time
 * - Global error handling
 * - Retry logic
 */

import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Default stale time for queries (5 minutes)
 * Data is considered fresh for 5 minutes before refetching
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default cache time (garbage collection time) for queries (10 minutes)
 * Inactive queries are garbage collected after 10 minutes
 */
export const DEFAULT_CACHE_TIME = 10 * 60 * 1000;

/**
 * Extract error message from various error formats
 */
function getErrorMessage(error: unknown): string {
  // Handle AxiosError
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{
      message?: string | string[];
      error?: string;
    }>;

    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      // Handle array of messages
      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }

      // Handle single message
      if (data.message) {
        return data.message;
      }

      // Handle error field
      if (data.error) {
        return data.error;
      }
    }

    // Fallback to axios error message
    return axiosError.message;
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string error
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Pre-configured QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: DEFAULT_STALE_TIME,

      // Inactive queries are garbage collected after 10 minutes
      gcTime: DEFAULT_CACHE_TIME,

      // Don't refetch on window focus (can be overridden per query)
      refetchOnWindowFocus: false,

      // Retry failed requests once
      retry: 1,

      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Global error handler for queries
      throwOnError: false,
    },

    mutations: {
      // Don't retry mutations by default
      retry: false,

      // Global error handler for mutations
      throwOnError: false,

      // Global error handler
      onError: (error) => {
        const message = getErrorMessage(error);
        console.error('Mutation error:', message);

        // In production, you might want to show a toast notification here
        // For now, we just log the error
      },
    },
  },
});

/**
 * Helper function to handle query errors
 * Can be used in error boundaries or custom error handlers
 */
export function handleQueryError(error: unknown): string {
  return getErrorMessage(error);
}
