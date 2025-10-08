/**
 * Authentication Mutation Hooks Tests
 *
 * Tests custom hooks for login, logout mutations using react-query
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLoginMutation, useLogoutMutation } from './useAuthMutation';
import * as apiClient from '../axios-client';
import type { SafeUser } from '@ftry/shared/types';

// Mock the axios client
vi.mock('../axios-client');

describe('useAuthMutation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useLoginMutation', () => {
    it('should successfully login and return user data', async () => {
      const mockUser: SafeUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: {
          id: '1',
          name: 'USER',
          description: '',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: {
          data: {
            user: mockUser,
            expiresIn: 3600,
          },
        },
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLoginMutation(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'password123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockUser);
      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(apiClient.apiClient.post).mockRejectedValue(mockError);

      const { result } = renderHook(() => useLoginMutation(), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(mockError);
    });

    it('should call onSuccess callback when provided', async () => {
      const mockUser: SafeUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: {
          id: '1',
          name: 'USER',
          description: '',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: {
          data: {
            user: mockUser,
            expiresIn: 3600,
          },
        },
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();

      const { result } = renderHook(() => useLoginMutation({ onSuccess }), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'password123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccess).toHaveBeenCalled();
      expect(onSuccess.mock.calls[0]?.[0]).toEqual(mockUser);
    });

    it('should call onError callback when provided', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(apiClient.apiClient.post).mockRejectedValue(mockError);

      const onError = vi.fn();

      const { result } = renderHook(() => useLoginMutation({ onError }), { wrapper });

      result.current.mutate({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0]?.[0]).toBe(mockError);
    });
  });

  describe('useLogoutMutation', () => {
    it('should successfully logout', async () => {
      const mockResponse = {
        data: {
          data: { success: true },
        },
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogoutMutation(), { wrapper });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should handle logout errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(apiClient.apiClient.post).mockRejectedValue(mockError);

      const { result } = renderHook(() => useLogoutMutation(), { wrapper });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(mockError);
    });

    it('should call onSuccess callback when provided', async () => {
      const mockResponse = {
        data: {
          data: { success: true },
        },
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue(mockResponse);

      const onSuccess = vi.fn();

      const { result } = renderHook(() => useLogoutMutation({ onSuccess }), { wrapper });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
