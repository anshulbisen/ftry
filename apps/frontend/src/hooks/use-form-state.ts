import { useState, useCallback } from 'react';
import { getErrorMessage } from '@ftry/shared/utils';

interface UseFormStateOptions {
  defaultError?: string;
}

/**
 * Custom hook for managing form state with loading and error handling
 * Eliminates duplicate state management code across forms
 */
export function useFormState(options: UseFormStateOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
        errorMessage?: string;
      },
    ): Promise<T | null> => {
      setError(null);
      setLoading(true);

      try {
        const result = await asyncFn();
        options?.onSuccess?.(result);
        return result;
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err, options?.errorMessage || 'An error occurred');
        setError(errorMsg);
        options?.onError?.(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);
  const setErrorMessage = useCallback((msg: string) => setError(msg), []);

  return {
    loading,
    error,
    execute,
    clearError,
    setError: setErrorMessage,
  };
}
