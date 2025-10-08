/**
 * useCurrentUser Hook Tests
 *
 * Tests the custom hook for fetching current authenticated user
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import * as apiClient from '../axios-client';
import type { SafeUser } from '@ftry/shared/types';

// Mock the axios client
vi.mock('../axios-client');

describe('useCurrentUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch current user successfully', async () => {
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
        data: mockUser,
      },
    };

    vi.mocked(apiClient.apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUser);
    expect(apiClient.apiClient.get).toHaveBeenCalledWith('/auth/me');
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Unauthorized');
    vi.mocked(apiClient.apiClient.get).mockRejectedValue(mockError);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(mockError);
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useCurrentUser({ enabled: false }), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(apiClient.apiClient.get).not.toHaveBeenCalled();
  });

  it('should refetch when manually invalidated', async () => {
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
        data: mockUser,
      },
    };

    vi.mocked(apiClient.apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.apiClient.get).toHaveBeenCalledTimes(1);

    // Manually refetch
    result.current.refetch();

    await waitFor(() => expect(apiClient.apiClient.get).toHaveBeenCalledTimes(2));
  });

  it('should cache user data in query client', async () => {
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
        data: mockUser,
      },
    };

    vi.mocked(apiClient.apiClient.get).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should fetch once
    expect(apiClient.apiClient.get).toHaveBeenCalledTimes(1);

    // Data should be cached
    const cachedData = queryClient.getQueryData(['auth', 'currentUser']);
    expect(cachedData).toEqual(mockUser);
  });
});
