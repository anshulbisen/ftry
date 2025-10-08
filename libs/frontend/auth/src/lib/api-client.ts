import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from './auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Track ongoing refresh promise to prevent race conditions
let refreshPromise: Promise<AxiosResponse<{ data: { expiresIn: number } }>> | null = null;

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
 * Request interceptor - no longer needed for token attachment
 * Tokens are sent automatically via HTTP-only cookies
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Cookies are sent automatically with withCredentials: true
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
        useAuthStore.getState().logout();

        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
