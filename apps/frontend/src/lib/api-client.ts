/**
 * API Client with CSRF Protection
 *
 * Provides a fetch wrapper that automatically includes CSRF tokens
 * for state-changing requests (POST, PUT, PATCH, DELETE).
 */

import { getCsrfToken, clearCsrfToken } from './csrf';

/**
 * HTTP methods that require CSRF protection
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * API client configuration options
 */
export interface ApiClientOptions extends RequestInit {
  skipCsrf?: boolean; // Skip CSRF token for this request
}

/**
 * Enhanced fetch wrapper with automatic CSRF token injection
 *
 * @param url - Request URL
 * @param options - Fetch options with optional skipCsrf flag
 * @returns Promise resolving to the Response object
 *
 * @example
 * // GET request (no CSRF token needed)
 * const response = await apiClient('/api/users');
 *
 * // POST request (CSRF token automatically included)
 * const response = await apiClient('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' }),
 * });
 */
export async function apiClient(url: string, options: ApiClientOptions = {}): Promise<Response> {
  const { skipCsrf, ...fetchOptions } = options;

  // Determine if this request needs CSRF protection
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const needsCsrf = CSRF_PROTECTED_METHODS.includes(method) && !skipCsrf;

  // Get CSRF token if needed
  if (needsCsrf) {
    try {
      const csrfToken = await getCsrfToken();

      // Add CSRF token to headers
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'x-csrf-token': csrfToken,
      };
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Proceed with request anyway - server will reject if CSRF is required
    }
  }

  // Ensure credentials are included (required for CSRF cookies)
  fetchOptions.credentials = fetchOptions.credentials || 'include';

  // Set default Content-Type for JSON requests
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
  }

  // Make the request
  try {
    const response = await fetch(url, fetchOptions);

    // Clear CSRF token on 403 (likely invalid token)
    if (response.status === 403 && needsCsrf) {
      clearCsrfToken();
      console.warn('CSRF token may be invalid. Token cleared. Retry request to get new token.');
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Convenience methods for common HTTP verbs
 */

export const api = {
  /**
   * GET request
   */
  get: async (url: string, options?: ApiClientOptions) => {
    return apiClient(url, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post: async (url: string, data?: unknown, options?: ApiClientOptions) => {
    return apiClient(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  put: async (url: string, data?: unknown, options?: ApiClientOptions) => {
    return apiClient(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  patch: async (url: string, data?: unknown, options?: ApiClientOptions) => {
    return apiClient(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  delete: async (url: string, options?: ApiClientOptions) => {
    return apiClient(url, { ...options, method: 'DELETE' });
  },
};
