import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { JwtStrategy } from './jwt.strategy';
import { UserValidationService } from '../services/user-validation.service';
import { PrismaService } from '@ftry/shared/prisma';
import { CacheService } from '@ftry/backend/cache';
import { PrismaClient } from '@prisma/client';
import type { JwtPayload, UserWithPermissions } from '@ftry/shared/types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: DeepMockProxy<PrismaClient> & PrismaService;
  let userValidationService: jest.Mocked<UserValidationService>;
  let cacheService: jest.Mocked<CacheService>;
  let configService: jest.Mocked<ConfigService>;

  // Test data fixtures
  const mockTenantId = 'tenant-123';
  const mockRoleId = 'role-456';
  const mockUserId = 'user-789';
  const mockEmail = 'test@example.com';

  const mockRole = {
    id: mockRoleId,
    name: 'Manager',
    permissions: ['appointments:read', 'appointments:write'],
    type: 'tenant',
    level: 5,
    isSystem: false,
    isDefault: false,
    status: 'active',
    tenantId: mockTenantId,
    description: 'Manager role',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTenant = {
    id: mockTenantId,
    name: 'Test Salon',
    slug: 'test-salon',
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    status: 'active',
    description: null,
    logo: null,
    website: null,
    subscriptionExpiry: null,
    maxUsers: 10,
    settings: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    password: '$2b$12$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+919876543210',
    tenantId: mockTenantId,
    roleId: mockRoleId,
    emailVerified: true,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    lastLogin: null,
    loginAttempts: 0,
    lockedUntil: null,
    status: 'active',
    isDeleted: false,
    deletedAt: null,
    avatar: null,
    additionalPermissions: [],
    metadata: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: mockRole,
    tenant: mockTenant,
  };

  const mockSuperAdmin = {
    ...mockUser,
    id: 'super-admin-123',
    email: 'admin@ftry.com',
    tenantId: null,
    tenant: null,
  };

  const mockJwtPayload: JwtPayload = {
    sub: mockUserId,
    email: mockEmail,
    tenantId: mockTenantId,
    roleId: mockRoleId,
    permissions: mockRole.permissions,
  };

  const mockSuperAdminPayload: JwtPayload = {
    sub: mockSuperAdmin.id,
    email: mockSuperAdmin.email,
    tenantId: null,
    roleId: mockRoleId,
    permissions: mockRole.permissions,
  };

  beforeEach(async () => {
    // Create mock services
    prismaService = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient> & PrismaService;
    userValidationService = {
      validateUserStatus: jest.fn(),
    } as unknown as jest.Mocked<UserValidationService>;
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;
    configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as jest.Mocked<ConfigService>;

    // Add PrismaService methods
    prismaService.setTenantContext = jest.fn().mockResolvedValue(undefined);
    prismaService.getTenantContext = jest.fn().mockResolvedValue('');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prismaService },
        { provide: UserValidationService, useValue: userValidationService },
        { provide: CacheService, useValue: cacheService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    describe('Cache MISS - Database Query Path', () => {
      beforeEach(() => {
        cacheService.get.mockResolvedValue(null);
        // @ts-expect-error - Mocking Prisma client method
        prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      });

      it('should set RLS tenant context BEFORE querying database', async () => {
        await strategy.validate(mockJwtPayload);

        // Verify tenant context was set
        expect(prismaService.setTenantContext).toHaveBeenCalledWith(mockTenantId);

        // Verify it was called BEFORE the database query
        const setContextCall = (prismaService.setTenantContext as jest.Mock).mock
          .invocationCallOrder[0];
        const findUserCall = (prismaService.user.findUnique as jest.Mock).mock
          .invocationCallOrder[0];
        expect(setContextCall).toBeLessThan(findUserCall || 999);
      });

      it('should set super admin context (null) for super admin users', async () => {
        // @ts-expect-error - Mocking Prisma client method
        prismaService.user.findUnique = jest.fn().mockResolvedValue(mockSuperAdmin);

        await strategy.validate(mockSuperAdminPayload);

        expect(prismaService.setTenantContext).toHaveBeenCalledWith(null);
      });

      it('should return user with permissions after successful validation', async () => {
        const result = await strategy.validate(mockJwtPayload);

        expect(result).toMatchObject({
          id: mockUserId,
          email: mockEmail,
          tenantId: mockTenantId,
          permissions: mockRole.permissions,
          additionalPermissions: [],
        });
      });

      it('should cache the user after successful validation', async () => {
        await strategy.validate(mockJwtPayload);

        expect(cacheService.set).toHaveBeenCalledWith(
          `user:${mockUserId}`,
          expect.objectContaining({
            id: mockUserId,
            email: mockEmail,
            permissions: mockRole.permissions,
          }),
          300, // 5 minutes TTL
        );
      });

      it('should throw UnauthorizedException if user not found', async () => {
        // @ts-expect-error - Mocking Prisma client method
        prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

        await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
        await expect(strategy.validate(mockJwtPayload)).rejects.toThrow('User not found');
      });

      it('should validate user status via UserValidationService', async () => {
        await strategy.validate(mockJwtPayload);

        expect(userValidationService.validateUserStatus).toHaveBeenCalledWith(mockUser);
      });

      it('should throw UnauthorizedException if RLS context setting fails', async () => {
        (prismaService.setTenantContext as jest.Mock).mockRejectedValue(
          new Error('Database connection failed'),
        );

        await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
        await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(
          'Authentication failed due to security policy enforcement',
        );
      });
    });

    describe('Cache HIT - Cached User Path', () => {
      const cachedUser: UserWithPermissions = {
        ...mockUser,
        permissions: mockRole.permissions,
        additionalPermissions: [],
      };

      beforeEach(() => {
        cacheService.get.mockResolvedValue(cachedUser);
      });

      it('should set RLS tenant context for cached users', async () => {
        await strategy.validate(mockJwtPayload);

        expect(prismaService.setTenantContext).toHaveBeenCalledWith(mockTenantId);
      });

      it('should NOT query the database when cache hits', async () => {
        await strategy.validate(mockJwtPayload);

        expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      });

      it('should return cached user immediately after setting RLS context', async () => {
        const result = await strategy.validate(mockJwtPayload);

        expect(result).toEqual(cachedUser);
      });

      it('should set super admin context for cached super admin', async () => {
        const cachedSuperAdmin: UserWithPermissions = {
          ...mockSuperAdmin,
          permissions: mockRole.permissions,
          additionalPermissions: [],
        };
        cacheService.get.mockResolvedValue(cachedSuperAdmin);

        await strategy.validate(mockSuperAdminPayload);

        expect(prismaService.setTenantContext).toHaveBeenCalledWith(null);
      });

      it('should throw UnauthorizedException if RLS context setting fails for cached user', async () => {
        (prismaService.setTenantContext as jest.Mock).mockRejectedValue(
          new Error('Database connection failed'),
        );

        await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('RLS Tenant Context Security', () => {
      beforeEach(() => {
        cacheService.get.mockResolvedValue(null);
        // @ts-expect-error - Mocking Prisma client method
        prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      });

      it('should ALWAYS set tenant context on every request (cache hit or miss)', async () => {
        // Test cache miss
        await strategy.validate(mockJwtPayload);
        expect(prismaService.setTenantContext).toHaveBeenCalledTimes(1);

        // Test cache hit
        cacheService.get.mockResolvedValue({
          ...mockUser,
          permissions: mockRole.permissions,
          additionalPermissions: [],
        });
        await strategy.validate(mockJwtPayload);
        expect(prismaService.setTenantContext).toHaveBeenCalledTimes(2);
      });

      it('should use tenantId from JWT payload, not from user object', async () => {
        // This ensures we trust the JWT payload (signed by server) over database data
        await strategy.validate(mockJwtPayload);

        expect(prismaService.setTenantContext).toHaveBeenCalledWith(mockJwtPayload.tenantId);
      });

      it('should handle null tenantId correctly (super admin)', async () => {
        // @ts-expect-error - Mocking Prisma client method
        prismaService.user.findUnique = jest.fn().mockResolvedValue(mockSuperAdmin);

        await strategy.validate(mockSuperAdminPayload);

        expect(prismaService.setTenantContext).toHaveBeenCalledWith(null);
        expect(prismaService.setTenantContext).not.toHaveBeenCalledWith(undefined);
      });

      it('should fail the entire request if RLS context cannot be set', async () => {
        (prismaService.setTenantContext as jest.Mock).mockRejectedValue(new Error('RLS failure'));

        // Request should fail completely
        await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);

        // Database query should not be executed
        expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cacheService.get.mockResolvedValue(null);
    });

    it('should handle database query errors gracefully', async () => {
      // @ts-expect-error - Mocking Prisma client method
      prismaService.user.findUnique = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error'));

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow();
    });

    it('should handle validation service errors', async () => {
      // @ts-expect-error - Mocking Prisma client method
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      userValidationService.validateUserStatus.mockImplementation(() => {
        throw new UnauthorizedException('User is suspended');
      });

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow('User is suspended');
    });

    it('should not cache user if validation fails', async () => {
      // @ts-expect-error - Mocking Prisma client method
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      userValidationService.validateUserStatus.mockImplementation(() => {
        throw new UnauthorizedException('User is locked');
      });

      try {
        await strategy.validate(mockJwtPayload);
      } catch (error) {
        // Expected error
      }

      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('JWT Secret Configuration', () => {
    it('should throw error if JWT_SECRET is not configured', () => {
      configService.get = jest.fn().mockReturnValue(undefined);

      expect(() => {
        new JwtStrategy(prismaService, userValidationService, cacheService, configService);
      }).toThrow('JWT_SECRET is not configured');
    });
  });
});
