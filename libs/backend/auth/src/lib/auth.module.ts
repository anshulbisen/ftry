import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from './services/auth.service';
import { UserValidationService } from './services/user-validation.service';
import { TokenCleanupService } from './services/token-cleanup.service';
import { PrismaModule } from '@ftry/shared/prisma';
import { QueueModule } from '@ftry/backend/queue';
import { JwtStrategy, LocalStrategy } from './strategies';
import { AuthController } from './controllers/auth.controller';
import { PermissionsGuard } from './guards';
import { CsrfService } from '@ftry/backend/common';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');

        // SECURITY: Always require JWT_SECRET, no fallback
        // Generate with: openssl rand -base64 64
        if (!jwtSecret) {
          throw new Error(
            'JWT_SECRET is required. Generate secure secret with: openssl rand -base64 64',
          );
        }

        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserValidationService,
    TokenCleanupService,
    JwtStrategy,
    LocalStrategy,
    PermissionsGuard,
    CsrfService,
  ],
  exports: [AuthService, UserValidationService, JwtStrategy, LocalStrategy, PermissionsGuard],
})
export class AuthModule {}
