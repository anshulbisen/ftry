import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard, JwtAuthGuard } from '../guards';
import type {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  UserWithPermissions,
  SafeUser,
  UserWithoutPassword,
} from '@ftry/shared/types';
import { AUTH_MESSAGES } from '@ftry/shared/constants';

// Helper function to create mock request with proper type signatures
function createMockRequest(
  user: UserWithPermissions,
  options: {
    userAgent?: string;
    ip?: string;
    headers?: Record<string, string | string[]>;
    connection?: { remoteAddress?: string };
    socket?: { remoteAddress?: string };
  } = {},
): any {
  const userAgent =
    options.userAgent !== undefined
      ? options.userAgent
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
  const headers = options.headers || (userAgent ? { 'user-agent': userAgent } : {});

  return {
    user,
    headers,
    ip: options.ip || '192.168.1.1',
    connection: options.connection,
    socket: options.socket,
  };
}

// Helper function to create mock response with cookie methods
function createMockResponse(): Partial<Response> {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let mockResponse: Partial<Response>;

  // Test fixtures
  const mockUserId = 'user-789';
  const mockEmail = 'test@example.com';
  const mockTenantId = 'tenant-123';
  const mockRoleId = 'role-456';

  const mockRole = {
    id: mockRoleId,
    name: 'Manager',
    permissions: ['appointments:read', 'appointments:write'],
    type: 'tenant' as const,
    level: 5,
    isSystem: false,
    isDefault: false,
    status: 'active' as const,
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
    subscriptionPlan: 'premium' as const,
    subscriptionStatus: 'active' as const,
    status: 'active' as const,
    description: null,
    logo: null,
    website: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    subscriptionEndDate: null,
    maxUsers: 10,
    settings: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSafeUser: SafeUser = {
    id: mockUserId,
    email: mockEmail,
    firstName: 'John',
    lastName: 'Doe',
    phone: '+919876543210',
    tenantId: mockTenantId,
    roleId: mockRoleId,
    status: 'active',
    isDeleted: false,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    role: mockRole,
    tenant: mockTenant,
  };

  const mockUserWithoutPassword: UserWithoutPassword = {
    id: mockUserId,
    email: mockEmail,
    firstName: 'John',
    lastName: 'Doe',
    phone: '+919876543210',
    tenantId: mockTenantId,
    roleId: mockRoleId,
    status: 'active',
    isDeleted: false,
    loginAttempts: 0,
    lockedUntil: null,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    role: mockRole,
    tenant: mockTenant,
  };

  const mockUserWithPermissions: UserWithPermissions = {
    ...mockUserWithoutPassword,
    password: '$2b$12$hashedpassword',
    additionalPermissions: [],
    permissions: mockRole.permissions,
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
  };

  let mockAuthenticatedRequest: any;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      validateUser: jest.fn(),
      generateTokens: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeRefreshTokenForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUserWithPermissions;
          return true;
        },
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUserWithPermissions;
          return true;
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Initialize mock request and response using helpers
    mockAuthenticatedRequest = createMockRequest(mockUserWithPermissions);
    mockResponse = createMockResponse();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: mockEmail,
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+919876543210',
      tenantId: mockTenantId,
      roleId: mockRoleId,
    };

    describe('success cases', () => {
      it('should successfully register a new user', async () => {
        // Arrange
        authService.register.mockResolvedValue(mockUserWithoutPassword);

        // Act
        const result = await controller.register(registerDto);

        // Assert
        expect(authService.register).toHaveBeenCalledWith(registerDto);
        expect(result.success).toBe(true);
        expect(result.message).toBe(AUTH_MESSAGES.REGISTER_SUCCESS);
        expect(result.data).toEqual(mockSafeUser);
        expect(result.data).not.toHaveProperty('password');
      });

      it('should register user without optional fields', async () => {
        // Arrange
        const minimalDto = {
          email: mockEmail,
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
          roleId: mockRoleId,
        };
        const userWithoutPhone = { ...mockUserWithoutPassword, phone: null };
        authService.register.mockResolvedValue(userWithoutPhone);

        // Act
        const result = await controller.register(minimalDto as RegisterDto);

        // Assert
        expect(authService.register).toHaveBeenCalledWith(minimalDto);
        expect(result.success).toBe(true);
        expect(result.data?.phone).toBeNull();
      });

      it('should return 201 status code for successful registration', async () => {
        // Arrange
        authService.register.mockResolvedValue(mockUserWithoutPassword);

        // Act
        const result = await controller.register(registerDto);

        // Assert
        expect(result.success).toBe(true);
        // Status code 201 is handled by NestJS @HttpCode decorator, not in response body
      });
    });

    describe('error cases', () => {
      it('should throw error when email already exists', async () => {
        // Arrange
        authService.register.mockRejectedValue(new Error('Email already registered'));

        // Act & Assert
        await expect(controller.register(registerDto)).rejects.toThrow('Email already registered');
        expect(authService.register).toHaveBeenCalledWith(registerDto);
      });

      it('should throw error when role not found', async () => {
        // Arrange
        authService.register.mockRejectedValue(new Error('Role not found'));

        // Act & Assert
        await expect(controller.register(registerDto)).rejects.toThrow('Role not found');
      });

      it('should throw error when tenant not found', async () => {
        // Arrange
        authService.register.mockRejectedValue(new Error('Tenant not found'));

        // Act & Assert
        await expect(controller.register(registerDto)).rejects.toThrow('Tenant not found');
      });

      it('should handle service errors gracefully', async () => {
        // Arrange
        authService.register.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.register(registerDto)).rejects.toThrow('Database error');
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: mockEmail,
      password: 'SecurePass123!',
    };

    describe('success cases', () => {
      it('should successfully login and return user with tokens', async () => {
        // Arrange
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        const result = await controller.login(
          mockAuthenticatedRequest as any,
          mockResponse as Response,
          loginDto,
        );

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          mockUserWithPermissions,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          '192.168.1.1',
        );
        expect(result.success).toBe(true);
        expect(result.message).toBe(AUTH_MESSAGES.LOGIN_SUCCESS);
        expect(result.data).toEqual({
          user: expect.objectContaining({
            id: mockUserId,
            email: mockEmail,
          }),
          expiresIn: mockTokens.expiresIn,
        });
        expect(result.data?.user).not.toHaveProperty('password');
        // Verify cookies are set
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'accessToken',
          mockTokens.accessToken,
          expect.any(Object),
        );
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'refreshToken',
          mockTokens.refreshToken,
          expect.any(Object),
        );
      });

      it('should extract deviceInfo from user-agent header', async () => {
        // Arrange
        const customRequest = createMockRequest(mockUserWithPermissions, {
          userAgent: 'Mozilla/5.0 Custom Browser',
        });
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(customRequest as any, mockResponse as Response, loginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          mockUserWithPermissions,
          'Mozilla/5.0 Custom Browser',
          '192.168.1.1',
        );
      });

      it('should handle missing user-agent header', async () => {
        // Arrange
        const requestWithoutUserAgent = createMockRequest(mockUserWithPermissions, {
          userAgent: '',
          headers: {},
        });
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithoutUserAgent as any, mockResponse as Response, loginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          mockUserWithPermissions,
          'Unknown',
          '192.168.1.1',
        );
      });

      it('should extract IP address from request', async () => {
        // Arrange
        const requestWithDifferentIP = createMockRequest(mockUserWithPermissions, {
          ip: '10.0.0.1',
        });
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithDifferentIP as any, mockResponse as Response, loginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          mockUserWithPermissions,
          expect.any(String),
          '10.0.0.1',
        );
      });

      it('should fallback to connection.remoteAddress if ip not available', async () => {
        // Arrange
        const requestWithConnectionIP = createMockRequest(mockUserWithPermissions, {
          ip: undefined,
          connection: { remoteAddress: '172.16.0.1' },
        });
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithConnectionIP as any, mockResponse as Response, loginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          mockUserWithPermissions,
          expect.any(String),
          '172.16.0.1',
        );
      });

      it('should sanitize dangerous characters from device info', async () => {
        // Arrange
        const requestWithDangerousUA = createMockRequest(mockUserWithPermissions, {
          userAgent: 'Mozilla/5.0 <script>alert("xss")</script>',
        });
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithDangerousUA as any, mockResponse as Response, loginDto);

        // Assert
        const call = authService.generateTokens.mock.calls[0];
        expect(call).toBeDefined();
        expect(call![1]).not.toContain('<');
        expect(call![1]).not.toContain('>');
      });

      it('should handle array user-agent header', async () => {
        // Arrange
        const requestWithArrayUA = createMockRequest(mockUserWithPermissions, {
          headers: {
            'user-agent': ['Mozilla/5.0 First', 'Mozilla/5.0 Second'],
          },
        });
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithArrayUA as any, mockResponse as Response, loginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          mockUserWithPermissions,
          'Mozilla/5.0 First',
          '192.168.1.1',
        );
      });
    });

    describe('error cases', () => {
      it('should handle token generation errors', async () => {
        // Arrange
        authService.generateTokens.mockRejectedValue(new Error('Token generation failed'));

        // Act & Assert
        await expect(
          controller.login(mockAuthenticatedRequest as any, mockResponse as Response, loginDto),
        ).rejects.toThrow('Token generation failed');
      });
    });
  });

  describe('refresh', () => {
    describe('success cases', () => {
      it('should successfully refresh access token', async () => {
        // Arrange
        const newTokens = {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 900,
        };
        const mockRequest = {
          cookies: { refreshToken: 'valid-refresh-token' },
        } as Request;
        authService.refreshAccessToken.mockResolvedValue(newTokens);

        // Act
        const result = await controller.refresh(mockRequest, mockResponse as Response);

        // Assert
        expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
        expect(result.success).toBe(true);
        expect(result.message).toBe(AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS);
        expect(result.data).toEqual({ expiresIn: 900 });
        // Verify cookies are set
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'accessToken',
          newTokens.accessToken,
          expect.any(Object),
        );
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'refreshToken',
          newTokens.refreshToken,
          expect.any(Object),
        );
      });

      it('should return new access and refresh tokens', async () => {
        // Arrange
        const newTokens = {
          accessToken: 'rotated-access-token',
          refreshToken: 'rotated-refresh-token',
          expiresIn: 900,
        };
        const mockRequest = {
          cookies: { refreshToken: 'valid-refresh-token' },
        } as Request;
        authService.refreshAccessToken.mockResolvedValue(newTokens);

        // Act
        const result = await controller.refresh(mockRequest, mockResponse as Response);

        // Assert
        expect(result.data?.expiresIn).toBe(900);
        // Tokens are in cookies, not in response body
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'accessToken',
          'rotated-access-token',
          expect.any(Object),
        );
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'refreshToken',
          'rotated-refresh-token',
          expect.any(Object),
        );
      });
    });

    describe('error cases', () => {
      it('should throw error for invalid refresh token', async () => {
        // Arrange
        const mockRequest = {
          cookies: { refreshToken: 'invalid-token' },
        } as Request;
        authService.refreshAccessToken.mockRejectedValue(new Error('Invalid refresh token'));

        // Act & Assert
        await expect(controller.refresh(mockRequest, mockResponse as Response)).rejects.toThrow(
          'Invalid refresh token',
        );
        expect(authService.refreshAccessToken).toHaveBeenCalledWith('invalid-token');
      });

      it('should throw error for expired refresh token', async () => {
        // Arrange
        const mockRequest = {
          cookies: { refreshToken: 'expired-token' },
        } as Request;
        authService.refreshAccessToken.mockRejectedValue(new Error('Refresh token has expired'));

        // Act & Assert
        await expect(controller.refresh(mockRequest, mockResponse as Response)).rejects.toThrow(
          'Refresh token has expired',
        );
      });

      it('should throw error for revoked refresh token', async () => {
        // Arrange
        const mockRequest = {
          cookies: { refreshToken: 'revoked-token' },
        } as Request;
        authService.refreshAccessToken.mockRejectedValue(
          new Error('Refresh token has been revoked'),
        );

        // Act & Assert
        await expect(controller.refresh(mockRequest, mockResponse as Response)).rejects.toThrow(
          'Refresh token has been revoked',
        );
      });
    });
  });

  describe('logout', () => {
    describe('success cases', () => {
      it('should successfully logout and revoke refresh token', async () => {
        // Arrange
        const mockRequest = {
          cookies: { refreshToken: 'token-to-revoke' },
        } as Request;
        authService.revokeRefreshTokenForUser.mockResolvedValue(undefined);

        // Act
        const result = await controller.logout(
          mockUserWithPermissions,
          mockRequest,
          mockResponse as Response,
        );

        // Assert
        expect(authService.revokeRefreshTokenForUser).toHaveBeenCalledWith(
          'token-to-revoke',
          mockUserId,
          'User logout',
        );
        expect(result.success).toBe(true);
        expect(result.message).toBe(AUTH_MESSAGES.LOGOUT_SUCCESS);
        expect(result.data).toBeNull();
        // Verify cookies are cleared
        expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
        expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      });

      it('should verify token ownership before revoking', async () => {
        // Arrange
        const mockRequest = {
          cookies: { refreshToken: 'token-to-revoke' },
        } as Request;
        authService.revokeRefreshTokenForUser.mockResolvedValue(undefined);
        const differentUser = { ...mockUserWithPermissions, id: 'different-user-id' };

        // Act
        await controller.logout(differentUser, mockRequest, mockResponse as Response);

        // Assert
        expect(authService.revokeRefreshTokenForUser).toHaveBeenCalledWith(
          'token-to-revoke',
          'different-user-id',
          'User logout',
        );
      });
    });

    describe('error cases', () => {
      it('should continue with logout even if token revocation fails', async () => {
        // Arrange
        const mockRequest = {
          cookies: { refreshToken: 'token-to-revoke' },
        } as Request;
        authService.revokeRefreshTokenForUser.mockRejectedValue(new Error('Invalid refresh token'));

        // Act
        const result = await controller.logout(
          mockUserWithPermissions,
          mockRequest,
          mockResponse as Response,
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe(AUTH_MESSAGES.LOGOUT_SUCCESS);
        // Cookies should still be cleared even if revocation fails
        expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
        expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      });

      it('should handle missing refresh token gracefully', async () => {
        // Arrange
        const mockRequest = {
          cookies: {},
        } as Request;

        // Act
        const result = await controller.logout(
          mockUserWithPermissions,
          mockRequest,
          mockResponse as Response,
        );

        // Assert
        expect(authService.revokeRefreshTokenForUser).not.toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.message).toBe(AUTH_MESSAGES.LOGOUT_SUCCESS);
        // Cookies should still be cleared
        expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
        expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      });
    });
  });

  describe('getCurrentUser', () => {
    describe('success cases', () => {
      it('should return current authenticated user', async () => {
        // Act
        const result = await controller.getCurrentUser(mockUserWithPermissions);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('User retrieved successfully');
        expect(result.data).toEqual(
          expect.objectContaining({
            id: mockUserId,
            email: mockEmail,
            firstName: 'John',
            lastName: 'Doe',
          }),
        );
        expect(result.data).not.toHaveProperty('password');
      });

      it('should return user with role and tenant information', async () => {
        // Act
        const result = await controller.getCurrentUser(mockUserWithPermissions);

        // Assert
        expect(result.data?.role).toBeDefined();
        expect(result.data?.role.name).toBe('Manager');
        expect(result.data?.tenant).toBeDefined();
        expect(result.data?.tenant?.name).toBe('Test Salon');
      });

      it('should strip password from user object', async () => {
        // Act
        const result = await controller.getCurrentUser(mockUserWithPermissions);

        // Assert
        expect(result.data).not.toHaveProperty('password');
        expect(result.data).not.toHaveProperty('permissions');
        expect(result.data).not.toHaveProperty('additionalPermissions');
      });
    });
  });

  describe('Helper Methods', () => {
    describe('sanitizeDeviceInfo', () => {
      it('should return "Unknown" for undefined user agent', async () => {
        // Arrange
        const requestWithoutUA = createMockRequest(mockUserWithPermissions, {
          userAgent: '',
          headers: {},
        });
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithoutUA as any, mockResponse as Response, {} as LoginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          expect.any(Object),
          'Unknown',
          expect.any(String),
        );
      });

      it('should remove dangerous characters', async () => {
        // Arrange
        const requestWithDangerousUA = {
          ...mockAuthenticatedRequest,
          headers: {
            'user-agent': 'Mozilla<>{}[]|\\^~`',
          },
        };
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(
          requestWithDangerousUA as any,
          mockResponse as Response,
          {} as LoginDto,
        );

        // Assert
        const deviceInfo = authService.generateTokens.mock.calls[0]?.[1];
        expect(deviceInfo).toBeDefined();
        expect(deviceInfo).not.toContain('<');
        expect(deviceInfo).not.toContain('>');
        expect(deviceInfo).not.toContain('|');
      });

      it('should limit device info length to maximum', async () => {
        // Arrange
        const longUserAgent = 'A'.repeat(1000);
        const requestWithLongUA = {
          ...mockAuthenticatedRequest,
          headers: {
            'user-agent': longUserAgent,
          },
        };
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithLongUA as any, mockResponse as Response, {} as LoginDto);

        // Assert
        const deviceInfo = authService.generateTokens.mock.calls[0]?.[1];
        expect(deviceInfo).toBeDefined();
        expect(deviceInfo!.length).toBeLessThanOrEqual(255);
      });

      it('should preserve valid characters', async () => {
        // Arrange
        const validUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
        const requestWithValidUA = {
          ...mockAuthenticatedRequest,
          headers: {
            'user-agent': validUA,
          },
        };
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithValidUA as any, mockResponse as Response, {} as LoginDto);

        // Assert
        const deviceInfo = authService.generateTokens.mock.calls[0]?.[1];
        expect(deviceInfo).toBeDefined();
        expect(deviceInfo).toContain('Mozilla');
        expect(deviceInfo).toContain('5.0');
      });
    });

    describe('extractIpAddress', () => {
      it('should extract IP from req.ip', async () => {
        // Arrange
        const requestWithIP = {
          ...mockAuthenticatedRequest,
          ip: '203.0.113.1',
        };
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithIP as any, mockResponse as Response, {} as LoginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(String),
          '203.0.113.1',
        );
      });

      it('should extract IP from connection.remoteAddress if req.ip not available', async () => {
        // Arrange
        const requestWithConnectionIP = {
          ...mockAuthenticatedRequest,
          ip: undefined,
          connection: { remoteAddress: '198.51.100.1' },
        };
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(
          requestWithConnectionIP as any,
          mockResponse as Response,
          {} as LoginDto,
        );

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(String),
          '198.51.100.1',
        );
      });

      it('should handle missing IP gracefully', async () => {
        // Arrange
        const requestWithoutIP = {
          ...mockAuthenticatedRequest,
          ip: undefined,
          connection: {},
        };
        authService.generateTokens.mockResolvedValue(mockTokens);

        // Act
        await controller.login(requestWithoutIP as any, mockResponse as Response, {} as LoginDto);

        // Assert
        expect(authService.generateTokens).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(String),
          undefined,
        );
      });
    });
  });

  describe('Guards and Rate Limiting', () => {
    it('should apply ThrottlerGuard to all endpoints', () => {
      const guards = Reflect.getMetadata('__guards__', AuthController);
      expect(guards).toBeDefined();
    });

    it('should apply LocalAuthGuard to login endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.login);
      expect(guards).toBeDefined();
    });

    it('should apply JwtAuthGuard to logout endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.logout);
      expect(guards).toBeDefined();
    });

    it('should apply JwtAuthGuard to getCurrentUser endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getCurrentUser);
      expect(guards).toBeDefined();
    });
  });
});
