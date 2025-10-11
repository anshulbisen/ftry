import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import type { DeepMockProxy } from 'jest-mock-extended';
import { mockDeep } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import { TenantService } from './tenant.service';
import { DataScopingService } from './data-scoping.service';
import { PrismaService } from '@ftry/shared/prisma';
import type { UserWithPermissions } from '@ftry/shared/types';

describe('TenantService', () => {
  let service: TenantService;
  let prismaService: DeepMockProxy<PrismaClient>;
  let dataScopingService: jest.Mocked<DataScopingService>;

  // Mock user fixtures
  const mockSuperAdmin: UserWithPermissions = {
    id: 'super-admin-id',
    email: 'super@ftry.com',
    firstName: 'Super',
    lastName: 'Admin',
    phone: null,
    tenantId: null, // Super admin
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
      'tenants:create',
      'tenants:read:all',
      'tenants:update:all',
      'tenants:delete',
      'tenants:suspend',
    ],
    role: {} as any,
    tenant: null,
  };

  const mockTenantOwner: UserWithPermissions = {
    id: 'tenant-owner-id',
    email: 'owner@tenant1.com',
    firstName: 'Tenant',
    lastName: 'Owner',
    phone: null,
    tenantId: 'tenant-1',
    roleId: 'tenant-owner-role',
    status: 'active',
    isDeleted: false,
    password: 'hashed',
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: new Date(),
    additionalPermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: ['tenants:read:own', 'tenants:update:own'],
    role: {} as any,
    tenant: {} as any,
  };

  const mockTenants = [
    {
      id: 'tenant-1',
      name: 'Test Salon',
      slug: 'test-salon',
      status: 'active',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      maxUsers: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'tenant-2',
      name: 'Another Spa',
      slug: 'another-spa',
      status: 'active',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      maxUsers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        TenantService,
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

    service = module.get<TenantService>(TenantService);
    prismaService = module.get(PrismaService);
    dataScopingService = module.get(DataScopingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    describe('super admin access', () => {
      it('should return all tenants for super admin', async () => {
        // Arrange
        const baseQuery = {
          where: {},
          orderBy: { createdAt: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(baseQuery);
        prismaService.tenant.findMany.mockResolvedValue(mockTenants as any);

        // Act
        const result = await service.findAll(mockSuperAdmin);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockSuperAdmin,
          baseQuery,
          'tenants',
        );
        expect(result).toEqual(mockTenants);
        expect(result).toHaveLength(2);
      });

      it('should filter tenants by status for super admin', async () => {
        // Arrange
        const filters = { status: 'active' };
        const query = {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(query);
        prismaService.tenant.findMany.mockResolvedValue(mockTenants as any);

        // Act
        const result = await service.findAll(mockSuperAdmin, filters);

        // Assert
        expect(dataScopingService.scopeQuery).toHaveBeenCalledWith(
          mockSuperAdmin,
          expect.objectContaining({
            where: { status: 'active' },
          }),
          'tenants',
        );
      });
    });

    describe('tenant owner access', () => {
      it('should return only own tenant for tenant owner', async () => {
        // Arrange
        const scopedQuery = {
          where: { id: 'tenant-1' }, // Only their tenant
          orderBy: { createdAt: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(scopedQuery);
        prismaService.tenant.findMany.mockResolvedValue([mockTenants[0]] as any);

        // Act
        const result = await service.findAll(mockTenantOwner);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('tenant-1');
      });

      it('should not see other tenants', async () => {
        // Arrange
        const scopedQuery = {
          where: { id: 'tenant-1' },
          orderBy: { createdAt: 'desc' },
        };
        dataScopingService.scopeQuery.mockReturnValue(scopedQuery);
        prismaService.tenant.findMany.mockResolvedValue([mockTenants[0]] as any);

        // Act
        const result = await service.findAll(mockTenantOwner);

        // Assert
        expect(result.every((t) => t.id === 'tenant-1')).toBe(true);
        expect(result.some((t) => t.id === 'tenant-2')).toBe(false);
      });
    });

    describe('error handling', () => {
      it('should handle database errors', async () => {
        // Arrange
        dataScopingService.scopeQuery.mockReturnValue({});
        prismaService.tenant.findMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findAll(mockSuperAdmin)).rejects.toThrow('Database error');
      });

      it('should propagate ForbiddenException from scoping service', async () => {
        // Arrange
        dataScopingService.scopeQuery.mockImplementation(() => {
          throw new ForbiddenException('Insufficient permissions');
        });

        // Act & Assert
        await expect(service.findAll(mockTenantOwner)).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('create', () => {
    const createTenantDto = {
      name: 'New Salon',
      slug: 'new-salon',
      subscriptionPlan: 'premium',
      maxUsers: 15,
    };

    describe('super admin creation', () => {
      it('should allow super admin to create tenant', async () => {
        // Arrange
        const createdTenant = {
          id: 'new-tenant-id',
          ...createTenantDto,
          status: 'active',
          subscriptionStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        prismaService.tenant.create.mockResolvedValue(createdTenant as any);

        // Act
        const result = await service.create(mockSuperAdmin, createTenantDto);

        // Assert
        expect(prismaService.tenant.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: createTenantDto.name,
            slug: createTenantDto.slug,
          }),
        });
        expect(result).toEqual(createdTenant);
      });

      it('should set default values for tenant', async () => {
        // Arrange
        const createdTenant = {
          id: 'new-tenant-id',
          ...createTenantDto,
          status: 'active',
          subscriptionStatus: 'active',
        };
        prismaService.tenant.create.mockResolvedValue(createdTenant as any);

        // Act
        await service.create(mockSuperAdmin, createTenantDto);

        // Assert
        expect(prismaService.tenant.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            status: 'active',
            subscriptionStatus: 'active',
          }),
        });
      });
    });

    describe('permission validation', () => {
      it('should prevent tenant owner from creating tenants', async () => {
        // Act & Assert
        await expect(service.create(mockTenantOwner, createTenantDto)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.create(mockTenantOwner, createTenantDto)).rejects.toThrow(
          'Only super admins can create tenants',
        );
        expect(prismaService.tenant.create).not.toHaveBeenCalled();
      });
    });

    describe('slug validation', () => {
      it('should validate slug uniqueness', async () => {
        // Arrange
        prismaService.tenant.create.mockRejectedValue(
          new Error('Unique constraint failed on slug'),
        );

        // Act & Assert
        await expect(service.create(mockSuperAdmin, createTenantDto)).rejects.toThrow();
      });

      it('should ensure slug is lowercase and URL-safe', async () => {
        // Arrange
        const dtoWithUppercaseSlug = {
          ...createTenantDto,
          slug: 'NEW-SALON',
        };
        const createdTenant = {
          id: 'new-tenant-id',
          ...createTenantDto,
          slug: 'new-salon', // Should be lowercased
        };
        prismaService.tenant.create.mockResolvedValue(createdTenant as any);

        // Act
        const result = await service.create(mockSuperAdmin, dtoWithUppercaseSlug);

        // Assert
        expect(result.slug).toBe('new-salon');
      });
    });

    describe('error handling', () => {
      it('should handle database errors', async () => {
        // Arrange
        prismaService.tenant.create.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.create(mockSuperAdmin, createTenantDto)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('update', () => {
    const tenantId = 'tenant-1';
    const updateDto = {
      name: 'Updated Salon Name',
      maxUsers: 20,
    };

    const existingTenant = {
      id: tenantId,
      name: 'Test Salon',
      slug: 'test-salon',
      status: 'active',
      subscriptionPlan: 'premium',
    };

    describe('super admin updates', () => {
      it('should allow super admin to update any tenant', async () => {
        // Arrange
        prismaService.tenant.findUnique.mockResolvedValue(existingTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        const updatedTenant = { ...existingTenant, ...updateDto };
        prismaService.tenant.update.mockResolvedValue(updatedTenant as any);

        // Act
        const result = await service.update(mockSuperAdmin, tenantId, updateDto);

        // Assert
        expect(prismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: tenantId },
          data: updateDto,
        });
        expect(result).toEqual(updatedTenant);
      });
    });

    describe('tenant owner updates', () => {
      it('should allow tenant owner to update their own tenant', async () => {
        // Arrange
        prismaService.tenant.findUnique.mockResolvedValue(existingTenant as any);
        dataScopingService.canAccessEntity
          .mockReturnValueOnce(false) // tenants:update:all = false
          .mockReturnValueOnce(true); // tenants:update:own = true
        const updatedTenant = { ...existingTenant, ...updateDto };
        prismaService.tenant.update.mockResolvedValue(updatedTenant as any);

        // Act
        const result = await service.update(mockTenantOwner, tenantId, updateDto);

        // Assert
        expect(result).toEqual(updatedTenant);
      });

      it('should prevent tenant owner from updating other tenants', async () => {
        // Arrange
        const otherTenant = { ...existingTenant, id: 'tenant-2' };
        prismaService.tenant.findUnique.mockResolvedValue(otherTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(false);

        // Act & Assert
        await expect(service.update(mockTenantOwner, 'tenant-2', updateDto)).rejects.toThrow(
          ForbiddenException,
        );
        expect(prismaService.tenant.update).not.toHaveBeenCalled();
      });
    });

    describe('validation', () => {
      it('should throw NotFoundException if tenant does not exist', async () => {
        // Arrange
        prismaService.tenant.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.update(mockSuperAdmin, tenantId, updateDto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should prevent updating slug to existing slug', async () => {
        // Arrange
        prismaService.tenant.findUnique.mockResolvedValue(existingTenant as any);
        dataScopingService.canAccessEntity.mockReturnValue(true);
        prismaService.tenant.update.mockRejectedValue(
          new Error('Unique constraint failed on slug'),
        );

        // Act & Assert
        await expect(
          service.update(mockSuperAdmin, tenantId, { slug: 'existing-slug' }),
        ).rejects.toThrow();
      });
    });
  });

  describe('suspend', () => {
    const tenantId = 'tenant-1';

    describe('super admin suspension', () => {
      it('should allow super admin to suspend tenant', async () => {
        // Arrange
        const activeTenant = {
          id: tenantId,
          name: 'Test Salon',
          status: 'active',
          subscriptionStatus: 'active',
        };
        prismaService.tenant.findUnique.mockResolvedValue(activeTenant as any);
        const suspendedTenant = {
          ...activeTenant,
          status: 'suspended',
          subscriptionStatus: 'suspended',
        };
        prismaService.tenant.update.mockResolvedValue(suspendedTenant as any);

        // Act
        const result = await service.suspend(mockSuperAdmin, tenantId);

        // Assert
        expect(prismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: tenantId },
          data: {
            status: 'suspended',
            subscriptionStatus: 'suspended',
          },
        });
        expect(result.status).toBe('suspended');
      });

      it('should throw BadRequestException if tenant is already suspended', async () => {
        // Arrange
        const suspendedTenant = {
          id: tenantId,
          status: 'suspended',
        };
        prismaService.tenant.findUnique.mockResolvedValue(suspendedTenant as any);

        // Act & Assert
        await expect(service.suspend(mockSuperAdmin, tenantId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.suspend(mockSuperAdmin, tenantId)).rejects.toThrow(
          'Tenant is already suspended',
        );
      });
    });

    describe('permission validation', () => {
      it('should prevent tenant owner from suspending their tenant', async () => {
        // Arrange - tenant owner lacks 'tenants:suspend' permission

        // Act & Assert
        await expect(service.suspend(mockTenantOwner, tenantId)).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.suspend(mockTenantOwner, tenantId)).rejects.toThrow(
          'Only super admins can suspend tenants',
        );
      });
    });

    describe('cascading effects', () => {
      it('should document that suspending tenant affects all tenant users', async () => {
        // Note: This is handled at the application/auth layer
        // When a user tries to authenticate, their tenant status is checked
        // If tenant is suspended, login is denied
        // This test documents the expected behavior

        // Arrange
        const activeTenant = {
          id: tenantId,
          status: 'active',
        };
        prismaService.tenant.findUnique.mockResolvedValue(activeTenant as any);
        prismaService.tenant.update.mockResolvedValue({
          ...activeTenant,
          status: 'suspended',
        } as any);

        // Act
        await service.suspend(mockSuperAdmin, tenantId);

        // Assert - Tenant is now suspended
        expect(prismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: tenantId },
          data: expect.objectContaining({
            status: 'suspended',
          }),
        });
      });
    });
  });

  describe('activate', () => {
    const tenantId = 'tenant-1';

    describe('super admin activation', () => {
      it('should allow super admin to activate suspended tenant', async () => {
        // Arrange
        const suspendedTenant = {
          id: tenantId,
          name: 'Test Salon',
          status: 'suspended',
          subscriptionStatus: 'suspended',
        };
        prismaService.tenant.findUnique.mockResolvedValue(suspendedTenant as any);
        const activatedTenant = {
          ...suspendedTenant,
          status: 'active',
          subscriptionStatus: 'active',
        };
        prismaService.tenant.update.mockResolvedValue(activatedTenant as any);

        // Act
        const result = await service.activate(mockSuperAdmin, tenantId);

        // Assert
        expect(prismaService.tenant.update).toHaveBeenCalledWith({
          where: { id: tenantId },
          data: {
            status: 'active',
            subscriptionStatus: 'active',
          },
        });
        expect(result.status).toBe('active');
      });

      it('should throw BadRequestException if tenant is already active', async () => {
        // Arrange
        const activeTenant = {
          id: tenantId,
          status: 'active',
        };
        prismaService.tenant.findUnique.mockResolvedValue(activeTenant as any);

        // Act & Assert
        await expect(service.activate(mockSuperAdmin, tenantId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.activate(mockSuperAdmin, tenantId)).rejects.toThrow(
          'Tenant is already active',
        );
      });
    });

    describe('permission validation', () => {
      it('should prevent tenant owner from activating their tenant', async () => {
        // Act & Assert
        await expect(service.activate(mockTenantOwner, tenantId)).rejects.toThrow(
          ForbiddenException,
        );
      });
    });
  });

  describe('delete', () => {
    const tenantId = 'tenant-1';

    describe('super admin deletion', () => {
      it('should allow super admin to delete tenant', async () => {
        // Arrange
        const existingTenant = {
          id: tenantId,
          name: 'Test Salon',
          status: 'active',
          _count: { users: 0 }, // No users
        };
        prismaService.tenant.findUnique.mockResolvedValue(existingTenant as any);
        prismaService.tenant.delete.mockResolvedValue(existingTenant as any);

        // Act
        await service.delete(mockSuperAdmin, tenantId);

        // Assert
        expect(prismaService.tenant.delete).toHaveBeenCalledWith({
          where: { id: tenantId },
        });
      });

      it('should prevent deletion of tenant with active users', async () => {
        // Arrange
        const tenantWithUsers = {
          id: tenantId,
          name: 'Test Salon',
          _count: { users: 5 }, // Has users
        };
        prismaService.tenant.findUnique.mockResolvedValue(tenantWithUsers as any);

        // Act & Assert
        await expect(service.delete(mockSuperAdmin, tenantId)).rejects.toThrow(BadRequestException);
        await expect(service.delete(mockSuperAdmin, tenantId)).rejects.toThrow(
          'Cannot delete tenant with active users',
        );
        expect(prismaService.tenant.delete).not.toHaveBeenCalled();
      });
    });

    describe('permission validation', () => {
      it('should prevent tenant owner from deleting their tenant', async () => {
        // Act & Assert
        await expect(service.delete(mockTenantOwner, tenantId)).rejects.toThrow(ForbiddenException);
      });
    });

    describe('validation', () => {
      it('should throw NotFoundException if tenant does not exist', async () => {
        // Arrange
        prismaService.tenant.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete(mockSuperAdmin, tenantId)).rejects.toThrow(NotFoundException);
      });
    });
  });
});
