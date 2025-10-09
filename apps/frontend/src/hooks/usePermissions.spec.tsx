/**
 * usePermissions Hook Tests
 *
 * Tests the custom hook for checking user permissions
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePermissions } from './usePermissions';
import * as apiClient from '@/lib/api';
import type { SafeUser } from '@ftry/shared/types';

// Mock the api-client
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api');
  return {
    ...actual,
    useCurrentUser: vi.fn(),
  };
});

describe('usePermissions', () => {
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

  const mockUser: SafeUser = {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: {
      id: 'role-1',
      name: 'Admin',
      description: 'Admin role',
      permissions: ['users:read:all', 'users:create:own', 'roles:read:own'],
      tenantId: 'tenant-1',
      type: 'tenant',
      level: 80,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tenant: {
      id: 'tenant-1',
      name: 'Test Tenant',
      slug: 'test-tenant',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tenantId: 'tenant-1',
    roleId: 'role-1',
    status: 'active',
    isDeleted: false,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('hasPermission', () => {
    it('should return true when user has the permission', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasPermission('users:read:all')).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasPermission('tenants:delete')).toBe(false);
    });

    it('should return false when user is undefined', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasPermission('users:read:all')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(
        result.current.hasAnyPermission(['tenants:delete', 'users:read:all', 'users:create:all']),
      ).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAnyPermission(['tenants:delete', 'users:delete:all'])).toBe(false);
    });

    it('should return false for empty array', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAnyPermission([])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(
        result.current.hasAllPermissions(['users:read:all', 'users:create:own', 'roles:read:own']),
      ).toBe(true);
    });

    it('should return false when user is missing at least one permission', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAllPermissions(['users:read:all', 'tenants:delete'])).toBe(false);
    });

    it('should return true for empty array', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAllPermissions([])).toBe(true);
    });
  });

  describe('canAccessResource', () => {
    it('should return true when user has :all permission', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.canAccessResource('users', 'read')).toBe(true);
    });

    it('should return true when user has :own permission', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.canAccessResource('users', 'create')).toBe(true);
    });

    it('should return false when user has neither :all nor :own permission', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.canAccessResource('tenants', 'delete')).toBe(false);
    });
  });

  describe('permissions array', () => {
    it('should return user permissions array', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.permissions).toEqual([
        'users:read:all',
        'users:create:own',
        'roles:read:own',
      ]);
    });

    it('should return empty array when user is undefined', () => {
      vi.mocked(apiClient.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as any);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.permissions).toEqual([]);
    });
  });
});
