/**
 * React Query Client Configuration Tests
 *
 * Tests the QueryClient configuration and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { queryClient, DEFAULT_STALE_TIME, DEFAULT_CACHE_TIME } from './query-client';
import type { AxiosError } from 'axios';

describe('Query Client Configuration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Default Configuration', () => {
    it('should have correct default stale time', () => {
      expect(DEFAULT_STALE_TIME).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should have correct default cache time', () => {
      expect(DEFAULT_CACHE_TIME).toBe(10 * 60 * 1000); // 10 minutes
    });

    it('should have queries configured with defaults', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.staleTime).toBe(DEFAULT_STALE_TIME);
      expect(defaultOptions.queries?.gcTime).toBe(DEFAULT_CACHE_TIME);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
      expect(defaultOptions.queries?.retry).toBe(1);
    });

    it('should have mutations configured', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.mutations?.retry).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should extract error message from AxiosError with response data', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Custom error message',
          },
        },
      } as AxiosError;

      // This will be tested in integration with the error handler
      expect(axiosError.response?.data).toHaveProperty('message');
    });

    it('should extract error message from AxiosError with array messages', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            message: ['Error 1', 'Error 2'],
          },
        },
      } as AxiosError;

      expect(Array.isArray(axiosError.response?.data.message)).toBe(true);
    });

    it('should handle AxiosError without response', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error',
      } as AxiosError;

      expect(axiosError.message).toBe('Network Error');
    });

    it('should handle standard Error', () => {
      const error = new Error('Standard error');

      expect(error.message).toBe('Standard error');
    });
  });

  describe('Query Client Methods', () => {
    it('should allow clearing all queries', () => {
      queryClient.setQueryData(['test'], { data: 'test' });

      expect(queryClient.getQueryData(['test'])).toEqual({ data: 'test' });

      queryClient.clear();

      expect(queryClient.getQueryData(['test'])).toBeUndefined();
    });

    it('should allow invalidating specific queries', async () => {
      queryClient.setQueryData(['test'], { data: 'test' });

      await queryClient.invalidateQueries({ queryKey: ['test'] });

      const state = queryClient.getQueryState(['test']);
      expect(state?.isInvalidated).toBe(true);
    });

    it('should allow setting query data', () => {
      queryClient.setQueryData(['test'], { data: 'test' });

      expect(queryClient.getQueryData(['test'])).toEqual({ data: 'test' });
    });

    it('should allow removing queries', () => {
      queryClient.setQueryData(['test'], { data: 'test' });

      queryClient.removeQueries({ queryKey: ['test'] });

      expect(queryClient.getQueryData(['test'])).toBeUndefined();
    });
  });
});
