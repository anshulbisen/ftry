/**
 * Frontend API Client Library
 *
 * Provides unified API client with react-query integration and CSRF protection
 */

// Axios client (for direct HTTP calls when react-query isn't suitable)
export { apiClient, clearCsrfToken } from './axios-client';

// CSRF utilities
export { getCsrfToken, prefetchCsrfToken } from './csrf';

// React Query client and provider
export {
  queryClient,
  handleQueryError,
  DEFAULT_STALE_TIME,
  DEFAULT_CACHE_TIME,
} from './query-client';
export { QueryProvider } from './QueryProvider';

// Re-export react-query hooks for convenience
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

// Re-export types from react-query
export type {
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  UseSuspenseQueryOptions,
  QueryKey,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';

// Custom hooks
export {
  useLoginMutation,
  useLogoutMutation,
  type LoginCredentials,
} from './hooks/useAuthMutation';
export { useCurrentUser, CURRENT_USER_QUERY_KEY } from './hooks/useCurrentUser';
