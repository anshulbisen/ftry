/**
 * QueryProvider Component
 *
 * Wrapper component that provides React Query context to the application
 */

import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { queryClient as defaultQueryClient } from './query-client';

interface QueryProviderProps {
  children: React.ReactNode;
  client?: QueryClient;
}

/**
 * QueryProvider component that wraps the app with QueryClientProvider
 *
 * @param props.children - Child components to render
 * @param props.client - Optional custom QueryClient instance (uses default if not provided)
 *
 * @example
 * ```tsx
 * import { QueryProvider } from '@/lib/api';
 *
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <YourApp />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export function QueryProvider({ children, client = defaultQueryClient }: QueryProviderProps) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
