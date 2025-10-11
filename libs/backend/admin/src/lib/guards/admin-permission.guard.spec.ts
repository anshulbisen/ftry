import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { AdminPermissionGuard } from './admin-permission.guard';
import type { UserWithPermissions } from '@ftry/shared/types';

describe('AdminPermissionGuard', () => {
  let guard: AdminPermissionGuard;
  let reflector: jest.Mocked<Reflector>;

  // Mock user fixtures
  const mockSuperAdmin: UserWithPermissions = {
    id: 'super-admin-id',
    email: 'super@ftry.com',
    firstName: 'Super',
    lastName: 'Admin',
    phone: null,
    tenantId: null, // NULL indicates super admin
    roleId: 'super-admin-role',
    status: 'active',
    isDeleted: false,
    password: 'hashed',
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: new Date(),
    additionalPermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [
      'users:create:all',
      'users:read:all',
      'users:update:all',
      'users:delete:all',
      'tenants:create',
      'tenants:read:all',
      'tenants:update:all',
      'tenants:delete',
      'roles:create:system',
      'roles:read:all',
    ],
    role: {
      id: 'super-admin-role',
      name: 'Super Admin',
      description: 'Full system access',
      type: 'system',
      level: 100,
      permissions: [],
      isSystem: true,
      isDefault: false,
      status: 'active',
      tenantId: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tenant: null,
  };

  const mockTenantAdmin: UserWithPermissions = {
    id: 'tenant-admin-id',
    email: 'admin@tenant1.com',
    firstName: 'Tenant',
    lastName: 'Admin',
    phone: null,
    tenantId: 'tenant-1',
    roleId: 'tenant-admin-role',
    status: 'active',
    isDeleted: false,
    password: 'hashed',
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: new Date(),
    additionalPermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [
      'users:create:own',
      'users:read:own',
      'users:update:own',
      'users:delete:own',
      'roles:read:own',
      'audit:read:own',
    ],
    role: {
      id: 'tenant-admin-role',
      name: 'Tenant Admin',
      description: 'Tenant admin access',
      type: 'tenant',
      level: 80,
      permissions: [],
      isSystem: true,
      isDefault: false,
      status: 'active',
      tenantId: 'tenant-1',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tenant: {
      id: 'tenant-1',
      name: 'Test Tenant',
      slug: 'test-tenant',
      description: null,
      logo: null,
      website: null,
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionExpiry: null,
      maxUsers: 10,
      settings: null,
      metadata: null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockRegularUser: UserWithPermissions = {
    id: 'regular-user-id',
    email: 'user@tenant1.com',
    firstName: 'Regular',
    lastName: 'User',
    phone: null,
    tenantId: 'tenant-1',
    roleId: 'regular-role',
    status: 'active',
    isDeleted: false,
    password: 'hashed',
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: new Date(),
    additionalPermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [], // No admin permissions
    role: {
      id: 'regular-role',
      name: 'Regular User',
      description: 'Regular user access',
      type: 'tenant',
      level: 1,
      permissions: [],
      isSystem: false,
      isDefault: true,
      status: 'active',
      tenantId: 'tenant-1',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tenant: {
      id: 'tenant-1',
      name: 'Test Tenant',
      slug: 'test-tenant',
      description: null,
      logo: null,
      website: null,
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionExpiry: null,
      maxUsers: 10,
      settings: null,
      metadata: null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  // Helper to create execution context
  const createMockContext = (user: UserWithPermissions | undefined): ExecutionContext => {
    const request = {
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new AdminPermissionGuard(reflector);
  });

  describe('when no permissions are required', () => {
    it('should allow access if no permissions metadata is set', () => {
      // Arrange
      reflector.get.mockReturnValue(undefined);
      const context = createMockContext(mockRegularUser);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access if permissions array is empty', () => {
      // Arrange
      reflector.get.mockReturnValue([]);
      const context = createMockContext(mockRegularUser);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('when user is not authenticated', () => {
    it('should deny access when user is undefined', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all']);
      const context = createMockContext(undefined);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should deny access when user has no permissions property', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all']);
      const userWithoutPermissions = { ...mockRegularUser, permissions: undefined } as any;
      const context = createMockContext(userWithoutPermissions);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('permission checking logic', () => {
    it('should allow access when user has the required permission', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:own']);
      const context = createMockContext(mockTenantAdmin);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has ANY of the required permissions (OR logic)', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all', 'users:read:own']);
      const context = createMockContext(mockTenantAdmin);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockTenantAdmin.permissions).toContain('users:read:own');
    });

    it('should allow access when super admin has required permission', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all']);
      const context = createMockContext(mockSuperAdmin);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user lacks all required permissions', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all', 'users:read:own']);
      const context = createMockContext(mockRegularUser);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with permission list when denied', () => {
      // Arrange
      const requiredPermissions = ['users:read:all', 'users:read:own'];
      reflector.get.mockReturnValue(requiredPermissions);
      const context = createMockContext(mockRegularUser);

      // Act & Assert
      try {
        guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('users:read:all OR users:read:own');
      }
    });
  });

  describe('permission variations', () => {
    it('should NOT allow "all" permission to satisfy "own" permission requirement', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:update:own']);
      const userWithAllPermission: UserWithPermissions = {
        ...mockTenantAdmin,
        permissions: ['users:update:all'], // Has "all" instead of "own"
      };
      const context = createMockContext(userWithAllPermission);

      // Act & Assert - Should fail because we're using exact matching, not hierarchical
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should check exact permission match', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:create:own']);
      const context = createMockContext(mockTenantAdmin);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockTenantAdmin.permissions).toContain('users:create:own');
    });
  });

  describe('multiple permission scenarios', () => {
    it('should allow access when user has one of many required permissions', () => {
      // Arrange
      reflector.get.mockReturnValue([
        'tenants:read:all',
        'tenants:update:all',
        'users:read:own', // Tenant admin has this one
      ]);
      const context = createMockContext(mockTenantAdmin);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user has none of the required permissions', () => {
      // Arrange
      reflector.get.mockReturnValue(['tenants:create', 'tenants:delete', 'system:config']);
      const context = createMockContext(mockTenantAdmin);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('edge cases', () => {
    it('should handle empty permissions array on user', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all']);
      const userWithEmptyPermissions: UserWithPermissions = {
        ...mockRegularUser,
        permissions: [],
      };
      const context = createMockContext(userWithEmptyPermissions);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle null permissions on user', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all']);
      const userWithNullPermissions = {
        ...mockRegularUser,
        permissions: null,
      } as any;
      const context = createMockContext(userWithNullPermissions);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should be case-sensitive for permission matching', () => {
      // Arrange
      reflector.get.mockReturnValue(['USERS:READ:OWN']);
      const context = createMockContext(mockTenantAdmin);

      // Act & Assert
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle special characters in permission names', () => {
      // Arrange
      const userWithSpecialPermissions: UserWithPermissions = {
        ...mockTenantAdmin,
        permissions: ['users:read-write:own', 'clients:*:own'],
      };
      reflector.get.mockReturnValue(['users:read-write:own']);
      const context = createMockContext(userWithSpecialPermissions);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('reflector metadata retrieval', () => {
    it('should call reflector.get with correct parameters', () => {
      // Arrange
      reflector.get.mockReturnValue(['users:read:all']);
      const context = createMockContext(mockSuperAdmin);

      // Act
      guard.canActivate(context);

      // Assert
      expect(reflector.get).toHaveBeenCalledWith('permissions', context.getHandler());
    });

    it('should use handler metadata for permission requirements', () => {
      // Arrange
      const mockHandler = jest.fn();
      reflector.get.mockReturnValue(['users:read:all']);
      const context = {
        ...createMockContext(mockSuperAdmin),
        getHandler: () => mockHandler,
      };

      // Act
      guard.canActivate(context);

      // Assert
      expect(reflector.get).toHaveBeenCalledWith('permissions', mockHandler);
    });
  });
});
