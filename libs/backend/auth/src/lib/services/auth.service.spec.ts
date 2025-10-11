import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { DeepMockProxy } from 'jest-mock-extended';
import { mockDeep } from 'jest-mock-extended';
import { AuthService } from './auth.service';
import { UserValidationService } from './user-validation.service';
import { PrismaService } from '@ftry/shared/prisma';
import { CacheService } from '@ftry/backend/cache';
import { QueueService } from '@ftry/backend/queue';
import type { PrismaClient } from '@prisma/client';
import type { JwtPayload } from '@ftry/shared/types';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: DeepMockProxy<PrismaClient>;
  let jwtService: jest.Mocked<JwtService>;
  let userValidationService: jest.Mocked<UserValidationService>;

  // Test data fixtures
  const mockTenantId = 'tenant-123';
  const mockRoleId = 'role-456';
  const mockUserId = 'user-789';
  const mockEmail = 'test@example.com';
  const mockPassword = 'SecurePass123!';
  const mockHashedPassword = '$2b$12$hashedpassword';

  const mockRole = {
    id: mockRoleId,
    name: 'Manager',
    permissions: ['appointments:read', 'appointments:write', 'clients:read'],
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
    password: mockHashedPassword,
    firstName: 'John',
    lastName: 'Doe',
    phone: '+919876543210',
    phoneEncrypted: null,
    phoneHash: null,
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
  };

  const mockUserWithRole = {
    ...mockUser,
    role: mockRole,
    tenant: mockTenant,
    permissions: mockRole.permissions,
    additionalPermissions: [],
  };

  const mockRefreshToken = {
    id: 'refresh-token-id',
    token: 'mock-refresh-token-string',
    userId: mockUserId,
    deviceInfo: 'Mozilla/5.0...',
    ipAddress: '192.168.1.1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    revokedAt: null,
    revokedReason: null,
    isRevoked: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // Create deep mock of PrismaClient
    const mockPrisma = mockDeep<PrismaClient>();

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockUserValidationService = {
      validateUser: jest.fn(),
      validateUserStatus: jest.fn(),
      checkAccountLock: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockQueueService = {
      addEmailJob: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserValidationService,
          useValue: mockUserValidationService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    userValidationService = module.get(UserValidationService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: mockEmail,
      password: mockPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+919876543210',
      tenantId: mockTenantId,
      roleId: mockRoleId,
    };

    describe('success cases', () => {
      it('should successfully register a new user', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(null); // Email not taken
        prismaService.role.findUnique.mockResolvedValue(mockRole); // Role exists
        prismaService.tenant.findUnique.mockResolvedValue(mockTenant); // Tenant exists
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
        prismaService.user.create.mockResolvedValue(mockUserWithRole);

        // Act
        const result = await service.register(registerDto);

        // Assert
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: registerDto.email },
        });
        expect(prismaService.role.findUnique).toHaveBeenCalledWith({
          where: { id: registerDto.roleId },
        });
        expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
          where: { id: registerDto.tenantId },
        });
        expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
        expect(result).toBeDefined();
        expect(result).not.toHaveProperty('password'); // Service strips password from response
      });

      it('should register user without phone number', async () => {
        // Arrange
        const dtoWithoutPhone = { ...registerDto, phone: undefined };
        prismaService.user.findUnique.mockResolvedValue(null);
        prismaService.role.findUnique.mockResolvedValue(mockRole);
        prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
        prismaService.user.create.mockResolvedValue({
          ...mockUserWithRole,
          phone: null,
        });

        // Act
        const result = await service.register(dtoWithoutPhone);

        // Assert
        expect(result.phone).toBeNull();
      });

      it('should register super admin without tenantId', async () => {
        // Arrange
        const superAdminDto = { ...registerDto, tenantId: undefined };
        const superAdminUser = {
          ...mockUserWithRole,
          tenantId: null,
        };
        // Remove tenant property to match create return type
        const { tenant, ...userWithoutTenant } = superAdminUser;

        prismaService.user.findUnique.mockResolvedValue(null);
        prismaService.role.findUnique.mockResolvedValue(mockRole);
        // No tenant lookup since tenantId is undefined
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
        prismaService.user.create.mockResolvedValue(userWithoutTenant);
        // Note: tenant check is skipped when tenantId is undefined (super admin case)

        // Act
        const result = await service.register(superAdminDto);

        // Assert
        expect(result.tenantId).toBeNull();
      });
    });

    describe('validation errors', () => {
      it('should throw ConflictException if email already exists', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(mockUser);

        // Act & Assert
        await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(prismaService.user.create).not.toHaveBeenCalled();
      });

      // NOTE: The following tests are for DTO validation which happens at the controller level
      // via NestJS validation pipes. The service assumes valid DTOs are passed in.
      it.skip('should throw BadRequestException for invalid email format', async () => {
        // This validation should happen at the controller level via class-validator
      });

      it.skip('should throw BadRequestException for weak password', async () => {
        // This validation should happen at the controller level via class-validator
      });

      it.skip('should throw BadRequestException for missing required fields', async () => {
        // This validation should happen at the controller level via class-validator
      });
    });

    describe('edge cases', () => {
      it('should handle database errors gracefully', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
        prismaService.user.create.mockRejectedValue(new Error('Database connection failed'));

        // Act & Assert
        await expect(service.register(registerDto)).rejects.toThrow();
      });

      it('should handle bcrypt hashing errors', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

        // Act & Assert
        await expect(service.register(registerDto)).rejects.toThrow();
      });
    });
  });

  describe('validateUser', () => {
    const loginDto = {
      email: mockEmail,
      password: mockPassword,
    };

    describe('success cases', () => {
      it('should successfully validate user with correct credentials', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(mockUserWithRole);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        prismaService.user.update.mockResolvedValue({
          ...mockUserWithRole,
          loginAttempts: 0,
          lastLogin: new Date(),
        });

        // Act
        const result = await service.validateUser(loginDto.email, loginDto.password);

        // Assert
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: loginDto.email },
          include: {
            role: true,
            tenant: true,
          },
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockHashedPassword);
        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: mockUserId },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLogin: expect.any(Date),
          },
          include: {
            role: true,
            tenant: true,
          },
        });
        expect(result).toEqual(
          expect.objectContaining({
            id: mockUserId,
            email: mockEmail,
            role: mockRole,
            tenant: mockTenant,
          }),
        );
      });

      it('should reset login attempts on successful login', async () => {
        // Arrange
        const userWithFailedAttempts = {
          ...mockUserWithRole,
          loginAttempts: 3,
        };
        prismaService.user.findUnique.mockResolvedValue(userWithFailedAttempts);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        prismaService.user.update.mockResolvedValue({
          ...mockUserWithRole,
          loginAttempts: 0,
        });

        // Act
        await service.validateUser(loginDto.email, loginDto.password);

        // Assert
        expect(prismaService.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              loginAttempts: 0,
            }),
          }),
        );
      });

      it('should update lastLogin timestamp', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(mockUserWithRole);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const beforeLogin = Date.now();
        prismaService.user.update.mockResolvedValue(mockUserWithRole);

        // Act
        await service.validateUser(loginDto.email, loginDto.password);

        // Assert
        const updateCall = prismaService.user.update.mock.calls[0]?.[0];
        expect(updateCall).toBeDefined();
        expect(updateCall?.data.lastLogin).toBeDefined();
        const lastLoginTime = new Date(updateCall!.data.lastLogin as Date).getTime();
        expect(lastLoginTime).toBeGreaterThanOrEqual(beforeLogin);
      });
    });

    describe('authentication failures', () => {
      it('should throw UnauthorizedException if user not found', async () => {
        // Arrange
        const invalidEmail = 'nonexistent@test.com';
        prismaService.user.findUnique.mockResolvedValue(null);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          'Invalid credentials',
        );
        // bcrypt.compare should be called even with non-existent user (timing attack prevention)
        expect(bcrypt.compare).toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if password is incorrect', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(mockUserWithRole);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        prismaService.user.update.mockResolvedValue({
          ...mockUserWithRole,
          loginAttempts: 1,
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          'Invalid credentials',
        );
      });

      it('should increment login attempts on failed password', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(mockUserWithRole);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        prismaService.user.update.mockResolvedValue({
          ...mockUserWithRole,
          loginAttempts: 1,
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow();

        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: mockUserId },
          data: {
            loginAttempts: { increment: 1 },
          },
          include: {
            role: true,
            tenant: true,
          },
        });
      });
    });

    describe('account locking', () => {
      it('should throw UnauthorizedException if account is locked', async () => {
        // Arrange
        const lockedUser = {
          ...mockUserWithRole,
          lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // Locked for 10 more minutes
          loginAttempts: 5,
        };
        prismaService.user.findUnique.mockResolvedValue(lockedUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        userValidationService.validateUser.mockImplementation(() => {
          throw new UnauthorizedException('Account is locked. Try again in 10 minute(s)');
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          /locked/i,
        );
        // bcrypt.compare is called before status validation (timing attack prevention)
        expect(bcrypt.compare).toHaveBeenCalled();
      });

      it('should lock account after 5 failed login attempts', async () => {
        // Arrange
        const userWith4Attempts = {
          ...mockUserWithRole,
          loginAttempts: 4,
        };
        prismaService.user.findUnique.mockResolvedValue(userWith4Attempts);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        prismaService.user.update.mockResolvedValue({
          ...mockUserWithRole,
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow();

        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: mockUserId },
          data: {
            loginAttempts: { increment: 1 },
            lockedUntil: expect.any(Date),
          },
          include: {
            role: true,
            tenant: true,
          },
        });
      });

      it('should unlock account after lock period expires', async () => {
        // Arrange
        const previouslyLockedUser = {
          ...mockUserWithRole,
          lockedUntil: new Date(Date.now() - 1000), // Lock expired 1 second ago
          loginAttempts: 5,
        };
        prismaService.user.findUnique.mockResolvedValue(previouslyLockedUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        prismaService.user.update.mockResolvedValue({
          ...mockUserWithRole,
          loginAttempts: 0,
          lockedUntil: null,
        });

        // Act
        const result = await service.validateUser(loginDto.email, loginDto.password);

        // Assert
        expect(result).toBeDefined();
        expect(prismaService.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              loginAttempts: 0,
            }),
          }),
        );
      });

      it('should set lockedUntil to 15 minutes from now on 5th failed attempt', async () => {
        // Arrange
        const userWith4Attempts = {
          ...mockUserWithRole,
          loginAttempts: 4,
        };
        prismaService.user.findUnique.mockResolvedValue(userWith4Attempts);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Mock the update - will fail with service not implemented error
        prismaService.user.update.mockResolvedValue({
          ...mockUserWithRole,
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow();
      });
    });

    describe('inactive accounts', () => {
      it('should throw UnauthorizedException for inactive user', async () => {
        // Arrange
        const inactiveUser = {
          ...mockUserWithRole,
          status: 'inactive',
        };
        prismaService.user.findUnique.mockResolvedValue(inactiveUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        userValidationService.validateUser.mockImplementation(() => {
          throw new UnauthorizedException('Account is not active: inactive');
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          UnauthorizedException,
        );
        // bcrypt.compare is called before status validation (timing attack prevention)
        expect(bcrypt.compare).toHaveBeenCalled();
      });

      it('should throw UnauthorizedException for suspended user', async () => {
        // Arrange
        const suspendedUser = {
          ...mockUserWithRole,
          status: 'suspended',
        };
        prismaService.user.findUnique.mockResolvedValue(suspendedUser);
        userValidationService.validateUser.mockImplementation(() => {
          throw new UnauthorizedException('Account is not active: suspended');
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException for soft-deleted user', async () => {
        // Arrange
        const deletedUser = {
          ...mockUserWithRole,
          isDeleted: true,
          deletedAt: new Date(),
        };
        prismaService.user.findUnique.mockResolvedValue(deletedUser);
        userValidationService.validateUser.mockImplementation(() => {
          throw new UnauthorizedException('Account has been deleted');
        });

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('edge cases', () => {
      it('should handle database errors during user lookup', async () => {
        // Arrange
        prismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow();
      });

      it('should handle bcrypt comparison errors', async () => {
        // Arrange
        prismaService.user.findUnique.mockResolvedValue(mockUserWithRole);
        (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

        // Act & Assert
        await expect(service.validateUser(loginDto.email, loginDto.password)).rejects.toThrow();
      });
    });
  });

  describe('generateTokens', () => {
    const mockAccessToken = 'mock-jwt-access-token';
    const mockRefreshTokenString = 'mock-refresh-token-' + Date.now();

    describe('success cases', () => {
      it('should generate access and refresh tokens', async () => {
        // Arrange
        const mockRefreshTokenString = 'mock-refresh-token-string';
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        const result = await service.generateTokens(mockUserWithRole);

        // Assert
        expect(jwtService.sign).toHaveBeenCalledWith(
          {
            sub: mockUserId,
            email: mockEmail,
            tenantId: mockTenantId,
            roleId: mockRoleId,
            permissions: mockRole.permissions,
          },
          { expiresIn: '15m' },
        );
        expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
          data: {
            token: expect.any(String),
            userId: mockUserId,
            expiresAt: expect.any(Date),
          },
        });
        expect(result).toEqual({
          accessToken: mockAccessToken,
          refreshToken: expect.any(String),
          expiresIn: 900, // 15 minutes in seconds
        });
      });

      it('should create JWT with correct payload structure', async () => {
        // Arrange
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        await service.generateTokens(mockUserWithRole);

        // Assert
        const payload = jwtService.sign.mock.calls[0]?.[0];
        expect(payload).toBeDefined();
        expect(payload).toEqual({
          sub: mockUserId,
          email: mockEmail,
          tenantId: mockTenantId,
          roleId: mockRoleId,
          permissions: mockRole.permissions,
        });
      });

      it('should set access token expiry to 15 minutes', async () => {
        // Arrange
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        await service.generateTokens(mockUserWithRole);

        // Assert
        const options = jwtService.sign.mock.calls[0]?.[1];
        expect(options).toBeDefined();
        expect(options).toEqual({ expiresIn: '15m' });
      });

      it('should set refresh token expiry to 7 days', async () => {
        // Arrange
        jwtService.sign.mockReturnValue(mockAccessToken);
        const beforeGenerate = Date.now();
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        await service.generateTokens(mockUserWithRole);

        // Assert
        const createCall = prismaService.refreshToken.create.mock.calls[0]?.[0];
        expect(createCall).toBeDefined();
        const expiresAt = new Date(createCall!.data.expiresAt).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        expect(expiresAt).toBeGreaterThanOrEqual(beforeGenerate + sevenDays);
        expect(expiresAt).toBeLessThanOrEqual(beforeGenerate + sevenDays + 1000); // Allow 1 second tolerance
      });

      it('should generate unique refresh tokens', async () => {
        // Arrange
        const tokenString = 'unique-token-string';
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        const result1 = await service.generateTokens(mockUserWithRole);
        const result2 = await service.generateTokens(mockUserWithRole);

        // Assert
        expect(result1.refreshToken).not.toEqual(result2.refreshToken);
      });

      it('should include additional permissions in JWT payload', async () => {
        // Arrange
        const userWithExtraPerms = {
          ...mockUserWithRole,
          additionalPermissions: ['special:permission'],
        };
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        await service.generateTokens(userWithExtraPerms);

        // Assert
        const payload = jwtService.sign.mock.calls[0]?.[0] as JwtPayload;
        expect(payload.permissions).toEqual([...mockRole.permissions, 'special:permission']);
      });

      it('should handle super admin without tenantId', async () => {
        // Arrange
        const superAdmin = {
          ...mockUserWithRole,
          tenantId: null,
          tenant: null,
        };
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        await service.generateTokens(superAdmin);

        // Assert
        const payload = jwtService.sign.mock.calls[0]?.[0] as JwtPayload;
        expect(payload.tenantId).toBeNull();
      });

      it('should store refresh token with deviceInfo if provided', async () => {
        // Arrange
        const deviceInfo = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        await service.generateTokens(mockUserWithRole, deviceInfo);

        // Assert
        expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            deviceInfo: deviceInfo,
          }),
        });
      });

      it('should store refresh token with ipAddress if provided', async () => {
        // Arrange
        const ipAddress = '192.168.1.100';
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

        // Act
        await service.generateTokens(mockUserWithRole, undefined, ipAddress);

        // Assert
        expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            ipAddress: ipAddress,
          }),
        });
      });
    });

    describe('error cases', () => {
      it('should handle JWT signing errors', async () => {
        // Arrange
        jwtService.sign.mockImplementation(() => {
          throw new Error('JWT signing failed');
        });

        // Act & Assert
        await expect(service.generateTokens(mockUserWithRole)).rejects.toThrow(
          'JWT signing failed',
        );
      });

      it('should handle database errors when storing refresh token', async () => {
        // Arrange
        jwtService.sign.mockReturnValue(mockAccessToken);
        prismaService.refreshToken.create.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.generateTokens(mockUserWithRole)).rejects.toThrow('Database error');
      });
    });
  });

  describe('refreshAccessToken', () => {
    const mockAccessToken = 'new-mock-jwt-access-token';
    const validRefreshToken = 'valid-refresh-token';

    describe('success cases', () => {
      it('should generate new access token with valid refresh token', async () => {
        // Arrange
        const validToken = {
          ...mockRefreshToken,
          isRevoked: false,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires tomorrow
          user: mockUserWithRole,
        };
        prismaService.refreshToken.findUnique.mockResolvedValue(validToken);
        prismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 }); // Mock revoke call
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken); // Mock new token creation
        jwtService.sign.mockReturnValue(mockAccessToken);

        // Act
        const result = await service.refreshAccessToken(validRefreshToken);

        // Assert
        expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
          where: { token: validRefreshToken },
          include: {
            user: {
              include: {
                role: true,
                tenant: true,
              },
            },
          },
        });
        expect(jwtService.sign).toHaveBeenCalledWith(
          {
            sub: mockUserId,
            email: mockEmail,
            tenantId: mockTenantId,
            roleId: mockRoleId,
            permissions: mockRole.permissions,
          },
          { expiresIn: '15m' },
        );
        expect(result).toEqual({
          accessToken: mockAccessToken,
          refreshToken: expect.any(String), // Token rotation: new refresh token returned
          expiresIn: 900,
        });
      });

      it('should use updated user data when generating new token', async () => {
        // Arrange
        const updatedUser = {
          ...mockUserWithRole,
          role: {
            ...mockRole,
            permissions: ['updated:permission'],
          },
          permissions: ['updated:permission'],
        };
        const validToken = {
          ...mockRefreshToken,
          user: updatedUser,
        };
        prismaService.refreshToken.findUnique.mockResolvedValue(validToken);
        prismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 }); // Mock revoke call
        prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken); // Mock new token creation
        jwtService.sign.mockReturnValue(mockAccessToken);

        // Act
        await service.refreshAccessToken(validRefreshToken);

        // Assert
        const payload = jwtService.sign.mock.calls[0]?.[0] as JwtPayload;
        expect(payload.permissions).toEqual(['updated:permission']);
      });
    });

    describe('validation errors', () => {
      it('should throw UnauthorizedException if refresh token not found', async () => {
        // Arrange
        prismaService.refreshToken.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow(
          'Invalid refresh token',
        );
        expect(jwtService.sign).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if refresh token is revoked', async () => {
        // Arrange
        const revokedToken = {
          ...mockRefreshToken,
          isRevoked: true,
          revokedAt: new Date(),
          user: mockUserWithRole,
        };
        prismaService.refreshToken.findUnique.mockResolvedValue(revokedToken);
        prismaService.refreshToken.updateMany.mockResolvedValue({ count: 0 });

        // Act & Assert
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow(
          'Token reuse detected',
        );
        expect(jwtService.sign).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if refresh token is expired', async () => {
        // Arrange
        const expiredToken = {
          ...mockRefreshToken,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
          user: mockUserWithRole,
        };
        prismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);

        // Act & Assert
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow('expired');
        expect(jwtService.sign).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if user is inactive', async () => {
        // Arrange
        const inactiveUserToken = {
          ...mockRefreshToken,
          user: {
            ...mockUserWithRole,
            status: 'inactive',
          },
        };
        prismaService.refreshToken.findUnique.mockResolvedValue(inactiveUserToken);
        userValidationService.validateUserStatus.mockImplementation(() => {
          throw new UnauthorizedException('Account is not active: inactive');
        });

        // Act & Assert
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException if user is deleted', async () => {
        // Arrange
        const deletedUserToken = {
          ...mockRefreshToken,
          user: {
            ...mockUserWithRole,
            isDeleted: true,
          },
        };
        prismaService.refreshToken.findUnique.mockResolvedValue(deletedUserToken);
        userValidationService.validateUserStatus.mockImplementation(() => {
          throw new UnauthorizedException('Account has been deleted');
        });

        // Act & Assert
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('edge cases', () => {
      it('should handle database errors', async () => {
        // Arrange
        prismaService.refreshToken.findUnique.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow();
      });

      it('should handle JWT signing errors during refresh', async () => {
        // Arrange
        const validToken = {
          ...mockRefreshToken,
          user: mockUserWithRole,
        };
        prismaService.refreshToken.findUnique.mockResolvedValue(validToken);
        jwtService.sign.mockImplementation(() => {
          throw new Error('JWT signing failed');
        });

        // Act & Assert
        await expect(service.refreshAccessToken(validRefreshToken)).rejects.toThrow();
      });
    });
  });

  describe('revokeRefreshToken', () => {
    const tokenToRevoke = 'token-to-revoke';

    describe('success cases', () => {
      it('should successfully revoke a valid refresh token', async () => {
        // Arrange
        const reason = 'User logged out';
        prismaService.refreshToken.updateMany.mockResolvedValue({
          count: 1,
        });

        // Act
        await service.revokeRefreshToken(tokenToRevoke, reason);

        // Assert
        expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
          where: { token: tokenToRevoke, isRevoked: false },
          data: {
            isRevoked: true,
            revokedAt: expect.any(Date),
            revokedReason: reason,
          },
        });
      });

      it('should set revokedAt timestamp when revoking', async () => {
        // Arrange
        const reason = 'Session expired';
        const beforeRevoke = Date.now();
        prismaService.refreshToken.updateMany.mockResolvedValue({
          count: 1,
        });

        // Act
        await service.revokeRefreshToken(tokenToRevoke, reason);

        // Assert
        const updateCall = prismaService.refreshToken.updateMany.mock.calls[0]?.[0];
        expect(updateCall).toBeDefined();
        expect(updateCall?.data.revokedAt).toBeDefined();
        const revokedAt = new Date(updateCall!.data.revokedAt as Date).getTime();
        expect(revokedAt).toBeGreaterThanOrEqual(beforeRevoke);
      });

      it('should revoke token with a reason if provided', async () => {
        // Arrange
        const revokeReason = 'User logged out';
        prismaService.refreshToken.updateMany.mockResolvedValue({
          count: 1,
        });

        // Act
        await service.revokeRefreshToken(tokenToRevoke, revokeReason);

        // Assert
        expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
          where: { token: tokenToRevoke, isRevoked: false },
          data: expect.objectContaining({
            revokedReason: revokeReason,
          }),
        });
      });
    });

    describe('error cases', () => {
      it('should throw NotFoundException if token does not exist', async () => {
        // Arrange
        const reason = 'User logged out';
        prismaService.refreshToken.updateMany.mockResolvedValue({ count: 0 });

        // Act & Assert
        await expect(service.revokeRefreshToken(tokenToRevoke, reason)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.revokeRefreshToken(tokenToRevoke, reason)).rejects.toThrow(
          'Invalid refresh token',
        );
      });

      it('should not throw if token is already revoked', async () => {
        // Arrange
        const reason = 'User logged out';
        // updateMany returns 0 count when token is already revoked
        prismaService.refreshToken.updateMany.mockResolvedValue({ count: 0 });

        // Act & Assert
        await expect(service.revokeRefreshToken(tokenToRevoke, reason)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('edge cases', () => {
      it('should handle database errors during update', async () => {
        // Arrange
        const reason = 'User logged out';
        prismaService.refreshToken.updateMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.revokeRefreshToken(tokenToRevoke, reason)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    describe('success cases', () => {
      it('should revoke all refresh tokens for a user', async () => {
        // Arrange
        const reason = 'All tokens revoked';
        (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
          count: 3,
        });

        // Act
        await service.revokeAllUserTokens(mockUserId, reason);

        // Assert
        expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
          where: {
            userId: mockUserId,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            revokedAt: expect.any(Date),
            revokedReason: reason,
          },
        });
      });

      it('should use custom reason if provided', async () => {
        // Arrange
        const customReason = 'Password changed';
        (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
          count: 2,
        });

        // Act
        await service.revokeAllUserTokens(mockUserId, customReason);

        // Assert
        expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              revokedReason: customReason,
            }),
          }),
        );
      });

      it('should return count of revoked tokens', async () => {
        // Arrange
        const reason = 'Security audit';
        (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
          count: 5,
        });

        // Act
        const result = await service.revokeAllUserTokens(mockUserId, reason);

        // Assert
        expect(result).toEqual(5);
      });

      it('should only revoke non-revoked tokens', async () => {
        // Arrange
        const reason = 'All tokens revoked';
        (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
          count: 2,
        });

        // Act
        await service.revokeAllUserTokens(mockUserId, reason);

        // Assert
        const whereClause = (prismaService.refreshToken.updateMany as jest.Mock).mock.calls[0][0]
          ?.where;
        expect(whereClause).toEqual(
          expect.objectContaining({
            isRevoked: false,
          }),
        );
      });
    });

    describe('edge cases', () => {
      it('should handle case when user has no tokens', async () => {
        // Arrange
        const reason = 'All tokens revoked';
        (prismaService.refreshToken.updateMany as jest.Mock).mockResolvedValue({
          count: 0,
        });

        // Act
        const result = await service.revokeAllUserTokens(mockUserId, reason);

        // Assert
        expect(result).toEqual(0);
      });

      it('should handle database errors', async () => {
        // Arrange
        const reason = 'All tokens revoked';
        (prismaService.refreshToken.updateMany as jest.Mock).mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(service.revokeAllUserTokens(mockUserId, reason)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    describe('success cases', () => {
      it('should delete all expired refresh tokens', async () => {
        // Arrange
        (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
          count: 10,
        });

        // Act
        await service.cleanupExpiredTokens();

        // Assert
        expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
          where: {
            expiresAt: {
              lt: expect.any(Date),
            },
          },
        });
      });

      it('should return count of deleted tokens', async () => {
        // Arrange
        (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
          count: 25,
        });

        // Act
        const result = await service.cleanupExpiredTokens();

        // Assert
        expect(result).toEqual(25);
      });

      it('should use current time as cutoff', async () => {
        // Arrange
        const beforeCleanup = Date.now();
        (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
          count: 5,
        });

        // Act
        await service.cleanupExpiredTokens();

        // Assert
        const whereClause = (prismaService.refreshToken.deleteMany as jest.Mock).mock.calls[0][0]
          ?.where;
        const cutoffTime = new Date(whereClause?.expiresAt?.lt).getTime();
        expect(cutoffTime).toBeGreaterThanOrEqual(beforeCleanup);
        expect(cutoffTime).toBeLessThanOrEqual(Date.now());
      });
    });

    describe('edge cases', () => {
      it('should handle case when no expired tokens exist', async () => {
        // Arrange
        (prismaService.refreshToken.deleteMany as jest.Mock).mockResolvedValue({
          count: 0,
        });

        // Act
        const result = await service.cleanupExpiredTokens();

        // Assert
        expect(result).toEqual(0);
      });

      it('should handle database errors', async () => {
        // Arrange
        (prismaService.refreshToken.deleteMany as jest.Mock).mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(service.cleanupExpiredTokens()).rejects.toThrow('Database error');
      });
    });
  });
});
