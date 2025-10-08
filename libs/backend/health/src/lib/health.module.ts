import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '@ftry/shared/prisma';
import { CacheModule } from '@ftry/backend/cache';
import { RedisModule } from '@ftry/backend/redis';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';

/**
 * Health Check Module
 *
 * Provides health check endpoints for application monitoring
 * and orchestration (Kubernetes, Docker Swarm, load balancers)
 */
@Module({
  imports: [TerminusModule, PrismaModule, CacheModule, RedisModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
  exports: [RedisHealthIndicator],
})
export class HealthModule {}
