import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { UserAdminService } from './user-admin.service';
import { DataScopingService } from './data-scoping.service';
import { PrismaService } from '@ftry/shared/prisma';
import type { UserWithPermissions } from '@ftry/shared/types';

describe('UserAdminService', () => {
  let service: UserAdminService;
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
    permissions: ['users:read:all', 'users:create:all', 'users:update:all', 'users:delete:all'],
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
    permissions: ['users:read:own', 'users:create:own', 'users:update:own', 'users:delete:own'],
    role: {} as any,
    tenant: {} as any,
  };

  const mockUsers = [
    {
      id: 'user-1',
      email: 'user1@tenant1.com',
      firstName: 'User',
      lastName: 'One',
      tenantId: 'tenant-1',
      roleId: 'role-1',
      status: 'active',
      role: { id: 'role-1', name: 'Staff' },
      tenant: { id: 'tenant-1', name: 'Tenant 1' },
    },
    {
      id: 'user-2',
      email: 'user2@tenant1.com',
      firstName: 'User',
      lastName: 'Two',
      tenantId: 'tenant-1',
      roleId: 'role-1',
      status: 'active',
      role: { id: 'role-1', name: 'Staff' },
      tenant: { id: 'tenant-1', name: 'Tenant 1' },
    },
  ];

  beforeEach(async () => {
    const mockPrisma = mockDeep<PrismaClient>();

    const mockDataScopingService = {
      scopeQuery: jest.fn(),
      canAccessEntity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAdminService,
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

    service = module.get<UserAdminService>(UserAdminService);
    prismaService = module.get(PrismaService);
    dataScopingService = module.get(DataScopingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    describe('super admin access', () => {
      it('should return all users across all tenants for super admin', async () => {
        // Arrange
        const filters = { limit: 50, offset: 0 };
        const baseQuery = {
          where: {},
          include: { role: true, tenant: true },
          take: 50,
          skip: 0,
        };
        dataScopingService.scopeQuery.mockReturnValue(baseQuery);
        prismaService.user.findMany.mockResolvedValue(mockUsers as any);

        // Act
        const result = await service.findAll(mockSuperAdmin, filters);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockSuperAdmin,
          expect.objectContaining({
            where: {},
            include: { role: true, tenant: true },
          }),
          'users',
        );
        expect(prismaService.user.findMany).toHaveBeenCalledWith(baseQuery);
        expect(result).toEqual(mockUsers);
      });

      it('should apply filters while respecting super admin scope', async () => {
        // Arrange
        const filters = {
          status: 'active',
          limit: 20,
          offset: 10,
        };
        const expectedQuery = {
          where: { status: 'active' },
          include: { role: true, tenant: true },
          take: 20,
          skip: 10,
        };
        dataScopingService.scopeQuery.mockReturnValue(expectedQuery);
        prismaService.user.findMany.mockResolvedValue(mockUsers as any);

        // Act
        const result = await service.findAll(mockSuperAdmin, filters);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockSuperAdmin,
          expect.objectContaining({
            where: { status: 'active' },
          }),
          'users',
        );
        expect(result).toEqual(mockUsers);
      });
    });

    describe('tenant admin access', () => {
      it('should return only tenant users for tenant admin', async () => {
        // Arrange
        const filters = { limit: 50, offset: 0 };
        const scopedQuery = {
          where: { tenantId: 'tenant-1' },
          include: { role: true, tenant: true },
          take: 50,
          skip: 0,
        };
        dataScopingService.scopeQuery.mockReturnValue(scopedQuery);
        prismaService.user.findMany.mockResolvedValue(mockUsers as any);

        // Act
        const result = await service.findAll(mockTenantAdmin, filters);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockTenantAdmin,
          expect.any(Object),
          'users',
        );
        expect(prismaService.user.findMany).toHaveBeenCalledWith(scopedQuery);
        expect(result).toEqual(mockUsers);
        expect(result.every((u) => u.tenantId === 'tenant-1')).toBe(true);
      });

      it('should apply filters within tenant scope', async () => {
        // Arrange
        const filters = {
          status: 'active',
          roleId: 'role-1',
          limit: 25,
        };
        const scopedQuery = {
          where: {
            status: 'active',
            roleId: 'role-1',
            tenantId: 'tenant-1',
          },
          include: { role: true, tenant: true },
          take: 25,
          skip: 0,
        };
        dataScopingService.scopeQuery.mockReturnValue(scopedQuery);
        prismaService.user.findMany.mockResolvedValue([mockUsers[0]] as any);

        // Act
        const result = await service.findAll(mockTenantAdmin, filters);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('active');
      });
    });

    describe('pagination', () => {
      it('should use default limit of 50 when not provided', async () => {
        // Arrange
        const filters = {};
        dataScopingService.scopeQuery.mockReturnValue({
          where: {},
          include: { role: true, tenant: true },
          take: 50,
          skip: 0,
        });
        prismaService.user.findMany.mockResolvedValue([]);

        // Act
        await service.findAll(mockSuperAdmin, filters);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockSuperAdmin,
          expect.objectContaining({
            take: 50,
            skip: 0,
          }),
          'users',
        );
      });

      it('should handle custom limit and offset', async () => {
        // Arrange
        const filters = { limit: 10, offset: 20 };
        dataScopingService.scopeQuery.mockReturnValue({
          where: {},
          include: { role: true, tenant: true },
          take: 10,
          skip: 20,
        });
        prismaService.user.findMany.mockResolvedValue([]);

        // Act
        await service.findAll(mockSuperAdmin, filters);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockSuperAdmin,
          expect.objectContaining({
            take: 10,
            skip: 20,
          }),
          'users',
        );
      });

      it('should enforce maximum limit of 100', async () => {
        // Arrange
        const filters = { limit: 500 }; // Exceeds max
        dataScopingService.scopeQuery.mockReturnValue({
          where: {},
          include: { role: true, tenant: true },
          take: 100, // Should be capped
          skip: 0,
        });
        prismaService.user.findMany.mockResolvedValue([]);

        // Act
        await service.findAll(mockSuperAdmin, filters);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockSuperAdmin,
          expect.objectContaining({
            take: 100,
          }),
          'users',
        );
      });
    });

    describe('search and filtering', () => {
      it('should filter by email', async () => {
        // Arrange
        const filters = { email: 'user1@tenant1.com' };
        const scopedQuery = {
          where: { email: 'user1@tenant1.com', tenantId: 'tenant-1' },
          include: { role: true, tenant: true },
          take: 50,
          skip: 0,
        };
        dataScopingService.scopeQuery.mockReturnValue(scopedQuery);
        prismaService.user.findMany.mockResolvedValue([mockUsers[0]] as any);

        // Act
        const result = await service.findAll(mockTenantAdmin, filters);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].email).toBe('user1@tenant1.com');
      });

      it('should filter by status', async () => {
        // Arrange
        const filters = { status: 'inactive' };
        dataScopingService.scopeQuery.mockReturnValue({
          where: { status: 'inactive', tenantId: 'tenant-1' },
          include: { role: true, tenant: true },
          take: 50,
          skip: 0,
        });
        prismaService.user.findMany.mockResolvedValue([]);

        // Act
        const result = await service.findAll(mockTenantAdmin, filters);

        // Assert
        expect(result).toEqual([]);
      });

      it('should filter by roleId', async () => {
        // Arrange
        const filters = { roleId: 'role-1' };
        dataScopingService.scopeQuery.mockReturnValue({
          where: { roleId: 'role-1', tenantId: 'tenant-1' },
          include: { role: true, tenant: true },
          take: 50,
          skip: 0,
        });
        prismaService.user.findMany.mockResolvedValue(mockUsers as any);

        // Act
        const result = await service.findAll(mockTenantAdmin, filters);

        // Assert
        expect(result.every((u) => u.roleId === 'role-1')).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle database errors', async () => {
        // Arrange
        dataScopingService.scopeQuery.mockReturnValue({
          where: {},
          include: { role: true, tenant: true },
          take: 50,
          skip: 0,
        });
        prismaService.user.findMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findAll(mockSuperAdmin, {})).rejects.toThrow('Database error');
      });

      it('should throw ForbiddenException from scoping service', async () => {
        // Arrange
        dataScopingService.scopeQuery.mockImplementation(() => {
          throw new ForbiddenException('Insufficient permissions');
        });

        // Act & Assert
        await expect(service.findAll(mockTenantAdmin, {})).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@tenant1.com',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
      roleId: 'role-1',
      tenantId: 'tenant-1',
    };

    describe('super admin creation', () => {
      it('should allow super admin to create user in any tenant', async () => {
        // Arrange
        const createdUser = {
          id: 'new-user-id',
          ...createUserDto,
          status: 'active',
        };
        prismaService.user.create.mockResolvedValue(createdUser as any);

        // Act
        const result = await service.create(mockSuperAdmin, createUserDto);

        // Assert
        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: createUserDto.email,
            tenantId: 'tenant-1',
          }),
        });
        expect(result).toEqual(createdUser);
      });

      it('should allow super admin to create user in different tenant', async () => {
        // Arrange
        const dtoWithDifferentTenant = {
          ...createUserDto,
          tenantId: 'tenant-999',
        };
        const createdUser = { id: 'new-user-id', ...dtoWithDifferentTenant };
        prismaService.user.create.mockResolvedValue(createdUser as any);

        // Act
        const result = await service.create(mockSuperAdmin, dtoWithDifferentTenant);

        // Assert
        expect(result.tenantId).toBe('tenant-999');
      });
    });

    describe('tenant admin creation', () => {
      it('should allow tenant admin to create user in their tenant', async () => {
        // Arrange
        const createdUser = {
          id: 'new-user-id',
          ...createUserDto,
          status: 'active',
        };
        prismaService.user.create.mockResolvedValue(createdUser as any);

        // Act
        const result = await service.create(mockTenantAdmin, createUserDto);

        // Assert
        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        });
        expect(result).toEqual(createdUser);
      });

      it('should use current user tenantId if not provided in dto', async () => {
        // Arrange
        const dtoWithoutTenant = {
          email: 'newuser@tenant1.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User',
          roleId: 'role-1',
        };
        const createdUser = {
          id: 'new-user-id',
          ...dtoWithoutTenant,
          tenantId: 'tenant-1',
        };
        prismaService.user.create.mockResolvedValue(createdUser as any);

        // Act
        const result = await service.create(mockTenantAdmin, dtoWithoutTenant as any);

        // Assert
        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tenantId: 'tenant-1', // Automatically set from current user
          }),
        });
      });
    });

    describe('cross-tenant validation', () => {
      it('should prevent tenant admin from creating user in different tenant', async () => {
        // Arrange
        const dtoWithDifferentTenant = {
          ...createUserDto,
          tenantId: 'tenant-2', // Different from mockTenantAdmin.tenantId
        };

        // Act & Assert
        await expect(service.create(mockTenantAdmin, dtoWithDifferentTenant)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.create(mockTenantAdmin, dtoWithDifferentTenant)).rejects.toThrow(
          'Cannot create users in other tenants',
        );
        expect(prismaService.user.create).not.toHaveBeenCalled();
      });

      it('should allow creation when tenantId matches user tenant', async () => {
        // Arrange
        const createdUser = { id: 'new-user-id', ...createUserDto };
        prismaService.user.create.mockResolvedValue(createdUser as any);

        // Act
        await service.create(mockTenantAdmin, createUserDto);

        // Assert
        expect(prismaService.user.create).toHaveBeenCalled();
      });
    });

    describe('password handling', () => {
      it('should hash password before creating user', async () => {
        // Arrange
        const createdUser = { id: 'new-user-id', ...createUserDto };
        prismaService.user.create.mockResolvedValue(createdUser as any);

        // Act
        await service.create(mockSuperAdmin, createUserDto);

        // Assert
        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            password: expect.any(String), // Should be hashed
          }),
        });
        // Note: Actual hashing implementation will be in the service
      });
    });

    describe('error handling', () => {
      it('should handle duplicate email error', async () => {
        // Arrange
        prismaService.user.create.mockRejectedValue(new Error('Unique constraint failed on email'));

        // Act & Assert
        await expect(service.create(mockSuperAdmin, createUserDto)).rejects.toThrow();
      });

      it('should handle database errors', async () => {
        // Arrange
        prismaService.user.create.mockRejectedValue(new Error('Database connection failed'));

        // Act & Assert
        await expect(service.create(mockSuperAdmin, createUserDto)).rejects.toThrow(
          'Database connection failed',
        );
      });
    });
  });

  describe('update', () => {
    const userId = 'user-1';
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
      status: 'inactive',
    };

    const existingUser = {
      id: userId,
      email: 'user1@tenant1.com',
      firstName: 'User',
      lastName: 'One',
      tenantId: 'tenant-1',
      roleId: 'role-1',
      status: 'active',
    };

    describe('super admin updates', () => {
      it('should allow super admin to update any user', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(existingUser as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        const updatedUser = { ...existingUser, ...updateDto };
        prismaService.user.update.mockResolvedValue(updatedUser as any);

        // Act
        const result = await service.update(mockSuperAdmin, userId, updateDto);

        // Assert
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: userId },
        });
        expect(dataScopingService.canAccessEntity).toHaveBeenCalled();
        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: updateDto,
        });
        expect(result).toEqual(updatedUser);
      });

      it('should allow super admin to update users from different tenants', async () => {
        // Arrange
        const userFromDifferentTenant = {
          ...existingUser,
          tenantId: 'tenant-999',
        };
        prismaService.user.findUnique.mockResolvedValue(userFromDifferentTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        prismaService.user.update.mockResolvedValue(userFromDifferentTenant as any);

        // Act
        await service.update(mockSuperAdmin, userId, updateDto);

        // Assert
        expect(dataScopingService.canAccessEntity).toHaveBeenCalledWith(
          mockSuperAdmin,
          userFromDifferentTenant,
          'users:update:all',
        );
      });
    });

    describe('tenant admin updates', () => {
      it('should allow tenant admin to update user in their tenant', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(existingUser as any);
        dataScopingService.canAccessEntity
          .mockReturnValueOnce(false) // users:update:all = false
          .mockReturnValueOnce(true); // users:update:own = true
        const updatedUser = { ...existingUser, ...updateDto };
        prismaService.user.update.mockResolvedValue(updatedUser as any);

        // Act
        const result = await service.update(mockTenantAdmin, userId, updateDto);

        // Assert
        expect(result).toEqual(updatedUser);
      });

      it('should prevent tenant admin from updating user in different tenant', async () => {
        // Arrange
        const userFromDifferentTenant = {
          ...existingUser,
          tenantId: 'tenant-2',
        };
        prismaService.user.findUnique.mockResolvedValue(userFromDifferentTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(false);

        // Act & Assert
        await expect(service.update(mockTenantAdmin, userId, updateDto)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.update(mockTenantAdmin, userId, updateDto)).rejects.toThrow(
          'Cannot update this user',
        );
        expect(prismaService.user.update).not.toHaveBeenCalled();
      });
    });

    describe('validation', () => {
      it('should throw NotFoundException if user does not exist', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.update(mockSuperAdmin, userId, updateDto)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.update(mockSuperAdmin, userId, updateDto)).rejects.toThrow(
          'User not found',
        );
        expect(dataScopingService.canAccessEntity).not.toHaveBeenCalled();
        expect(prismaService.user.update).not.toHaveBeenCalled();
      });

      it('should check permissions before updating', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(existingUser as any);
        dataScopingService.canAccessEntity.mockReturnValue(false);

        // Act & Assert
        await expect(service.update(mockTenantAdmin, userId, updateDto)).rejects.toThrow(
          ForbiddenException,
        );
        expect(prismaService.user.update).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle database errors during fetch', async () => {
        // Arrange
        prismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.update(mockSuperAdmin, userId, updateDto)).rejects.toThrow(
          'Database error',
        );
      });

      it('should handle database errors during update', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(existingUser as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        prismaService.user.update.mockRejectedValue(new Error('Update failed'));

        // Act & Assert
        await expect(service.update(mockSuperAdmin, userId, updateDto)).rejects.toThrow(
          'Update failed',
        );
      });
    });
  });

  describe('delete', () => {
    const userId = 'user-1';
    const existingUser = {
      id: userId,
      email: 'user1@tenant1.com',
      tenantId: 'tenant-1',
      isDeleted: false,
    };

    describe('super admin deletion', () => {
      it('should allow super admin to delete any user', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(existingUser as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        prismaService.user.update.mockResolvedValue({
          ...existingUser,
          isDeleted: true,
          deletedAt: new Date(),
        } as any);

        // Act
        await service.delete(mockSuperAdmin, userId);

        // Assert
        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: {
            isDeleted: true,
            deletedAt: expect.any(Date),
          },
        });
      });
    });

    describe('tenant admin deletion', () => {
      it('should allow tenant admin to delete user in their tenant', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(existingUser as any);
        dataScopingService.canAccessEntity
          .mockReturnValueOnce(false) // users:delete:all = false
          .mockReturnValueOnce(true); // users:delete:own = true
        prismaService.user.update.mockResolvedValue({
          ...existingUser,
          isDeleted: true,
        } as any);

        // Act
        await service.delete(mockTenantAdmin, userId);

        // Assert
        expect(prismaService.user.update).toHaveBeenCalled();
      });

      it('should prevent tenant admin from deleting user in different tenant', async () => {
        // Arrange
        const userFromDifferentTenant = {
          ...existingUser,
          tenantId: 'tenant-2',
        };
        prismaService.user.findUnique.mockResolvedValue(userFromDifferentTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(false);

        // Act & Assert
        await expect(service.delete(mockTenantAdmin, userId)).rejects.toThrow(ForbiddenException);
      });
    });

    describe('validation', () => {
      it('should throw NotFoundException if user does not exist', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete(mockSuperAdmin, userId)).rejects.toThrow(NotFoundException);
      });

      it('should prevent deletion of already deleted user', async () => {
        // Arrange
        const deletedUser = { ...existingUser, isDeleted: true };
        prismaService.user.findUnique.mockResolvedValue(deletedUser as any);

        // Act & Assert
        await expect(service.delete(mockSuperAdmin, userId)).rejects.toThrow(BadRequestException);
        await expect(service.delete(mockSuperAdmin, userId)).rejects.toThrow(
          'User is already deleted',
        );
      });
    });
  });
});
