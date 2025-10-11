import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { DeepMockProxy } from 'jest-mock-extended';
import { mockDeep } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { PermissionService } from './permission.service';
import { PrismaService } from '@ftry/shared/prisma';
import { NotFoundException } from '@nestjs/common';

describe('PermissionService', () => {
  let service: PermissionService;
  let prismaService: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const mockPrisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should use PostgreSQL unnest for efficient permission extraction', async () => {
      // Arrange - Mock raw query result
      const mockPermissions = [
        { permission: 'users:create:all' },
        { permission: 'users:read:all' },
        { permission: 'users:update:all' },
        { permission: 'tenants:create:all' },
        { permission: 'tenants:read:all' },
      ];

      prismaService.$queryRaw.mockResolvedValue(mockPermissions);

      // Act
      const result = await service.findAll();

      // Assert
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);

      // Verify grouped structure
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check that results are grouped by resource
      const usersGroup = result.find((group) => group.resource === 'users');
      expect(usersGroup).toBeDefined();
      expect(usersGroup?.permissions).toHaveLength(3);
      expect(usersGroup?.permissions).toContain('users:create:all');

      const tenantsGroup = result.find((group) => group.resource === 'tenants');
      expect(tenantsGroup).toBeDefined();
      expect(tenantsGroup?.permissions).toHaveLength(2);
    });

    it('should handle empty permissions array', async () => {
      // Arrange
      prismaService.$queryRaw.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle permissions with unknown resource format', async () => {
      // Arrange
      const mockPermissions = [
        { permission: 'users:read:all' },
        { permission: 'invalid-permission' },
      ];
      prismaService.$queryRaw.mockResolvedValue(mockPermissions);

      // Act
      const result = await service.findAll();

      // Assert - Should still process valid permissions
      expect(result).toBeInstanceOf(Array);
      const usersGroup = result.find((group) => group.resource === 'users');
      expect(usersGroup).toBeDefined();
    });

    it('should sort permissions within each resource group', async () => {
      // Arrange
      const mockPermissions = [
        { permission: 'users:update:all' },
        { permission: 'users:create:all' },
        { permission: 'users:read:all' },
      ];
      prismaService.$queryRaw.mockResolvedValue(mockPermissions);

      // Act
      const result = await service.findAll();

      // Assert
      const usersGroup = result.find((group) => group.resource === 'users');
      expect(usersGroup?.permissions).toEqual([
        'users:create:all',
        'users:read:all',
        'users:update:all',
      ]);
    });

    it('should handle database errors', async () => {
      // Arrange
      prismaService.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByCategory', () => {
    it('should filter permissions by category/resource', async () => {
      // Arrange
      const mockPermissions = [
        { permission: 'users:create:all' },
        { permission: 'users:read:all' },
        { permission: 'tenants:read:all' },
      ];
      prismaService.$queryRaw.mockResolvedValue(mockPermissions);

      // Act
      const result = await service.findByCategory('users');

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].resource).toBe('users');
      expect(result[0].permissions).toHaveLength(2);
    });

    it('should return empty array for non-existent category', async () => {
      // Arrange
      prismaService.$queryRaw.mockResolvedValue([]);

      // Act
      const result = await service.findByCategory('non-existent');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for a valid role', async () => {
      // Arrange
      const mockRole = {
        id: 'role-1',
        name: 'Admin',
        type: 'system',
        permissions: ['users:read:all', 'users:create:all'],
      };
      prismaService.role.findUnique.mockResolvedValue(mockRole);

      // Act
      const result = await service.getRolePermissions('role-1');

      // Assert
      expect(result).toEqual({
        roleId: 'role-1',
        roleName: 'Admin',
        roleType: 'system',
        permissions: ['users:read:all', 'users:create:all'],
      });
    });

    it('should throw NotFoundException for non-existent role', async () => {
      // Arrange
      prismaService.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRolePermissions('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserPermissions', () => {
    it('should combine role and additional permissions', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        role: {
          id: 'role-1',
          name: 'Manager',
          permissions: ['users:read:all', 'users:create:own'],
        },
        additionalPermissions: ['tenants:read:all', 'users:read:all'], // Duplicate
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserPermissions('user-1');

      // Assert
      expect(result.permissions).toEqual([
        'tenants:read:all',
        'users:create:own',
        'users:read:all',
      ]);
      // Should deduplicate and sort
    });

    it('should handle user with no additional permissions', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        role: {
          id: 'role-1',
          name: 'Manager',
          permissions: ['users:read:all'],
        },
        additionalPermissions: [],
      };
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserPermissions('user-1');

      // Assert
      expect(result.permissions).toEqual(['users:read:all']);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserPermissions('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
