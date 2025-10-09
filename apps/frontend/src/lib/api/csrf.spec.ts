/**
 * CSRF Token Management Tests
 *
 * Tests the CSRF token fetching, caching, and clearing functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getCsrfToken, clearCsrfToken, prefetchCsrfToken } from './csrf';

describe('CSRF Token Management', () => {
  const mockCsrfToken = 'mock-csrf-token-12345';
  const API_URL = 'http://localhost:3001/api/v1';

  beforeEach(() => {
    // Clear any cached tokens before each test
    clearCsrfToken();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCsrfToken', () => {
    it('should fetch CSRF token from backend', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'x-csrf-token' ? mockCsrfToken : null),
        },
      });

      global.fetch = mockFetch;

      const token = await getCsrfToken();

      expect(token).toBe(mockCsrfToken);
      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should cache CSRF token and not refetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'x-csrf-token' ? mockCsrfToken : null),
        },
      });

      global.fetch = mockFetch;

      const token1 = await getCsrfToken();
      const token2 = await getCsrfToken();
      const token3 = await getCsrfToken();

      expect(token1).toBe(mockCsrfToken);
      expect(token2).toBe(mockCsrfToken);
      expect(token3).toBe(mockCsrfToken);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should throw error when fetch fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      global.fetch = mockFetch;

      await expect(getCsrfToken()).rejects.toThrow(
        'Failed to fetch CSRF token: 500 Internal Server Error',
      );
    });

    it('should throw error when token not in response headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: () => null,
        },
      });

      global.fetch = mockFetch;

      await expect(getCsrfToken()).rejects.toThrow('CSRF token not found in response headers');
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      global.fetch = mockFetch;

      await expect(getCsrfToken()).rejects.toThrow('Network error');
    });
  });

  describe('clearCsrfToken', () => {
    it('should clear cached token', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'x-csrf-token' ? mockCsrfToken : null),
        },
      });

      global.fetch = mockFetch;

      // Fetch and cache token
      await getCsrfToken();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear token
      clearCsrfToken();

      // Fetch again should make new request
      await getCsrfToken();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('prefetchCsrfToken', () => {
    it('should fetch token without returning it', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'x-csrf-token' ? mockCsrfToken : null),
        },
      });

      global.fetch = mockFetch;

      const result = await prefetchCsrfToken();

      expect(result).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not throw error on failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      global.fetch = mockFetch;

      // Should not throw
      await expect(prefetchCsrfToken()).resolves.toBeUndefined();
    });

    it('should cache token for subsequent calls', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'x-csrf-token' ? mockCsrfToken : null),
        },
      });

      global.fetch = mockFetch;

      // Prefetch
      await prefetchCsrfToken();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Get token should use cache
      const token = await getCsrfToken();
      expect(token).toBe(mockCsrfToken);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
