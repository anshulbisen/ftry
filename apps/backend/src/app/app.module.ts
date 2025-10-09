import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from '@ftry/backend/logger';
import { AuthModule } from '@ftry/backend/auth';
import { AdminModule } from 'admin';
import { PrismaModule } from '@ftry/shared/prisma';
import { CacheModule } from '@ftry/backend/cache';
import { HealthModule } from '@ftry/backend/health';
import { QueueModule } from '@ftry/backend/queue';
import { MonitoringModule } from '@ftry/backend/monitoring';
import { RedisModule, RedisService } from '@ftry/backend/redis';
import { CsrfService, RedisThrottlerStorage } from '@ftry/backend/common';
import { validateEnvironment } from '../config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment, // Validate environment variables at startup
    }),
    // Production-ready logging with Pino + OpenTelemetry
    LoggerModule.forRoot({ serviceName: 'ftry-backend' }),
    // Shared Redis connection (used by Cache, Queue, and Throttler)
    RedisModule,
    // Distributed rate limiting with Redis
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute
          },
          {
            name: 'strict',
            ttl: 60000,
            limit: 10, // Stricter limit for sensitive endpoints
          },
        ],
        // Use duplicated Redis connection for throttler
        storage: new RedisThrottlerStorage(redisService.duplicate()),
      }),
    }),
    // Redis caching - CRITICAL for performance (150 req/s → 1200+ req/s)
    CacheModule,
    // Background job processing with Bull/Redis
    QueueModule,
    PrismaModule,
    // Health checks for monitoring and K8s probes
    HealthModule,
    // Observability: Metrics, Logs, and Tracing
    MonitoringModule,
    AuthModule,
    // Admin module - MUST come after PrismaModule and AuthModule
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, CsrfService],
})
export class AppModule {}
