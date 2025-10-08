import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '@ftry/backend/redis';

/**
 * Redis Health Indicator
 *
 * Provides health check functionality for Redis connection.
 * Checks connection status, memory usage, and connected clients.
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  /**
   * Perform Redis health check
   *
   * @param key - Key to identify this check in the health response
   * @returns Health indicator result with detailed Redis statistics
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.redisService.isHealthy();

    if (!isHealthy) {
      const state = this.redisService.getConnectionState();
      throw new HealthCheckError('Redis is not healthy', this.getStatus(key, false, { state }));
    }

    // Get detailed statistics
    const [memoryStats, connectedClients, dbSize] = await Promise.all([
      this.redisService.getMemoryStats(),
      this.redisService.getConnectedClients(),
      this.redisService.getDbSize(),
    ]);

    const details = {
      state: this.redisService.getConnectionState(),
      memory: memoryStats,
      connectedClients,
      dbSize,
    };

    return this.getStatus(key, true, details);
  }

  /**
   * Quick ping check (fast health check)
   *
   * @param key - Key to identify this check in the health response
   * @returns Simple health indicator result
   */
  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.redisService.isHealthy();

    if (!isHealthy) {
      const state = this.redisService.getConnectionState();
      throw new HealthCheckError('Redis ping failed', this.getStatus(key, false, { state }));
    }

    return this.getStatus(key, true, {
      state: this.redisService.getConnectionState(),
    });
  }
}
