/**
 * Axios API Client with CSRF Protection and Authentication
 *
 * Provides a configured axios instance with:
 * - Automatic CSRF token injection for state-changing requests
 * - Automatic token refresh on 401 errors
 * - HTTP-only cookie-based authentication
 * - Request/response interceptors
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getCsrfToken, clearCsrfToken as clearCsrf } from './csrf';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Track ongoing refresh promise to prevent race conditions
let refreshPromise: Promise<AxiosResponse<{ data: { expiresIn: number } }>> | null = null;

// Track CSRF token
let csrfToken: string | null = null;

// HTTP methods that require CSRF protection
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Export function to clear CSRF token cache
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  clearCsrf();
}

/**
 * Configured axios instance with auth interceptors
 * Handles automatic token refresh via HTTP-only cookies
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Send cookies with every request
});

/**
 * Request interceptor - attaches CSRF token to state-changing requests
 * Tokens (access/refresh) are sent automatically via HTTP-only cookies
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check if this request needs CSRF protection
    const method = (config.method || 'GET').toUpperCase();
    const needsCsrf = CSRF_PROTECTED_METHODS.includes(method);

    if (needsCsrf) {
      try {
        // Get CSRF token (cached or fetch new one)
        const token = csrfToken || (await getCsrfToken());
        if (!csrfToken) {
          csrfToken = token;
        }
        config.headers['x-csrf-token'] = token;
      } catch (error) {
        console.error('Failed to attach CSRF token:', error);
        // Let request proceed - backend will reject if CSRF is required
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor for token refresh with race condition prevention
 * Tokens are managed via HTTP-only cookies
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Clear CSRF token on 403 (likely invalid token)
    if (error.response?.status === 403) {
      clearCsrfToken();
      console.warn('CSRF token cleared due to 403 error. Will fetch new token on next request.');
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it
        if (!refreshPromise) {
          // Start new refresh request
          // The refresh token is sent automatically via HTTP-only cookie
          refreshPromise = axios
            .post(
              `${API_URL}/auth/refresh`,
              {},
              {
                withCredentials: true, // Send cookies with refresh request
              },
            )
            .finally(() => {
              // Clear the promise after completion
              refreshPromise = null;
            });
        }

        // Wait for the refresh to complete
        // New tokens are set as cookies by the backend
        await refreshPromise;

        // Retry the original request
        // The new access token cookie will be sent automatically
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Handle different types of refresh errors
        if (refreshError instanceof Error) {
          // Network error or timeout - don't logout immediately
          if (
            refreshError.message.includes('Network Error') ||
            refreshError.message.includes('timeout')
          ) {
            // Don't logout on network errors, let the user retry
            return Promise.reject(refreshError);
          }
        }

        // Auth error or other issues - logout user
        // Note: This will be handled by the auth store in the consuming application
        // We just propagate the error and let the app handle logout/redirect

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
