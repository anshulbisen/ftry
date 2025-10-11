/**
 * Admin API Client Tests
 *
 * Tests the admin API client methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminApi } from './admin.api';
import * as apiClient from '@/lib/api';
import type { SafeUser, Tenant, Role, Permission } from '@ftry/shared/types';

// Mock the api-client
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api');
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tenants', () => {
    describe('getTenants', () => {
      it('should fetch all tenants', async () => {
        const mockTenants: Tenant[] = [
          {
            id: 'tenant-1',
            name: 'Tenant 1',
            slug: 'tenant-1',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockTenants,
        });

        const result = await adminApi.getTenants();

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/tenants', {
          params: undefined,
        });
        expect(result).toEqual(mockTenants);
      });
    });

    describe('getTenant', () => {
      it('should fetch a single tenant', async () => {
        const mockTenant: Tenant = {
          id: 'tenant-1',
          name: 'Tenant 1',
          slug: 'tenant-1',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockTenant,
        });

        const result = await adminApi.getTenant('tenant-1');

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/tenants/tenant-1');
        expect(result).toEqual(mockTenant);
      });
    });

    describe('createTenant', () => {
      it('should create a new tenant', async () => {
        const newTenant = { name: 'New Tenant', slug: 'new-tenant' };
        const mockTenant: Tenant = {
          id: 'tenant-2',
          ...newTenant,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.post).mockResolvedValue({
          data: mockTenant,
        });

        const result = await adminApi.createTenant(newTenant);

        expect(apiClient.apiClient.post).toHaveBeenCalledWith('/admin/tenants', newTenant);
        expect(result).toEqual(mockTenant);
      });
    });

    describe('updateTenant', () => {
      it('should update a tenant', async () => {
        const updates = { name: 'Updated Tenant' };
        const mockTenant: Tenant = {
          id: 'tenant-1',
          name: 'Updated Tenant',
          slug: 'tenant-1',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.patch).mockResolvedValue({
          data: mockTenant,
        });

        const result = await adminApi.updateTenant('tenant-1', updates);

        expect(apiClient.apiClient.patch).toHaveBeenCalledWith('/admin/tenants/tenant-1', updates);
        expect(result).toEqual(mockTenant);
      });
    });

    describe('deleteTenant', () => {
      it('should delete a tenant', async () => {
        vi.mocked(apiClient.apiClient.delete).mockResolvedValue({
          data: { success: true },
        });

        await adminApi.deleteTenant('tenant-1');

        expect(apiClient.apiClient.delete).toHaveBeenCalledWith('/admin/tenants/tenant-1');
      });
    });

    describe('suspendTenant', () => {
      it('should suspend a tenant', async () => {
        const mockTenant: Tenant = {
          id: 'tenant-1',
          name: 'Tenant 1',
          slug: 'tenant-1',
          status: 'suspended',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.post).mockResolvedValue({
          data: mockTenant,
        });

        const result = await adminApi.suspendTenant('tenant-1');

        expect(apiClient.apiClient.post).toHaveBeenCalledWith('/admin/tenants/tenant-1/suspend');
        expect(result).toEqual(mockTenant);
      });
    });

    describe('activateTenant', () => {
      it('should activate a tenant', async () => {
        const mockTenant: Tenant = {
          id: 'tenant-1',
          name: 'Tenant 1',
          slug: 'tenant-1',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.post).mockResolvedValue({
          data: mockTenant,
        });

        const result = await adminApi.activateTenant('tenant-1');

        expect(apiClient.apiClient.post).toHaveBeenCalledWith('/admin/tenants/tenant-1/activate');
        expect(result).toEqual(mockTenant);
      });
    });
  });

  describe('Users', () => {
    describe('getUsers', () => {
      it('should fetch all users', async () => {
        const mockUsers: SafeUser[] = [
          {
            id: 'user-1',
            email: 'user@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: {} as any,
            tenant: null,
            tenantId: null,
            roleId: 'role-1',
            status: 'active',
            isDeleted: false,
            lastLogin: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockUsers,
        });

        const result = await adminApi.getUsers();

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/users', {
          params: undefined,
        });
        expect(result).toEqual(mockUsers);
      });

      it('should fetch users with filters', async () => {
        const mockUsers: SafeUser[] = [];
        const filters = { tenantId: 'tenant-1', status: 'active' };

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockUsers,
        });

        await adminApi.getUsers(filters);

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/users', {
          params: filters,
        });
      });
    });

    describe('getUser', () => {
      it('should fetch a single user', async () => {
        const mockUser: SafeUser = {
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: {} as any,
          tenant: null,
          tenantId: null,
          roleId: 'role-1',
          status: 'active',
          isDeleted: false,
          lastLogin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockUser,
        });

        const result = await adminApi.getUser('user-1');

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/users/user-1');
        expect(result).toEqual(mockUser);
      });
    });

    describe('createUser', () => {
      it('should create a new user', async () => {
        const newUser = {
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          roleId: 'role-1',
        };

        const mockUser: SafeUser = {
          id: 'user-2',
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: {} as any,
          tenant: null,
          tenantId: null,
          roleId: newUser.roleId,
          status: 'active',
          isDeleted: false,
          lastLogin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.post).mockResolvedValue({
          data: mockUser,
        });

        const result = await adminApi.createUser(newUser);

        expect(apiClient.apiClient.post).toHaveBeenCalledWith('/admin/users', newUser);
        expect(result).toEqual(mockUser);
      });
    });

    describe('updateUser', () => {
      it('should update a user', async () => {
        const updates = { firstName: 'Updated' };
        const mockUser: SafeUser = {
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Updated',
          lastName: 'User',
          role: {} as any,
          tenant: null,
          tenantId: null,
          roleId: 'role-1',
          status: 'active',
          isDeleted: false,
          lastLogin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.patch).mockResolvedValue({
          data: mockUser,
        });

        const result = await adminApi.updateUser('user-1', updates);

        expect(apiClient.apiClient.patch).toHaveBeenCalledWith('/admin/users/user-1', updates);
        expect(result).toEqual(mockUser);
      });
    });

    describe('deleteUser', () => {
      it('should delete a user', async () => {
        vi.mocked(apiClient.apiClient.delete).mockResolvedValue({
          data: { success: true },
        });

        await adminApi.deleteUser('user-1');

        expect(apiClient.apiClient.delete).toHaveBeenCalledWith('/admin/users/user-1');
      });
    });
  });

  describe('Roles', () => {
    describe('getRoles', () => {
      it('should fetch all roles', async () => {
        const mockRoles: Role[] = [
          {
            id: 'role-1',
            name: 'Admin',
            description: 'Admin role',
            permissions: ['users:read:all'],
            tenantId: null,
            type: 'system',
            level: 100,
            isSystem: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockRoles,
        });

        const result = await adminApi.getRoles();

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/roles', {
          params: undefined,
        });
        expect(result).toEqual(mockRoles);
      });
    });

    describe('getRole', () => {
      it('should fetch a single role', async () => {
        const mockRole: Role = {
          id: 'role-1',
          name: 'Admin',
          description: 'Admin role',
          permissions: ['users:read:all'],
          tenantId: null,
          type: 'system',
          level: 100,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockRole,
        });

        const result = await adminApi.getRole('role-1');

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/roles/role-1');
        expect(result).toEqual(mockRole);
      });
    });

    describe('createRole', () => {
      it('should create a new role', async () => {
        const newRole = {
          name: 'Manager',
          description: 'Manager role',
          permissions: ['users:read:own'],
        };

        const mockRole: Role = {
          id: 'role-2',
          ...newRole,
          tenantId: null,
          type: 'tenant',
          level: 50,
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.post).mockResolvedValue({
          data: mockRole,
        });

        const result = await adminApi.createRole(newRole);

        expect(apiClient.apiClient.post).toHaveBeenCalledWith('/admin/roles', newRole);
        expect(result).toEqual(mockRole);
      });
    });

    describe('updateRole', () => {
      it('should update a role', async () => {
        const updates = { description: 'Updated description' };
        const mockRole: Role = {
          id: 'role-1',
          name: 'Admin',
          description: 'Updated description',
          permissions: ['users:read:all'],
          tenantId: null,
          type: 'system',
          level: 100,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.patch).mockResolvedValue({
          data: mockRole,
        });

        const result = await adminApi.updateRole('role-1', updates);

        expect(apiClient.apiClient.patch).toHaveBeenCalledWith('/admin/roles/role-1', updates);
        expect(result).toEqual(mockRole);
      });
    });

    describe('deleteRole', () => {
      it('should delete a role', async () => {
        vi.mocked(apiClient.apiClient.delete).mockResolvedValue({
          data: { success: true },
        });

        await adminApi.deleteRole('role-1');

        expect(apiClient.apiClient.delete).toHaveBeenCalledWith('/admin/roles/role-1');
      });
    });

    describe('assignPermissions', () => {
      it('should assign permissions to a role', async () => {
        const permissions = ['users:read:all', 'users:create:own'];
        const mockRole: Role = {
          id: 'role-1',
          name: 'Admin',
          description: 'Admin role',
          permissions,
          tenantId: null,
          type: 'system',
          level: 100,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(apiClient.apiClient.post).mockResolvedValue({
          data: mockRole,
        });

        const result = await adminApi.assignPermissions('role-1', permissions);

        expect(apiClient.apiClient.post).toHaveBeenCalledWith('/admin/roles/role-1/permissions', {
          permissions,
        });
        expect(result).toEqual(mockRole);
      });
    });
  });

  describe('Permissions', () => {
    describe('getPermissions', () => {
      it('should fetch all permissions', async () => {
        const mockPermissions: Permission[] = [
          {
            id: 'perm-1',
            name: 'users:read:all',
            resource: 'users',
            action: 'read:all',
            description: 'Read all users',
            category: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockPermissions,
        });

        const result = await adminApi.getPermissions();

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/permissions');
        expect(result).toEqual(mockPermissions);
      });
    });

    describe('getPermissionsByCategory', () => {
      it('should fetch permissions by category', async () => {
        const mockPermissions: Permission[] = [
          {
            id: 'perm-1',
            name: 'users:read:all',
            resource: 'users',
            action: 'read:all',
            description: 'Read all users',
            category: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        vi.mocked(apiClient.apiClient.get).mockResolvedValue({
          data: mockPermissions,
        });

        const result = await adminApi.getPermissionsByCategory('admin');

        expect(apiClient.apiClient.get).toHaveBeenCalledWith('/admin/permissions', {
          params: { category: 'admin' },
        });
        expect(result).toEqual(mockPermissions);
      });
    });
  });
});
