import { ForbiddenException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DataScopingService } from './data-scoping.service';
import type { UserWithPermissions } from '@ftry/shared/types';

describe('DataScopingService', () => {
  let service: DataScopingService;

  // Mock user fixtures
  const mockSuperAdmin: UserWithPermissions = {
    id: 'super-admin-id',
    email: 'super@ftry.com',
    firstName: 'Super',
    lastName: 'Admin',
    phone: null,
    tenantId: null, // NULL = super admin
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
    permissions: ['users:read:all', 'users:create:all', 'users:update:all', 'tenants:read:all'],
    role: {
      id: 'super-admin-role',
      name: 'Super Admin',
      type: 'system',
      level: 100,
      permissions: [],
      isSystem: true,
      isDefault: false,
      status: 'active',
      tenantId: null,
      description: null,
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
    permissions: ['users:read:own', 'users:create:own', 'users:update:own', 'tenants:read:own'],
    role: {
      id: 'tenant-admin-role',
      name: 'Tenant Admin',
      type: 'tenant',
      level: 80,
      permissions: [],
      isSystem: true,
      isDefault: false,
      status: 'active',
      tenantId: 'tenant-1',
      description: null,
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
    permissions: [], // No read permissions
    role: {
      id: 'regular-role',
      name: 'Regular User',
      type: 'tenant',
      level: 1,
      permissions: [],
      isSystem: false,
      isDefault: true,
      status: 'active',
      tenantId: 'tenant-1',
      description: null,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataScopingService],
    }).compile();

    service = module.get<DataScopingService>(DataScopingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scopeQuery', () => {
    describe('super admin access (all permissions)', () => {
      it('should return unmodified query when user has "all" permission', () => {
        // Arrange
        const baseQuery = {
          where: { status: 'active' },
          include: { role: true },
        };

        // Act
        const result = service.scopeQuery(mockSuperAdmin, baseQuery, 'users');

        // Assert
        expect(result).toEqual(baseQuery);
        expect(result).not.toHaveProperty('where.tenantId');
      });

      it('should not add tenantId filter for super admin', () => {
        // Arrange
        const baseQuery = {};

        // Act
        const result = service.scopeQuery(mockSuperAdmin, baseQuery, 'tenants');

        // Assert
        expect(result).toEqual({});
      });

      it('should preserve existing where conditions for super admin', () => {
        // Arrange
        const baseQuery = {
          where: {
            status: 'active',
            email: { contains: '@test.com' },
          },
        };

        // Act
        const result = service.scopeQuery(mockSuperAdmin, baseQuery, 'users');

        // Assert
        expect(result).toEqual(baseQuery);
        expect(result.where).toHaveProperty('status', 'active');
        expect(result.where).toHaveProperty('email');
      });
    });

    describe('tenant-scoped access (own permissions)', () => {
      it('should add tenantId filter when user has "own" permission', () => {
        // Arrange
        const baseQuery = {
          where: { status: 'active' },
        };

        // Act
        const result = service.scopeQuery(mockTenantAdmin, baseQuery, 'users');

        // Assert
        expect(result).toEqual({
          where: {
            status: 'active',
            tenantId: 'tenant-1',
          },
        });
      });

      it('should add tenantId filter to empty query', () => {
        // Arrange
        const baseQuery = {};

        // Act
        const result = service.scopeQuery(mockTenantAdmin, baseQuery, 'users');

        // Assert
        expect(result).toEqual({
          where: {
            tenantId: 'tenant-1',
          },
        });
      });

      it('should preserve existing where conditions when adding tenantId', () => {
        // Arrange
        const baseQuery = {
          where: {
            status: 'active',
            isDeleted: false,
          },
          include: { role: true },
        };

        // Act
        const result = service.scopeQuery(mockTenantAdmin, baseQuery, 'users');

        // Assert
        expect(result).toEqual({
          where: {
            status: 'active',
            isDeleted: false,
            tenantId: 'tenant-1',
          },
          include: { role: true },
        });
      });

      it('should handle nested where conditions', () => {
        // Arrange
        const baseQuery = {
          where: {
            AND: [{ status: 'active' }, { isDeleted: false }],
          },
        };

        // Act
        const result = service.scopeQuery(mockTenantAdmin, baseQuery, 'users');

        // Assert
        expect(result).toEqual({
          where: {
            AND: [{ status: 'active' }, { isDeleted: false }],
            tenantId: 'tenant-1',
          },
        });
      });
    });

    describe('insufficient permissions', () => {
      it('should throw ForbiddenException when user has no read permissions', () => {
        // Arrange
        const baseQuery = { where: { status: 'active' } };

        // Act & Assert
        expect(() => service.scopeQuery(mockRegularUser, baseQuery, 'users')).toThrow(
          ForbiddenException,
        );
      });

      it('should throw ForbiddenException with descriptive message', () => {
        // Arrange
        const baseQuery = {};

        // Act & Assert
        try {
          service.scopeQuery(mockRegularUser, baseQuery, 'users');
          fail('Should have thrown ForbiddenException');
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenException);
          expect(error.message).toContain('Insufficient permissions');
        }
      });
    });

    describe('different resources', () => {
      it('should scope tenants query correctly', () => {
        // Arrange
        const baseQuery = { where: { status: 'active' } };

        // Act
        const result = service.scopeQuery(mockTenantAdmin, baseQuery, 'tenants');

        // Assert
        expect(result).toEqual({
          where: {
            status: 'active',
            tenantId: 'tenant-1',
          },
        });
      });

      it('should scope roles query correctly', () => {
        // Arrange
        const userWithRolePermission: UserWithPermissions = {
          ...mockTenantAdmin,
          permissions: ['roles:read:own'],
        };
        const baseQuery = {};

        // Act
        const result = service.scopeQuery(userWithRolePermission, baseQuery, 'roles');

        // Assert
        expect(result).toEqual({
          where: {
            tenantId: 'tenant-1',
          },
        });
      });
    });
  });

  describe('canAccessEntity', () => {
    describe('super admin access', () => {
      it('should allow super admin to access any entity', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-1' };

        // Act
        const result = service.canAccessEntity(mockSuperAdmin, entity, 'users:update:all');

        // Assert
        expect(result).toBe(true);
      });

      it('should allow super admin even without specific permission', () => {
        // Arrange
        const superAdminWithoutPermission: UserWithPermissions = {
          ...mockSuperAdmin,
          permissions: [], // Empty permissions
        };
        const entity = { id: 'user-1', tenantId: 'tenant-1' };

        // Act
        const result = service.canAccessEntity(
          superAdminWithoutPermission,
          entity,
          'users:update:all',
        );

        // Assert
        expect(result).toBe(true); // Super admin (tenantId = null) can access everything
      });

      it('should allow super admin to access entities from different tenants', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-999' };

        // Act
        const result = service.canAccessEntity(mockSuperAdmin, entity, 'users:delete:all');

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('cross-tenant access with "all" permission', () => {
      it('should allow access with "all" permission even for different tenant', () => {
        // Arrange
        const userWithAllPermission: UserWithPermissions = {
          ...mockTenantAdmin,
          tenantId: 'tenant-1',
          permissions: ['users:update:all'], // "all" permission
        };
        const entity = { id: 'user-1', tenantId: 'tenant-2' };

        // Act
        const result = service.canAccessEntity(userWithAllPermission, entity, 'users:update:all');

        // Assert
        expect(result).toBe(true);
      });

      it('should deny access with "all" permission if user lacks that permission', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-2' };

        // Act
        const result = service.canAccessEntity(mockTenantAdmin, entity, 'users:update:all');

        // Assert
        expect(result).toBe(false); // mockTenantAdmin only has "own" permissions
      });
    });

    describe('same-tenant access with "own" permission', () => {
      it('should allow access to entity in same tenant with "own" permission', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-1' };

        // Act
        const result = service.canAccessEntity(mockTenantAdmin, entity, 'users:update:own');

        // Assert
        expect(result).toBe(true);
      });

      it('should deny access to entity in different tenant with "own" permission', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-2' };

        // Act
        const result = service.canAccessEntity(mockTenantAdmin, entity, 'users:update:own');

        // Assert
        expect(result).toBe(false);
      });

      it('should deny access with "own" permission if user lacks that permission', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-1' };
        const userWithoutPermission: UserWithPermissions = {
          ...mockTenantAdmin,
          permissions: [], // No permissions
        };

        // Act
        const result = service.canAccessEntity(userWithoutPermission, entity, 'users:update:own');

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('permission without scope suffix', () => {
      it('should return false for permissions without :all or :own suffix', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-1' };
        const userWithGenericPermission: UserWithPermissions = {
          ...mockTenantAdmin,
          permissions: ['users:update'], // No :all or :own
        };

        // Act
        const result = service.canAccessEntity(userWithGenericPermission, entity, 'users:update');

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle entity without tenantId', () => {
        // Arrange
        const entity = { id: 'system-setting-1' }; // No tenantId

        // Act
        const result = service.canAccessEntity(mockSuperAdmin, entity, 'system:update:all');

        // Assert
        expect(result).toBe(true); // Super admin can access
      });

      it('should handle null entity', () => {
        // Arrange
        const entity = null as any;

        // Act
        const result = service.canAccessEntity(mockTenantAdmin, entity, 'users:update:own');

        // Assert
        expect(result).toBe(false);
      });

      it('should handle entity with null tenantId (system entity)', () => {
        // Arrange
        const entity = { id: 'system-role-1', tenantId: null };

        // Act
        const resultSuperAdmin = service.canAccessEntity(
          mockSuperAdmin,
          entity,
          'roles:update:all',
        );
        const resultTenantAdmin = service.canAccessEntity(
          mockTenantAdmin,
          entity,
          'roles:update:own',
        );

        // Assert
        expect(resultSuperAdmin).toBe(true);
        expect(resultTenantAdmin).toBe(false); // Tenant admin can't access system roles
      });
    });

    describe('different permission types', () => {
      it('should check create permissions', () => {
        // Arrange
        const entity = { tenantId: 'tenant-1' };

        // Act
        const result = service.canAccessEntity(mockTenantAdmin, entity, 'users:create:own');

        // Assert
        expect(result).toBe(true);
      });

      it('should check delete permissions', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-1' };
        const userWithDeletePermission: UserWithPermissions = {
          ...mockTenantAdmin,
          permissions: ['users:delete:own'],
        };

        // Act
        const result = service.canAccessEntity(
          userWithDeletePermission,
          entity,
          'users:delete:own',
        );

        // Assert
        expect(result).toBe(true);
      });

      it('should check read permissions', () => {
        // Arrange
        const entity = { id: 'user-1', tenantId: 'tenant-1' };

        // Act
        const result = service.canAccessEntity(mockTenantAdmin, entity, 'users:read:own');

        // Assert
        expect(result).toBe(true);
      });
    });
  });
});
