import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { RoleService } from './role.service';
import { DataScopingService } from './data-scoping.service';
import { PrismaService } from '@ftry/shared/prisma';
import type { UserWithPermissions } from '@ftry/shared/types';

describe('RoleService', () => {
  let service: RoleService;
  let prismaService: DeepMockProxy<PrismaClient>;
  let dataScopingService: jest.Mocked<DataScopingService>;

  // Mock user fixtures
  const mockSuperAdmin: UserWithPermissions = {
    id: 'super-admin-id',
    email: 'super@ftry.com',
    firstName: 'Super',
    lastName: 'Admin',
    phone: null,
    tenantId: null,
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
      'roles:create:system',
      'roles:create:tenant',
      'roles:read:all',
      'roles:update:system',
      'roles:update:tenant',
      'roles:delete',
    ],
    role: {} as any,
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
    permissions: ['roles:create:tenant', 'roles:read:own', 'roles:update:tenant'],
    role: {} as any,
    tenant: {} as any,
  };

  const mockSystemRole = {
    id: 'system-role-1',
    name: 'Super Admin',
    description: 'Full system access',
    type: 'system',
    level: 100,
    permissions: ['*:*:*'],
    isSystem: true,
    isDefault: false,
    status: 'active',
    tenantId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTenantRole = {
    id: 'tenant-role-1',
    name: 'Staff',
    description: 'Staff access',
    type: 'tenant',
    level: 10,
    permissions: ['appointments:read:own', 'clients:read:own'],
    isSystem: false,
    isDefault: true,
    status: 'active',
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = mockDeep<PrismaClient>();

    const mockDataScopingService = {
      scopeQuery: jest.fn(),
      canAccessEntity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: DataScopingService,
          useValue: mockDataScopingService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prismaService = module.get(PrismaService);
    dataScopingService = module.get(DataScopingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    describe('super admin access', () => {
      it('should return all roles (system and tenant) for super admin', async () => {
        // Arrange
        const allRoles = [mockSystemRole, mockTenantRole];
        const baseQuery = {
          where: {},
          orderBy: { level: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(baseQuery);
        prismaService.role.findMany.mockResolvedValue(allRoles as any);

        // Act
        const result = await service.findAll(mockSuperAdmin);

        // Assert
        expect(result).toEqual(allRoles);
        expect(result).toHaveLength(2);
      });

      it('should filter roles by type for super admin', async () => {
        // Arrange
        const filters = { type: 'system' };
        const query = {
          where: { type: 'system' },
          orderBy: { level: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(query);
        prismaService.role.findMany.mockResolvedValue([mockSystemRole] as any);

        // Act
        const result = await service.findAll(mockSuperAdmin, filters);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('system');
      });
    });

    describe('tenant admin access', () => {
      it('should return only tenant roles for tenant admin', async () => {
        // Arrange
        const scopedQuery = {
          where: { tenantId: 'tenant-1' },
          orderBy: { level: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(scopedQuery);
        prismaService.role.findMany.mockResolvedValue([mockTenantRole] as any);

        // Act
        const result = await service.findAll(mockTenantAdmin);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].tenantId).toBe('tenant-1');
        expect(result.every((r) => r.type !== 'system')).toBe(true);
      });

      it('should not see system roles or other tenant roles', async () => {
        // Arrange
        const scopedQuery = {
          where: { tenantId: 'tenant-1' },
          orderBy: { level: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(scopedQuery);
        prismaService.role.findMany.mockResolvedValue([mockTenantRole] as any);

        // Act
        const result = await service.findAll(mockTenantAdmin);

        // Assert
        expect(result.every((r) => r.tenantId === 'tenant-1')).toBe(true);
      });
    });
  });

  describe('create', () => {
    describe('system role creation', () => {
      const createSystemRoleDto = {
        name: 'Platform Admin',
        description: 'Platform-wide administration',
        type: 'system' as const,
        level: 90,
        permissions: ['users:read:all', 'tenants:read:all'],
        tenantId: null,
      };

      it('should allow super admin to create system role', async () => {
        // Arrange
        const createdRole = {
          id: 'new-system-role',
          ...createSystemRoleDto,
          isSystem: false,
          isDefault: false,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        prismaService.role.create.mockResolvedValue(createdRole as any);

        // Act
        const result = await service.create(mockSuperAdmin, createSystemRoleDto);

        // Assert
        expect(prismaService.role.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: createSystemRoleDto.name,
            type: 'system',
            tenantId: null,
          }),
        });
        expect(result).toEqual(createdRole);
      });

      it('should prevent tenant admin from creating system role', async () => {
        // Act & Assert
        await expect(service.create(mockTenantAdmin, createSystemRoleDto)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.create(mockTenantAdmin, createSystemRoleDto)).rejects.toThrow(
          'Only super admins can create system roles',
        );
        expect(prismaService.role.create).not.toHaveBeenCalled();
      });

      it('should validate system role has null tenantId', async () => {
        // Arrange
        const invalidDto = {
          ...createSystemRoleDto,
          tenantId: 'tenant-1', // System role should have null tenantId
        };

        // Act & Assert
        await expect(service.create(mockSuperAdmin, invalidDto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.create(mockSuperAdmin, invalidDto)).rejects.toThrow(
          'System roles must have null tenantId',
        );
      });
    });

    describe('tenant role creation', () => {
      const createTenantRoleDto = {
        name: 'Receptionist',
        description: 'Front desk staff',
        type: 'tenant' as const,
        level: 5,
        permissions: ['appointments:read:own', 'clients:read:own'],
        tenantId: 'tenant-1',
      };

      it('should allow tenant admin to create role in their tenant', async () => {
        // Arrange
        const createdRole = {
          id: 'new-tenant-role',
          ...createTenantRoleDto,
          isSystem: false,
          isDefault: false,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        prismaService.role.create.mockResolvedValue(createdRole as any);

        // Act
        const result = await service.create(mockTenantAdmin, createTenantRoleDto);

        // Assert
        expect(prismaService.role.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: createTenantRoleDto.name,
            type: 'tenant',
            tenantId: 'tenant-1',
          }),
        });
        expect(result).toEqual(createdRole);
      });

      it('should use current user tenantId if not provided', async () => {
        // Arrange
        const dtoWithoutTenantId = {
          name: 'Receptionist',
          description: 'Front desk staff',
          type: 'tenant' as const,
          level: 5,
          permissions: ['appointments:read:own'],
        };
        const createdRole = {
          id: 'new-role',
          ...dtoWithoutTenantId,
          tenantId: 'tenant-1', // Auto-filled
        };
        prismaService.role.create.mockResolvedValue(createdRole as any);

        // Act
        const result = await service.create(mockTenantAdmin, dtoWithoutTenantId as any);

        // Assert
        expect(prismaService.role.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        });
      });

      it('should prevent tenant admin from creating role in different tenant', async () => {
        // Arrange
        const dtoWithDifferentTenant = {
          ...createTenantRoleDto,
          tenantId: 'tenant-2',
        };

        // Act & Assert
        await expect(service.create(mockTenantAdmin, dtoWithDifferentTenant)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.create(mockTenantAdmin, dtoWithDifferentTenant)).rejects.toThrow(
          'Cannot create roles in other tenants',
        );
      });

      it('should validate tenant role has non-null tenantId', async () => {
        // Arrange
        const invalidDto = {
          ...createTenantRoleDto,
          tenantId: null, // Tenant role should have tenantId
        };

        // Act & Assert
        await expect(service.create(mockSuperAdmin, invalidDto as any)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.create(mockSuperAdmin, invalidDto as any)).rejects.toThrow(
          'Tenant roles must have a tenantId',
        );
      });
    });

    describe('permission assignment', () => {
      it('should validate permissions are in correct format', async () => {
        // Arrange
        const dtoWithInvalidPermissions = {
          name: 'Test Role',
          type: 'tenant' as const,
          level: 10,
          permissions: ['invalid-permission'], // Should be resource:action:scope
          tenantId: 'tenant-1',
        };

        // Act & Assert
        await expect(service.create(mockTenantAdmin, dtoWithInvalidPermissions)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.create(mockTenantAdmin, dtoWithInvalidPermissions)).rejects.toThrow(
          'Invalid permission format',
        );
      });

      it('should allow empty permissions array', async () => {
        // Arrange
        const dtoWithNoPermissions = {
          name: 'Limited Role',
          type: 'tenant' as const,
          level: 1,
          permissions: [],
          tenantId: 'tenant-1',
        };
        const createdRole = {
          id: 'new-role',
          ...dtoWithNoPermissions,
          isSystem: false,
          isDefault: false,
          status: 'active',
        };
        prismaService.role.create.mockResolvedValue(createdRole as any);

        // Act
        const result = await service.create(mockTenantAdmin, dtoWithNoPermissions);

        // Assert
        expect(result.permissions).toEqual([]);
      });
    });
  });

  describe('update', () => {
    const roleId = 'tenant-role-1';
    const updateDto = {
      name: 'Updated Staff',
      description: 'Updated description',
      permissions: ['appointments:read:own', 'appointments:write:own'],
    };

    describe('tenant role updates', () => {
      it('should allow tenant admin to update tenant role in their tenant', async () => {
        // Arrange
        prismaService.role.findUnique.mockResolvedValue(mockTenantRole as any);
        dataScopingService.canAccessEntity
          .mockReturnValueOnce(false) // roles:update:system = false
          .mockReturnValueOnce(true); // roles:update:tenant = true
        const updatedRole = { ...mockTenantRole, ...updateDto };
        prismaService.role.update.mockResolvedValue(updatedRole as any);

        // Act
        const result = await service.update(mockTenantAdmin, roleId, updateDto);

        // Assert
        expect(result).toEqual(updatedRole);
      });

      it('should prevent tenant admin from updating role in different tenant', async () => {
        // Arrange
        const roleFromDifferentTenant = {
          ...mockTenantRole,
          tenantId: 'tenant-2',
        };
        prismaService.role.findUnique.mockResolvedValue(roleFromDifferentTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(false);

        // Act & Assert
        await expect(service.update(mockTenantAdmin, roleId, updateDto)).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe('system role updates', () => {
      it('should allow super admin to update system role', async () => {
        // Arrange
        prismaService.role.findUnique.mockResolvedValue(mockSystemRole as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        const updatedRole = { ...mockSystemRole, ...updateDto };
        prismaService.role.update.mockResolvedValue(updatedRole as any);

        // Act
        const result = await service.update(mockSuperAdmin, mockSystemRole.id, updateDto);

        // Assert
        expect(result).toEqual(updatedRole);
      });

      it('should prevent tenant admin from updating system role', async () => {
        // Arrange
        prismaService.role.findUnique.mockResolvedValue(mockSystemRole as any);
        dataScopingService.canAccessEntity.mockReturnValue(false);

        // Act & Assert
        await expect(service.update(mockTenantAdmin, mockSystemRole.id, updateDto)).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe('system role protection', () => {
      it('should prevent modification of system-protected roles', async () => {
        // Arrange
        const protectedRole = { ...mockSystemRole, isSystem: true };
        prismaService.role.findUnique.mockResolvedValue(protectedRole as any);

        // Act & Assert
        await expect(service.update(mockSuperAdmin, roleId, updateDto)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.update(mockSuperAdmin, roleId, updateDto)).rejects.toThrow(
          'Cannot modify system-protected role',
        );
      });
    });

    describe('validation', () => {
      it('should throw NotFoundException if role does not exist', async () => {
        // Arrange
        prismaService.role.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.update(mockSuperAdmin, roleId, updateDto)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('delete', () => {
    const roleId = 'tenant-role-1';

    describe('tenant role deletion', () => {
      it('should allow deletion of tenant role with no users', async () => {
        // Arrange
        const roleWithNoUsers = {
          ...mockTenantRole,
          _count: { users: 0 },
        };
        prismaService.role.findUnique.mockResolvedValue(roleWithNoUsers as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        prismaService.role.delete.mockResolvedValue(roleWithNoUsers as any);

        // Act
        await service.delete(mockSuperAdmin, roleId);

        // Assert
        expect(prismaService.role.delete).toHaveBeenCalledWith({
          where: { id: roleId },
        });
      });

      it('should prevent deletion of role with active users', async () => {
        // Arrange
        const roleWithUsers = {
          ...mockTenantRole,
          _count: { users: 5 },
        };
        prismaService.role.findUnique.mockResolvedValue(roleWithUsers as any);

        // Act & Assert
        await expect(service.delete(mockSuperAdmin, roleId)).rejects.toThrow(BadRequestException);
        await expect(service.delete(mockSuperAdmin, roleId)).rejects.toThrow(
          'Cannot delete role with active users',
        );
        expect(prismaService.role.delete).not.toHaveBeenCalled();
      });
    });

    describe('system role protection', () => {
      it('should prevent deletion of system-protected roles', async () => {
        // Arrange
        const protectedRole = {
          ...mockSystemRole,
          isSystem: true,
          _count: { users: 0 },
        };
        prismaService.role.findUnique.mockResolvedValue(protectedRole as any);

        // Act & Assert
        await expect(service.delete(mockSuperAdmin, mockSystemRole.id)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.delete(mockSuperAdmin, mockSystemRole.id)).rejects.toThrow(
          'Cannot delete system-protected role',
        );
      });
    });

    describe('default role protection', () => {
      it('should prevent deletion of default role', async () => {
        // Arrange
        const defaultRole = {
          ...mockTenantRole,
          isDefault: true,
          _count: { users: 0 },
        };
        prismaService.role.findUnique.mockResolvedValue(defaultRole as any);

        // Act & Assert
        await expect(service.delete(mockSuperAdmin, roleId)).rejects.toThrow(BadRequestException);
        await expect(service.delete(mockSuperAdmin, roleId)).rejects.toThrow(
          'Cannot delete default role',
        );
      });
    });

    describe('permission validation', () => {
      it('should prevent tenant admin from deleting role in different tenant', async () => {
        // Arrange
        const roleFromDifferentTenant = {
          ...mockTenantRole,
          tenantId: 'tenant-2',
          _count: { users: 0 },
        };
        prismaService.role.findUnique.mockResolvedValue(roleFromDifferentTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(false);

        // Act & Assert
        await expect(service.delete(mockTenantAdmin, roleId)).rejects.toThrow(ForbiddenException);
      });
    });
  });
});
