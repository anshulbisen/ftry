import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT, RedisConnectionState } from './redis.constants';

/**
 * Redis Service
 *
 * Wrapper service for Redis operations with type safety and error handling.
 * Provides common Redis operations and health check functionality.
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get the underlying Redis client
   * Use this when you need direct access to Redis commands
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Duplicate the Redis connection for general use
   * Use this for modules that need their own connection (e.g., Throttler)
   */
  duplicate(): Redis {
    return this.redis.duplicate();
  }

  /**
   * Create a Bull-compatible Redis connection
   * Bull requires specific options to work properly
   * @see https://github.com/OptimalBits/bull/issues/1873
   */
  createBullConnection(): Redis {
    return new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      username: this.configService.get('REDIS_USERNAME'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      // Bull-specific requirements
      maxRetriesPerRequest: null, // Must be null for Bull
      enableReadyCheck: false,
      retryStrategy: (times: number) => {
        return Math.min(times * 50, 2000);
      },
    });
  }

  /**
   * Check if Redis is connected and ready
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.warn(`Redis health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): RedisConnectionState {
    return this.redis.status as RedisConnectionState;
  }

  /**
   * Get Redis server info
   */
  async getInfo(): Promise<Record<string, string>> {
    try {
      const info = await this.redis.info();
      const lines = info.split('\r\n');
      const result: Record<string, string> = {};

      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key.trim()] = value.trim();
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get Redis info: ${error}`);
      return {};
    }
  }

  /**
   * Get memory usage statistics
   */
  async getMemoryStats(): Promise<{
    used: string;
    peak: string;
    fragmentation: string;
  } | null> {
    try {
      const info = await this.getInfo();
      return {
        used: info['used_memory_human'] || 'N/A',
        peak: info['used_memory_peak_human'] || 'N/A',
        fragmentation: info['mem_fragmentation_ratio'] || 'N/A',
      };
    } catch (error) {
      this.logger.error(`Failed to get memory stats: ${error}`);
      return null;
    }
  }

  /**
   * Get number of connected clients
   */
  async getConnectedClients(): Promise<number> {
    try {
      const info = await this.getInfo();
      return parseInt(info['connected_clients'] || '0', 10);
    } catch (error) {
      this.logger.error(`Failed to get connected clients: ${error}`);
      return 0;
    }
  }

  /**
   * Flush all data from current database
   * ⚠️ WARNING: Use with caution!
   */
  async flushDb(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('⚠️  Redis database flushed');
    } catch (error) {
      this.logger.error(`Failed to flush database: ${error}`);
      throw error;
    }
  }

  /**
   * Get database size (number of keys)
   */
  async getDbSize(): Promise<number> {
    try {
      return await this.redis.dbsize();
    } catch (error) {
      this.logger.error(`Failed to get database size: ${error}`);
      return 0;
    }
  }
}
