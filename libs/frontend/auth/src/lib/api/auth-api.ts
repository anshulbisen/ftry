import { apiClient } from '../api-client';
import { AuthResponse, SafeUser, RegisterDto } from '@ftry/shared/types';

/**
 * Authentication API endpoints
 * Handles login, register, logout, and token management
 */
export const authApi = {
  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
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
   */
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<SafeUser> => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (
    refreshToken: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};
