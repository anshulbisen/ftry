/**
 * Axios API Client Tests
 *
 * Tests the axios-based API client with CSRF protection and authentication
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { apiClient, clearCsrfToken as clearAxiosCsrfToken } from './axios-client';
import * as csrfModule from './csrf';

// Mock the CSRF module
vi.mock('./csrf');

describe('Axios API Client', () => {
  let mockAxios: MockAdapter;
  const API_URL = 'http://localhost:3001/api/v1';
  const mockCsrfToken = 'mock-csrf-token-12345';

  beforeEach(() => {
    mockAxios = new MockAdapter(apiClient);

    // Mock CSRF token fetching
    vi.mocked(csrfModule.getCsrfToken).mockResolvedValue(mockCsrfToken);
    vi.mocked(csrfModule.clearCsrfToken).mockImplementation(() => {
      // Intentionally empty - mock implementation
    });

    clearAxiosCsrfToken();
  });

  afterEach(() => {
    mockAxios.reset();
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct base URL', () => {
      expect(apiClient.defaults.baseURL).toBe(API_URL);
    });

    it('should have withCredentials set to true', () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    it('should have correct default headers', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request Interceptor - CSRF Protection', () => {
    it('should attach CSRF token to POST requests', async () => {
      mockAxios.onPost('/test').reply((config) => {
        expect(config.headers?.['x-csrf-token']).toBe(mockCsrfToken);
        return [200, { success: true }];
      });

      await apiClient.post('/test', { data: 'test' });

      expect(csrfModule.getCsrfToken).toHaveBeenCalled();
    });

    it('should attach CSRF token to PUT requests', async () => {
      mockAxios.onPut('/test').reply((config) => {
        expect(config.headers?.['x-csrf-token']).toBe(mockCsrfToken);
        return [200, { success: true }];
      });

      await apiClient.put('/test', { data: 'test' });

      expect(csrfModule.getCsrfToken).toHaveBeenCalled();
    });

    it('should attach CSRF token to PATCH requests', async () => {
      mockAxios.onPatch('/test').reply((config) => {
        expect(config.headers?.['x-csrf-token']).toBe(mockCsrfToken);
        return [200, { success: true }];
      });

      await apiClient.patch('/test', { data: 'test' });

      expect(csrfModule.getCsrfToken).toHaveBeenCalled();
    });

    it('should attach CSRF token to DELETE requests', async () => {
      mockAxios.onDelete('/test').reply((config) => {
        expect(config.headers?.['x-csrf-token']).toBe(mockCsrfToken);
        return [200, { success: true }];
      });

      await apiClient.delete('/test');

      expect(csrfModule.getCsrfToken).toHaveBeenCalled();
    });

    it('should NOT attach CSRF token to GET requests', async () => {
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.['x-csrf-token']).toBeUndefined();
        return [200, { success: true }];
      });

      await apiClient.get('/test');

      expect(csrfModule.getCsrfToken).not.toHaveBeenCalled();
    });

    it('should cache CSRF token for multiple requests', async () => {
      mockAxios.onPost('/test1').reply(200, { success: true });
      mockAxios.onPost('/test2').reply(200, { success: true });
      mockAxios.onPost('/test3').reply(200, { success: true });

      await apiClient.post('/test1', { data: 'test' });
      await apiClient.post('/test2', { data: 'test' });
      await apiClient.post('/test3', { data: 'test' });

      // Should fetch CSRF token once (first call), then use cached value
      expect(csrfModule.getCsrfToken).toHaveBeenCalledTimes(1);
    });

    it('should handle CSRF token fetch failure gracefully', async () => {
      vi.mocked(csrfModule.getCsrfToken).mockRejectedValueOnce(new Error('CSRF fetch failed'));

      mockAxios.onPost('/test').reply((config) => {
        // Request should proceed without CSRF token
        expect(config.headers?.['x-csrf-token']).toBeUndefined();
        return [200, { success: true }];
      });

      // Should not throw error
      await expect(apiClient.post('/test', { data: 'test' })).resolves.toBeDefined();
    });
  });

  describe('Response Interceptor - Token Refresh', () => {
    it('should retry request after 401 error with token refresh', async () => {
      // Create separate axios instance for refresh endpoint
      const refreshAxios = new MockAdapter(axios);
      refreshAxios.onPost(`${API_URL}/auth/refresh`).reply(200, { success: true });

      mockAxios
        .onGet('/protected')
        .replyOnce(401)
        .onGet('/protected')
        .replyOnce(200, { data: 'success' });

      const response = await apiClient.get('/protected');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'success' });

      refreshAxios.restore();
    });

    it('should not retry request more than once', async () => {
      mockAxios.onGet('/protected').reply(401);

      await expect(apiClient.get('/protected')).rejects.toThrow();
    });

    it('should clear CSRF token on 403 error', async () => {
      mockAxios.onPost('/test').reply(403, { error: 'Forbidden' });

      await expect(apiClient.post('/test', { data: 'test' })).rejects.toThrow();

      expect(csrfModule.clearCsrfToken).toHaveBeenCalled();
    });

    it('should handle concurrent 401 errors with single refresh', async () => {
      // Create separate axios instance for refresh endpoint
      const refreshAxios = new MockAdapter(axios);
      refreshAxios.onPost(`${API_URL}/auth/refresh`).reply(200, { success: true });

      mockAxios
        .onGet('/protected1')
        .replyOnce(401)
        .onGet('/protected2')
        .replyOnce(401)
        .onGet('/protected3')
        .replyOnce(401)
        .onGet('/protected1')
        .replyOnce(200, { data: '1' })
        .onGet('/protected2')
        .replyOnce(200, { data: '2' })
        .onGet('/protected3')
        .replyOnce(200, { data: '3' });

      const [res1, res2, res3] = await Promise.all([
        apiClient.get('/protected1'),
        apiClient.get('/protected2'),
        apiClient.get('/protected3'),
      ]);

      expect(res1.data).toEqual({ data: '1' });
      expect(res2.data).toEqual({ data: '2' });
      expect(res3.data).toEqual({ data: '3' });

      refreshAxios.restore();
    });

    it('should not logout on network errors during refresh', async () => {
      mockAxios.onGet('/protected').replyOnce(401).onPost('/auth/refresh').networkErrorOnce();

      await expect(apiClient.get('/protected')).rejects.toThrow();
    });
  });

  describe('Request/Response Flow', () => {
    it('should successfully complete a POST request with CSRF', async () => {
      const testData = { name: 'Test User' };
      mockAxios.onPost('/users').reply(201, { data: testData });

      const response = await apiClient.post('/users', testData);

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ data: testData });
    });

    it('should successfully complete a GET request', async () => {
      const testData = { users: [] };
      mockAxios.onGet('/users').reply(200, { data: testData });

      const response = await apiClient.get('/users');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: testData });
    });

    it('should handle error responses correctly', async () => {
      mockAxios.onGet('/error').reply(500, { error: 'Server Error' });

      await expect(apiClient.get('/error')).rejects.toThrow();
    });
  });
});
