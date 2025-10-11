import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '@ftry/shared/prisma';
import { RedisHealthIndicator } from './indicators/redis.health';

/**
 * Health Check Controller
 *
 * Provides health check endpoints for monitoring and orchestration:
 * - /health - Overall application health (database + cache)
 * - /health/liveness - Simple ping for Kubernetes liveness probe
 * - /health/readiness - Dependencies check for Kubernetes readiness probe
 *
 * Health Check Strategy:
 * - Liveness: App is running (simple 200 OK)
 * - Readiness: App can accept traffic (dependencies healthy)
 * - Health: Detailed status of all components
 *
 * Kubernetes Integration:
 * ```yaml
 * livenessProbe:
 *   httpGet:
 *     path: /health/liveness
 *     port: 3000
 *   initialDelaySeconds: 30
 *   periodSeconds: 10
 *
 * readinessProbe:
 *   httpGet:
 *     path: /health/readiness
 *     port: 3000
 *   initialDelaySeconds: 5
 *   periodSeconds: 5
 * ```
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  /**
   * Overall health check
   * Checks all critical dependencies
   *
   * Returns 200 if all healthy, 503 if any unhealthy
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health
      async () => this.prismaHealth.pingCheck('database', this.prisma),

      // Redis health with detailed statistics
      async () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  /**
   * Liveness probe
   * Simple check to verify the application process is running
   *
   * Used by Kubernetes to restart the pod if it becomes unresponsive
   * Should NOT check dependencies (database, cache) - only the app itself
   */
  @Get('liveness')
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe
   * Checks if the application is ready to accept traffic
   *
   * Used by Kubernetes to determine when to route traffic to this pod
   * Should check all critical dependencies
   */
  @Get('readiness')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database must be available
      async () => this.prismaHealth.pingCheck('database', this.prisma),

      // Redis must be available (quick ping check)
      async () => this.redisHealth.pingCheck('redis'),
    ]);
  }
}
