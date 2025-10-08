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
          const refreshToken = useAuthStore.getState().refreshToken;
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          // Start new refresh request
          refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, {
              refreshToken,
            })
            .finally(() => {
              // Clear the promise after completion
              refreshPromise = null;
            });
        }

        // Wait for the refresh to complete
        const response = await refreshPromise;
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens in store
        useAuthStore.getState().updateTokens(accessToken, newRefreshToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
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
