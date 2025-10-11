import { apiClient } from '../api/axios-client';
import type { SafeUser, RegisterDto } from '@ftry/shared/types';

/**
 * Authentication API endpoints
 * Handles login, register, logout, and token management
 * Tokens are managed via HTTP-only cookies
 */
export const authApi = {
  /**
   * Login with email and password
   * Returns user data; tokens are set as HTTP-only cookies by backend
   */
  login: async (
    email: string,
    password: string,
  ): Promise<{ user: SafeUser; expiresIn: number }> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.data;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterDto): Promise<SafeUser> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  /**
   * Logout and revoke refresh token
   * Refresh token is sent automatically via HTTP-only cookie
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<SafeUser> => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  /**
   * Refresh access token
   * Tokens are sent and received via HTTP-only cookies
   * This endpoint is called automatically by axios interceptor
   */
  refreshToken: async (): Promise<{ expiresIn: number }> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data.data;
  },
};
