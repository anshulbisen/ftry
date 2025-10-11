/**
 * Authentication Mutation Hooks
 *
 * Custom react-query hooks for authentication mutations (login, logout)
 * These hooks handle API calls and provide loading/error states
 */

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '../axios-client';
import type { SafeUser } from '@ftry/shared/types';

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login response from backend
 */
interface LoginResponse {
  user: SafeUser;
  expiresIn: number;
}

/**
 * Login mutation hook
 *
 * Handles user login with email/password and returns user data.
 * Tokens are managed via HTTP-only cookies.
 *
 * @param options - Optional mutation options (onSuccess, onError, etc.)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const { mutate: login, isPending, isError, error } = useLoginMutation({
 *   onSuccess: (user) => {
 *     console.log('Logged in as:', user.email);
 *     navigate('/dashboard');
 *   },
 *   onError: (error) => {
 *     console.error('Login failed:', error);
 *   },
 * });
 *
 * // Usage
 * login({ email: 'user@example.com', password: 'password123' });
 * ```
 */
export function useLoginMutation(
  options?: Omit<UseMutationOptions<SafeUser, Error, LoginCredentials>, 'mutationFn'>,
) {
  return useMutation<SafeUser, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<{ data: LoginResponse }>('/auth/login', credentials);
      return response.data.data.user;
    },
    ...options,
  });
}

/**
 * Logout mutation hook
 *
 * Handles user logout and revokes refresh token on backend.
 * Tokens are managed via HTTP-only cookies.
 *
 * @param options - Optional mutation options (onSuccess, onError, etc.)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const { mutate: logout, isPending } = useLogoutMutation({
 *   onSuccess: () => {
 *     console.log('Logged out successfully');
 *     navigate('/login');
 *   },
 * });
 *
 * // Usage
 * logout();
 * ```
 */
export function useLogoutMutation(options?: Omit<UseMutationOptions<void>, 'mutationFn'>) {
  return useMutation<void>({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    ...options,
  });
}
