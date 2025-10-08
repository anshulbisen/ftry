import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '@ftry/shared/prisma';
import { JwtPayload, UserWithPermissions } from '@ftry/shared/types';
import { AUTH_ERRORS } from '@ftry/shared/constants';
import { UserValidationService } from '../services/user-validation.service';
import { CacheService } from '@ftry/backend/cache';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userValidationService: UserValidationService,
    private readonly cacheService: CacheService,
    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // Ensure JWT secret is properly configured
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not configured. Please set the JWT_SECRET environment variable.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract JWT from HTTP-only cookie
        (request: Request) => {
          return request?.cookies?.['accessToken'];
        },
        // Fallback to Authorization header for backward compatibility during migration
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserWithPermissions> {
    const cacheKey = `user:${payload.sub}`;

    // PERFORMANCE: Try cache first (2ms avg) before database query (50ms avg)
    // Expected cache hit rate: 95%+ after warmup
    const cachedUser = await this.cacheService.get<UserWithPermissions>(cacheKey);

    if (cachedUser) {
      this.logger.debug(`JWT validation cache HIT for user: ${payload.sub}`);

      // CRITICAL SECURITY: Set RLS tenant context even for cached users
      // This ensures every authenticated request has proper tenant isolation
      await this.setRLSTenantContext(cachedUser.tenantId);

      return cachedUser;
    }

    // Cache MISS - query database
    this.logger.debug(`JWT validation cache MISS for user: ${payload.sub} - querying database`);

    // CRITICAL SECURITY: Set RLS tenant context BEFORE database query
    // This ensures the query itself is tenant-scoped
    await this.setRLSTenantContext(payload.tenantId);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    // Use shared validation service
    this.userValidationService.validateUserStatus(user);

    // Build user with permissions
    const userWithPermissions: UserWithPermissions = {
      ...user,
      permissions: payload.permissions,
      additionalPermissions: [],
    };

    // Cache for 5 minutes (300s) - MUST be less than access token expiry (15min)
    // This ensures cached data expires before the JWT token itself
    await this.cacheService.set(cacheKey, userWithPermissions, 300);

    return userWithPermissions;
  }

  /**
   * Set Row-Level Security (RLS) tenant context for database queries
   * CRITICAL SECURITY: This enforces tenant isolation at the database level
   *
   * @param tenantId - Tenant ID from JWT payload (null for super admins)
   * @private
   */
  private async setRLSTenantContext(tenantId: string | null): Promise<void> {
    try {
      await this.prisma.setTenantContext(tenantId);

      // Log tenant context changes for security auditing
      if (tenantId) {
        this.logger.debug(`RLS tenant context set: tenantId=${tenantId}`);
      } else {
        this.logger.debug('RLS tenant context cleared (super admin access)');
      }
    } catch (error) {
      // RLS context setting is CRITICAL - fail the request if it fails
      this.logger.error(
        `CRITICAL: Failed to set RLS tenant context for tenantId=${tenantId}`,
        error,
      );
      throw new UnauthorizedException(
        'Authentication failed due to security policy enforcement. Please try again.',
      );
    }
  }
}
