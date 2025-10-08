import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ftry/shared/prisma';
import { JwtPayload, UserWithPermissions } from '@ftry/shared/types';
import { AUTH_ERRORS } from '@ftry/shared/constants';
import { UserValidationService } from '../services/user-validation.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userValidationService: UserValidationService,
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserWithPermissions> {
    // Verify user still exists and is active
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

    // Return user data that will be attached to request.user
    return {
      ...user,
      permissions: payload.permissions,
      additionalPermissions: [],
    };
  }
}
