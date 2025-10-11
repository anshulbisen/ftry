/**
 * usePermissions Hook Tests
 *
 * Tests the custom hook for checking user permissions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { useAuthStore } from '@/store/auth.store';
import type { SafeUser } from '@ftry/shared/types';

// Mock the auth store
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn((p) => mockUser.role.permissions.includes(p)),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasPermission('users:read:all')).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn((p) => mockUser.role.permissions.includes(p)),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasPermission('tenants:delete')).toBe(false);
    });

    it('should return false when user is undefined', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: undefined,
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasPermission('users:read:all')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn((perms) =>
          perms.some((p: string) => mockUser.role.permissions.includes(p)),
        ),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(
        result.current.hasAnyPermission(['tenants:delete', 'users:read:all', 'users:create:all']),
      ).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasAnyPermission(['tenants:delete', 'users:delete:all'])).toBe(false);
    });

    it('should return false for empty array', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasAnyPermission([])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn((perms) =>
          perms.every((p: string) => mockUser.role.permissions.includes(p)),
        ),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(
        result.current.hasAllPermissions(['users:read:all', 'users:create:own', 'roles:read:own']),
      ).toBe(true);
    });

    it('should return false when user is missing at least one permission', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(() => false),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasAllPermissions(['users:read:all', 'tenants:delete'])).toBe(false);
    });

    it('should return true for empty array', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(() => true),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasAllPermissions([])).toBe(true);
    });
  });

  describe('canAccessResource', () => {
    it('should return true when user has :all permission', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn((perms) =>
          perms.some((p: string) => mockUser.role.permissions.includes(p)),
        ),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessResource('users', 'read')).toBe(true);
    });

    it('should return true when user has :own permission', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn((perms) =>
          perms.some((p: string) => mockUser.role.permissions.includes(p)),
        ),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessResource('users', 'create')).toBe(true);
    });

    it('should return false when user has neither :all nor :own permission', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessResource('tenants', 'delete')).toBe(false);
    });
  });

  describe('permissions array', () => {
    it('should return user permissions array', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: mockUser,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.permissions).toEqual([
        'users:read:all',
        'users:create:own',
        'roles:read:own',
      ]);
    });

    it('should return empty array when user is undefined', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: undefined,
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
        isSuperAdmin: false,
      } as any);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.permissions).toEqual([]);
    });
  });
});
