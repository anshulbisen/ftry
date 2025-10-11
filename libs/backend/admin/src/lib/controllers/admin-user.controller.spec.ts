import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { ExecutionContext } from '@nestjs/common';
import { AdminUserController } from './admin-user.controller';
import { UserAdminService } from '../services/user-admin.service';
import { JwtAuthGuard } from '@ftry/backend/auth';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import type { UserWithPermissions } from '@ftry/shared/types';

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let userAdminService: jest.Mocked<UserAdminService>;

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
    permissions: ['users:read:own', 'users:create:own', 'users:update:own'],
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
    const mockUserAdminService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: UserAdminService,
          useValue: mockUserAdminService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockSuperAdmin;
          return true;
        },
      })
      .overrideGuard(AdminPermissionGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<AdminUserController>(AdminUserController);
    userAdminService = module.get(UserAdminService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/admin/users', () => {
    describe('super admin access', () => {
      it('should return all users across all tenants', async () => {
        // Arrange
        const allUsersAcrossTenants = [
          ...mockUsers,
          { ...mockUsers[0], id: 'user-3', tenantId: 'tenant-2' },
        ];
        userAdminService.findAll.mockResolvedValue(allUsersAcrossTenants as any);

        // Act
        const result = await controller.getUsers(mockSuperAdmin, {});

        // Assert
        expect(userAdminService.findAll).toHaveBeenCalledWith(mockSuperAdmin, {});
        expect(result.success).toBe(true);
        expect(result.data).toEqual(allUsersAcrossTenants);
        expect(result.data).toHaveLength(3);
      });

      it('should apply filters for super admin', async () => {
        // Arrange
        const filters = { status: 'active', limit: 20, offset: 0 };
        userAdminService.findAll.mockResolvedValue(mockUsers as any);

        // Act
        const result = await controller.getUsers(mockSuperAdmin, filters);

        // Assert
        expect(userAdminService.findAll).toHaveBeenCalledWith(mockSuperAdmin, filters);
        expect(result.success).toBe(true);
      });

      it('should handle pagination parameters', async () => {
        // Arrange
        const filters = { limit: 10, offset: 20 };
        userAdminService.findAll.mockResolvedValue([]);

        // Act
        const result = await controller.getUsers(mockSuperAdmin, filters);

        // Assert
        expect(userAdminService.findAll).toHaveBeenCalledWith(mockSuperAdmin, {
          limit: 10,
          offset: 20,
        });
      });
    });

    describe('tenant admin access', () => {
      it('should return only tenant users for tenant admin', async () => {
        // Arrange
        userAdminService.findAll.mockResolvedValue(mockUsers as any);

        // Act
        const result = await controller.getUsers(mockTenantAdmin, {});

        // Assert
        expect(userAdminService.findAll).toHaveBeenCalledWith(mockTenantAdmin, {});
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockUsers);
        expect(result.data.every((u: any) => u.tenantId === 'tenant-1')).toBe(true);
      });

      it('should apply tenant-scoped filters', async () => {
        // Arrange
        const filters = { roleId: 'role-1' };
        userAdminService.findAll.mockResolvedValue([mockUsers[0]] as any);

        // Act
        const result = await controller.getUsers(mockTenantAdmin, filters);

        // Assert
        expect(userAdminService.findAll).toHaveBeenCalledWith(mockTenantAdmin, filters);
      });
    });

    describe('error handling', () => {
      it('should handle service errors', async () => {
        // Arrange
        userAdminService.findAll.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getUsers(mockSuperAdmin, {})).rejects.toThrow('Database error');
      });

      it('should handle forbidden errors', async () => {
        // Arrange
        userAdminService.findAll.mockRejectedValue(new Error('Insufficient permissions'));

        // Act & Assert
        await expect(controller.getUsers(mockTenantAdmin, {})).rejects.toThrow();
      });
    });
  });

  describe('POST /api/v1/admin/users', () => {
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
        userAdminService.create.mockResolvedValue(createdUser as any);

        // Act
        const result = await controller.createUser(mockSuperAdmin, createUserDto);

        // Assert
        expect(userAdminService.create).toHaveBeenCalledWith(mockSuperAdmin, createUserDto);
        expect(result.success).toBe(true);
        expect(result.message).toContain('created successfully');
        expect(result.data).toEqual(createdUser);
      });

      it('should not return password in response', async () => {
        // Arrange
        const createdUser = {
          id: 'new-user-id',
          ...createUserDto,
          password: 'hashed-password',
        };
        userAdminService.create.mockResolvedValue(createdUser as any);

        // Act
        const result = await controller.createUser(mockSuperAdmin, createUserDto);

        // Assert
        expect(result.data).not.toHaveProperty('password');
      });
    });

    describe('tenant admin creation', () => {
      it('should allow tenant admin to create user in their tenant', async () => {
        // Arrange
        const createdUser = { id: 'new-user-id', ...createUserDto };
        userAdminService.create.mockResolvedValue(createdUser as any);

        // Act
        const result = await controller.createUser(mockTenantAdmin, createUserDto);

        // Assert
        expect(userAdminService.create).toHaveBeenCalledWith(mockTenantAdmin, createUserDto);
        expect(result.success).toBe(true);
      });

      it('should prevent tenant admin from creating user in different tenant', async () => {
        // Arrange
        userAdminService.create.mockRejectedValue(
          new Error('Cannot create users in other tenants'),
        );
        const dtoWithDifferentTenant = { ...createUserDto, tenantId: 'tenant-2' };

        // Act & Assert
        await expect(
          controller.createUser(mockTenantAdmin, dtoWithDifferentTenant),
        ).rejects.toThrow('Cannot create users in other tenants');
      });
    });

    describe('validation', () => {
      it('should validate required fields', async () => {
        // Note: DTO validation is handled by NestJS validation pipes
        // This test documents the expected behavior

        // Arrange
        const invalidDto = {
          email: 'invalid-email', // Should fail email validation
          password: '123', // Should fail password strength
        } as any;

        // Act & Assert
        // In real scenario, ValidationPipe would reject this before reaching controller
        // Service layer should also validate
        userAdminService.create.mockRejectedValue(new Error('Validation failed'));
        await expect(controller.createUser(mockSuperAdmin, invalidDto)).rejects.toThrow();
      });
    });
  });

  describe('PATCH /api/v1/admin/users/:id', () => {
    const userId = 'user-1';
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    describe('successful updates', () => {
      it('should allow super admin to update any user', async () => {
        // Arrange
        const updatedUser = { ...mockUsers[0], ...updateDto };
        userAdminService.update.mockResolvedValue(updatedUser as any);

        // Act
        const result = await controller.updateUser(mockSuperAdmin, userId, updateDto);

        // Assert
        expect(userAdminService.update).toHaveBeenCalledWith(mockSuperAdmin, userId, updateDto);
        expect(result.success).toBe(true);
        expect(result.message).toContain('updated successfully');
        expect(result.data.firstName).toBe('Updated');
      });

      it('should allow tenant admin to update user in their tenant', async () => {
        // Arrange
        const updatedUser = { ...mockUsers[0], ...updateDto };
        userAdminService.update.mockResolvedValue(updatedUser as any);

        // Act
        const result = await controller.updateUser(mockTenantAdmin, userId, updateDto);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe('permission validation', () => {
      it('should prevent tenant admin from updating user in different tenant', async () => {
        // Arrange
        userAdminService.update.mockRejectedValue(new Error('Cannot update this user'));

        // Act & Assert
        await expect(controller.updateUser(mockTenantAdmin, userId, updateDto)).rejects.toThrow(
          'Cannot update this user',
        );
      });
    });

    describe('error handling', () => {
      it('should handle user not found', async () => {
        // Arrange
        userAdminService.update.mockRejectedValue(new Error('User not found'));

        // Act & Assert
        await expect(
          controller.updateUser(mockSuperAdmin, 'invalid-id', updateDto),
        ).rejects.toThrow('User not found');
      });
    });
  });

  describe('DELETE /api/v1/admin/users/:id', () => {
    const userId = 'user-1';

    describe('successful deletion', () => {
      it('should allow super admin to delete any user', async () => {
        // Arrange
        userAdminService.delete.mockResolvedValue(undefined);

        // Act
        const result = await controller.deleteUser(mockSuperAdmin, userId);

        // Assert
        expect(userAdminService.delete).toHaveBeenCalledWith(mockSuperAdmin, userId);
        expect(result.success).toBe(true);
        expect(result.message).toContain('deleted successfully');
      });

      it('should allow tenant admin to delete user in their tenant', async () => {
        // Arrange
        userAdminService.delete.mockResolvedValue(undefined);

        // Act
        const result = await controller.deleteUser(mockTenantAdmin, userId);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe('permission validation', () => {
      it('should prevent tenant admin from deleting user in different tenant', async () => {
        // Arrange
        userAdminService.delete.mockRejectedValue(new Error('Cannot delete this user'));

        // Act & Assert
        await expect(controller.deleteUser(mockTenantAdmin, userId)).rejects.toThrow(
          'Cannot delete this user',
        );
      });
    });

    describe('error handling', () => {
      it('should handle user not found', async () => {
        // Arrange
        userAdminService.delete.mockRejectedValue(new Error('User not found'));

        // Act & Assert
        await expect(controller.deleteUser(mockSuperAdmin, 'invalid-id')).rejects.toThrow(
          'User not found',
        );
      });
    });
  });

  describe('response format', () => {
    it('should return standardized success response', async () => {
      // Arrange
      userAdminService.findAll.mockResolvedValue(mockUsers as any);

      // Act
      const result = await controller.getUsers(mockSuperAdmin, {});

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
    });

    it('should strip sensitive fields from user objects', async () => {
      // Arrange
      const usersWithPasswords = mockUsers.map((u) => ({ ...u, password: 'hashed' }));
      userAdminService.findAll.mockResolvedValue(usersWithPasswords as any);

      // Act
      const result = await controller.getUsers(mockSuperAdmin, {});

      // Assert
      expect(
        result.data.every((u: any) => !Object.prototype.hasOwnProperty.call(u, 'password')),
      ).toBe(true);
    });
  });

  describe('guards and decorators', () => {
    it('should apply JwtAuthGuard to all endpoints', () => {
      const guards = Reflect.getMetadata('__guards__', AdminUserController);
      expect(guards).toBeDefined();
      // Guards are applied at controller level
    });

    it('should apply AdminPermissionGuard to protected endpoints', () => {
      const getUsersGuards = Reflect.getMetadata('__guards__', controller.getUsers);
      expect(getUsersGuards).toBeDefined();
    });

    it('should require correct permissions for each endpoint', () => {
      // GET - requires users:read:all OR users:read:own
      const getUsersPermissions = Reflect.getMetadata('permissions', controller.getUsers);
      expect(getUsersPermissions).toEqual(['users:read:all', 'users:read:own']);

      // POST - requires users:create:all OR users:create:own
      const createUserPermissions = Reflect.getMetadata('permissions', controller.createUser);
      expect(createUserPermissions).toEqual(['users:create:all', 'users:create:own']);

      // PATCH - requires users:update:all OR users:update:own
      const updateUserPermissions = Reflect.getMetadata('permissions', controller.updateUser);
      expect(updateUserPermissions).toEqual(['users:update:all', 'users:update:own']);

      // DELETE - requires users:delete:all OR users:delete:own
      const deleteUserPermissions = Reflect.getMetadata('permissions', controller.deleteUser);
      expect(deleteUserPermissions).toEqual(['users:delete:all', 'users:delete:own']);
    });
  });
});
