import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@ftry/shared/prisma';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  RegisterDto,
  UserWithRelations,
  UserWithPermissions,
  TokenResponse,
  JwtPayload,
  UserWithoutPassword,
  RefreshTokenWithUser,
} from '@ftry/shared/types';
import {
  TOKEN_CONFIG,
  ACCOUNT_SECURITY,
  USER_STATUS,
  AUTH_ERRORS,
  FIELD_LIMITS,
} from '@ftry/shared/constants';
import { removePassword } from '@ftry/shared/utils';
import { UserValidationService } from './user-validation.service';

/**
 * AuthService - Core authentication logic
 * Follows Single Responsibility Principle
 * Delegates to specialized services for specific concerns
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userValidationService: UserValidationService,
  ) {}

  /**
   * Register a new user with proper validation
   */
  async register(dto: RegisterDto): Promise<UserWithoutPassword> {
    this.logger.log(`Registering new user: ${dto.email}`);

    // Validate registration
    await this.validateRegistration(dto);

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // Create user
    const user = await this.createUser(dto, hashedPassword);

    this.logger.log(`User registered successfully: ${user.id}`);
    // Type assertion is safe here because removePassword returns the correct type
    return removePassword(user) as UserWithoutPassword;
  }

  /**
   * Validate user credentials and handle login
   */
  async validateUser(email: string, password: string): Promise<UserWithPermissions> {
    this.logger.log(`Validating user credentials: ${email}`);

    const user = await this.findUserWithRelations(email);

    // SECURITY: Always perform bcrypt comparison to prevent timing attacks
    // Use dummy hash if user doesn't exist (constant-time operation)
    const dummyHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MV7lXu'; // Pre-generated bcrypt hash
    const passwordToCheck = user?.password || dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCheck);

    // Now check if user exists and is valid AFTER password comparison
    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    // Validate user status and account lock using shared service
    this.userValidationService.validateUser(user);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    // Handle successful login and get updated user
    const updatedUser = await this.handleSuccessfulLogin(user);

    // Add permissions to user
    return this.enrichUserWithPermissions(updatedUser);
  }

  /**
   * Generate access and refresh tokens for authenticated user
   */
  async generateTokens(
    user: UserWithPermissions,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<TokenResponse> {
    const permissions = this.mergeUserPermissions(user);
    const payload = this.createJwtPayload(user, permissions);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = this.generateSecureToken();
    await this.saveRefreshToken(refreshToken, user.id, deviceInfo, ipAddress);

    return {
      accessToken,
      refreshToken,
      expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Refresh access token using valid refresh token
   * Implements token rotation for security
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    this.logger.log('Refreshing access token');

    // validateRefreshToken throws if token is revoked, but we should NEVER reach here
    // if token was already used (isRevoked = true). This is an additional safety check.
    const tokenRecord = await this.validateRefreshToken(refreshToken);

    // Validate user status using shared service
    this.userValidationService.validateUserStatus(tokenRecord.user);

    // Revoke the old refresh token (token rotation)
    await this.revokeRefreshToken(refreshToken, 'Token rotated during refresh');

    // Generate new tokens
    const userWithPermissions = this.enrichUserWithPermissions(tokenRecord.user);
    const permissions = this.mergeUserPermissions(userWithPermissions);
    const payload = this.createJwtPayload(userWithPermissions, permissions);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
    });

    // Generate new refresh token
    const newRefreshToken = this.generateSecureToken();
    await this.saveRefreshToken(
      newRefreshToken,
      tokenRecord.user.id,
      tokenRecord.deviceInfo || undefined,
      tokenRecord.ipAddress || undefined,
    );

    this.logger.log(`Access token refreshed and tokens rotated for user: ${tokenRecord.user.id}`);

    return {
      accessToken,
      refreshToken: newRefreshToken, // Return the NEW refresh token
      expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(refreshToken: string, reason: string): Promise<void> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    });

    if (result.count === 0) {
      throw new NotFoundException(AUTH_ERRORS.INVALID_TOKEN);
    }

    this.logger.log(`Refresh token revoked: ${reason}`);
  }

  /**
   * Revoke a refresh token for a specific user (validates ownership)
   */
  async revokeRefreshTokenForUser(
    refreshToken: string,
    userId: string,
    reason: string,
  ): Promise<void> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId: userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(AUTH_ERRORS.INVALID_TOKEN);
    }

    this.logger.log(`Refresh token revoked for user ${userId}: ${reason}`);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string, reason: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    });

    this.logger.log(`Revoked ${result.count} tokens for user: ${userId}`);
    return result.count;
  }

  /**
   * Cleanup expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    this.logger.log(`Cleaned up ${result.count} expired tokens`);
    return result.count;
  }

  /**
   * Cleanup old revoked tokens
   * Removes revoked tokens older than the specified date
   */
  async cleanupRevokedTokens(olderThan: Date): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        isRevoked: true,
        revokedAt: { lt: olderThan },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old revoked tokens`);
    return result.count;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Validate registration data
   */
  private async validateRegistration(dto: RegisterDto): Promise<void> {
    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }

    // Validate role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(AUTH_ERRORS.ROLE_NOT_FOUND);
    }

    // Validate tenant if provided
    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: dto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException(AUTH_ERRORS.TENANT_NOT_FOUND);
      }
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, ACCOUNT_SECURITY.SALT_ROUNDS);
  }

  /**
   * Create user in database
   */
  private async createUser(dto: RegisterDto, hashedPassword: string): Promise<UserWithRelations> {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        tenantId: dto.tenantId,
        roleId: dto.roleId,
        status: USER_STATUS.ACTIVE,
      },
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  /**
   * Find user with relations by email
   */
  private async findUserWithRelations(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true, tenant: true },
    });
  }

  /**
   * Get user by ID with relations
   */
  private async getUserById(userId: string): Promise<UserWithRelations> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, tenant: true },
    });

    if (!user) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Handle failed login attempt with atomic increment to prevent race conditions
   */
  private async handleFailedLogin(user: UserWithRelations): Promise<void> {
    const newAttempts = user.loginAttempts + 1;

    // Use atomic increment operation to prevent race conditions
    interface UpdateData {
      loginAttempts: { increment: number };
      lockedUntil?: Date;
    }

    const updateData: UpdateData = {
      loginAttempts: { increment: 1 }, // Atomic increment
    };

    // Lock account if max attempts reached
    if (newAttempts >= ACCOUNT_SECURITY.MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + ACCOUNT_SECURITY.LOCK_DURATION_MINUTES);
      updateData.lockedUntil = lockUntil;

      this.logger.warn(`Account locked after ${newAttempts} failed attempts: ${user.email}`);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: { role: true, tenant: true }, // Include relations for consistency
    });

    this.logger.warn(`Failed login attempt ${newAttempts} for: ${user.email}`);
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(user: UserWithRelations): Promise<UserWithRelations> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
      include: { role: true, tenant: true }, // Include relations for consistency
    });

    this.logger.log(`Successful login: ${user.email}`);
    return updatedUser;
  }

  /**
   * Enrich user with permissions
   */
  private enrichUserWithPermissions(user: UserWithRelations): UserWithPermissions {
    return {
      ...user,
      permissions: user.role?.permissions || [],
      additionalPermissions: [], // Can be extended for user-specific permissions
    };
  }

  /**
   * Merge user permissions from role and additional permissions
   */
  private mergeUserPermissions(user: UserWithPermissions): string[] {
    const allPermissions = [
      ...(user.role?.permissions || []),
      ...(user.additionalPermissions || []),
    ];
    return [...new Set(allPermissions)];
  }

  /**
   * Create JWT payload
   */
  private createJwtPayload(user: UserWithPermissions, permissions: string[]): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      permissions,
    };
  }

  /**
   * Generate cryptographically secure random token
   */
  private generateSecureToken(): string {
    return randomBytes(TOKEN_CONFIG.REFRESH_TOKEN_LENGTH).toString('base64url');
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(
    token: string,
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        deviceInfo: deviceInfo?.slice(0, FIELD_LIMITS.MAX_DEVICE_INFO_LENGTH), // Limit length
        ipAddress,
        expiresAt,
      },
    });
  }

  /**
   * Validate and get refresh token from database
   */
  private async validateRefreshToken(token: string): Promise<RefreshTokenWithUser> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { role: true, tenant: true } } },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_TOKEN);
    }

    // SECURITY: Token reuse detection - if revoked token is used, it's a security breach
    if (tokenRecord.isRevoked) {
      this.logger.error(
        `TOKEN REUSE DETECTED for user: ${tokenRecord.userId}. Revoking all tokens.`,
      );
      // Immediately revoke ALL user tokens (token theft detected)
      await this.revokeAllUserTokens(
        tokenRecord.userId,
        'Token reuse detected - potential security breach',
      );
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked. Please login again.',
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException(AUTH_ERRORS.TOKEN_EXPIRED);
    }

    // Prisma returns all fields including updatedAt, safe to cast
    return tokenRecord as unknown as RefreshTokenWithUser;
  }
}
