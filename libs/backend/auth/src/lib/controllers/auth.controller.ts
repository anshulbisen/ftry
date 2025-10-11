import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request as Req,
  Get,
  HttpCode,
  HttpStatus,
  Version,
  Res,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard, JwtAuthGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
  UserWithPermissions,
  ApiResponse as ApiResponseType,
  AuthResponse,
  SafeUser,
  TokenResponse,
} from '@ftry/shared/types';
import { AUTH_MESSAGES, FIELD_LIMITS, TOKEN_CONFIG } from '@ftry/shared/constants';
import { successResponse, toSafeUser } from '@ftry/shared/utils';
import { CsrfInterceptor } from '@ftry/backend/common';

interface AuthenticatedRequest extends Request {
  user: UserWithPermissions;
}

/**
 * Authentication Controller
 * Handles all authentication endpoints with consistent responses
 */
@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard) // Apply rate limiting to all auth endpoints
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get CSRF token
   */
  @Get('csrf')
  @Version('1')
  @UseInterceptors(CsrfInterceptor)
  @ApiOperation({
    summary: 'Get CSRF token',
    description:
      'Retrieve CSRF token for state-changing operations. Token is returned in X-CSRF-Token header.',
  })
  @ApiOkResponse({
    description: 'CSRF token generated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'CSRF token generated' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getCsrfToken(): Promise<ApiResponseType<null>> {
    return successResponse('CSRF token generated', null);
  }

  /**
   * Register a new user
   */
  @Post('register')
  @Version('1')
  @UseInterceptors(CsrfInterceptor)
  @Throttle({ default: { ttl: 3600000, limit: 3 } }) // 3 registrations per hour per IP
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email and password',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: AUTH_MESSAGES.REGISTER_SUCCESS },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string', nullable: true },
            roleId: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or email already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string' },
        statusCode: { type: 'number', example: 400 },
        validationErrors: { type: 'array', items: { type: 'object' } },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts',
  })
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponseType<SafeUser>> {
    const user = await this.authService.register(registerDto);
    return successResponse(AUTH_MESSAGES.REGISTER_SUCCESS, user);
  }

  /**
   * Login with email and password
   */
  @Post('login')
  @Version('1')
  @UseInterceptors(CsrfInterceptor)
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 login attempts per minute per IP
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password to receive access and refresh tokens',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: AUTH_MESSAGES.LOGIN_SUCCESS },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              description: 'User information without password',
            },
            accessToken: {
              type: 'string',
              description: 'JWT access token for API authentication',
            },
            refreshToken: {
              type: 'string',
              description: 'Refresh token for obtaining new access tokens',
            },
            expiresIn: {
              type: 'number',
              description: 'Access token expiration time in seconds',
              example: 3600,
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account locked',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts',
  })
  async login(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() _loginDto: LoginDto, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<ApiResponseType<Omit<AuthResponse, 'accessToken' | 'refreshToken'>>> {
    const { user } = req;

    // Sanitize device info
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'];
    const deviceInfo = this.sanitizeDeviceInfo(userAgent);
    const ipAddress = this.extractIpAddress(req);

    // Generate tokens
    const tokens = await this.authService.generateTokens(user, deviceInfo, ipAddress);

    // Set tokens as HTTP-only cookies
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Create safe user object using shared utility
    const safeUser = toSafeUser(user);

    // Return user data and expiry, but NOT the tokens (they're in cookies)
    return successResponse(AUTH_MESSAGES.LOGIN_SUCCESS, {
      user: safeUser,
      expiresIn: tokens.expiresIn,
    });
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @Version('1')
  @UseInterceptors(CsrfInterceptor)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // SECURITY: Rate limit to 10 requests per minute
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchange a valid refresh token cookie for a new access token. Implements token rotation for security.',
  })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS },
        data: {
          type: 'object',
          properties: {
            expiresIn: {
              type: 'number',
              description: 'Access token expiration time in seconds',
              example: 3600,
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, or revoked refresh token',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseType<{ expiresIn: number }>> {
    // Extract refresh token from HTTP-only cookie
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshAccessToken(refreshToken);

    // Set new tokens as HTTP-only cookies
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return successResponse(AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS, {
      expiresIn: tokens.expiresIn,
    });
  }

  /**
   * Logout and revoke refresh token
   */
  @Post('logout')
  @Version('1')
  @UseInterceptors(CsrfInterceptor)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user and revoke the refresh token from cookie',
  })
  @ApiOkResponse({
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: AUTH_MESSAGES.LOGOUT_SUCCESS },
        data: { type: 'null' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing access token',
  })
  async logout(
    @CurrentUser() user: UserWithPermissions,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseType<null>> {
    // Extract refresh token from cookie
    const refreshToken = req.cookies['refreshToken'];

    // Revoke token if present
    if (refreshToken) {
      try {
        await this.authService.revokeRefreshTokenForUser(refreshToken, user.id, 'User logout');
      } catch (error) {
        // Continue with logout even if revocation fails
      }
    }

    // Clear auth cookies
    this.clearAuthCookies(res);

    return successResponse(AUTH_MESSAGES.LOGOUT_SUCCESS, null);
  }

  /**
   * Get current authenticated user
   */
  @Get('me')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieve information about the currently authenticated user',
  })
  @ApiOkResponse({
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User retrieved successfully' },
        data: {
          type: 'object',
          description: 'User information without password',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string', nullable: true },
            roleId: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing access token',
  })
  async getCurrentUser(
    @CurrentUser() user: UserWithPermissions,
  ): Promise<ApiResponseType<SafeUser>> {
    const safeUser = toSafeUser(user);
    return successResponse('User retrieved successfully', safeUser);
  }

  /**
   * Revoke all tokens for current user
   */
  @Post('revoke-all')
  @Version('1')
  @UseInterceptors(CsrfInterceptor)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke all tokens',
    description: 'Revoke all refresh tokens for the current user (logout from all devices)',
  })
  @ApiOkResponse({
    description: 'All tokens revoked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'All tokens revoked successfully' },
        data: {
          type: 'object',
          properties: {
            revokedCount: {
              type: 'number',
              description: 'Number of tokens revoked',
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing access token',
  })
  async revokeAllTokens(
    @CurrentUser() user: UserWithPermissions,
  ): Promise<ApiResponseType<{ revokedCount: number }>> {
    const revokedCount = await this.authService.revokeAllUserTokens(
      user.id,
      'User requested logout from all devices',
    );
    return successResponse('All tokens revoked successfully', { revokedCount });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Sanitize and limit device info length
   */
  private sanitizeDeviceInfo(userAgent?: string): string {
    if (!userAgent) return 'Unknown';

    // Remove potentially dangerous characters and limit length
    return userAgent.replace(/[^\w\s\-.,()/:]/g, '').slice(0, FIELD_LIMITS.MAX_DEVICE_INFO_LENGTH);
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(req: AuthenticatedRequest): string | undefined {
    return (
      req.ip ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress
    );
  }

  /**
   * Set authentication cookies
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env['NODE_ENV'] === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      // SameSite 'strict' blocks cross-origin cookies (different ports in dev)
      // Use 'lax' in dev (localhost:3000 → localhost:3001), 'strict' in prod
      sameSite: isProduction ? ('strict' as const) : ('lax' as const),
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Clear authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
}
