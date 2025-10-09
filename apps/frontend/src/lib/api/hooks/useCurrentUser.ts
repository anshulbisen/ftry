/**
 * useCurrentUser Hook
 *
 * Custom react-query hook for fetching the current authenticated user
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../axios-client';
import type { SafeUser } from '@ftry/shared/types';

/**
 * Query key for current user
 * Used for caching and invalidation
 */
export const CURRENT_USER_QUERY_KEY = ['auth', 'currentUser'];

/**
 * Current user query hook
 *
 * Fetches the current authenticated user from the backend.
 * Data is cached and automatically refetched when stale.
 *
 * @param options - Optional query options (enabled, onSuccess, onError, etc.)
 * @returns Query object with user data and state
 *
 * @example
 * ```tsx
 * const { data: user, isLoading, isError, error } = useCurrentUser();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (isError) return <div>Error: {error.message}</div>;
 *
 * return <div>Hello, {user.firstName}!</div>;
 * ```
 *
 * @example
 * ```tsx
 * // Conditionally fetch user
 * const { data: user } = useCurrentUser({
 *   enabled: isAuthenticated,
 * });
 * ```
 */
export function useCurrentUser(
  options?: Omit<UseQueryOptions<SafeUser, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<SafeUser, Error>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<{ data: SafeUser }>('/auth/me');
      return response.data.data;
    },
    ...options,
  });
}
