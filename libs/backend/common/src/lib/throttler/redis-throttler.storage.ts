import { ThrottlerStorage } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Throttler storage record returned by increment operation
 */
export interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Redis Storage for Throttler
 *
 * Enables distributed rate limiting across multiple backend instances.
 * Uses Redis as the shared state store for request counts.
 *
 * Features:
 * - Atomic increment operations (race-condition safe)
 * - TTL-based automatic cleanup
 * - Works across multiple servers
 *
 * @example
 * // In app.module.ts:
 * ThrottlerModule.forRootAsync({
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     throttlers: [{ ttl: 60000, limit: 100 }],
 *     storage: new RedisThrottlerStorage(
 *       new Redis({
 *         host: config.get('REDIS_HOST'),
 *         port: config.get('REDIS_PORT'),
 *       })
 *     ),
 *   }),
 * })
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private scriptSha = '';

  constructor(private readonly redis: Redis) {
    // Load atomic increment script on initialization
    this.loadIncrementScript();
  }

  /**
   * Load Lua script for atomic increment + TTL
   * Ensures race-condition-free increments
   */
  private async loadIncrementScript(): Promise<void> {
    const script = `
      local key = KEYS[1]
      local ttl = tonumber(ARGV[1])
      local current = redis.call('INCR', key)
      if current == 1 then
        redis.call('PEXPIRE', key, ttl)
      end
      return current
    `;

    try {
      this.scriptSha = (await this.redis.script('LOAD', script)) as string;
    } catch (error) {
      console.error('Failed to load Redis script:', error);
    }
  }

  /**
   * Increment request count for a key
   * Returns the new count after increment and block status
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      let totalHits: number;

      if (this.scriptSha) {
        // Use pre-loaded script (faster)
        totalHits = (await this.redis.evalsha(this.scriptSha, 1, key, ttl)) as number;
      } else {
        // Fallback: inline script
        const script = `
          local key = KEYS[1]
          local ttl = tonumber(ARGV[1])
          local current = redis.call('INCR', key)
          if current == 1 then
            redis.call('PEXPIRE', key, ttl)
          end
          return current
        `;
        totalHits = (await this.redis.eval(script, 1, key, ttl)) as number;
      }

      // Get remaining TTL
      const timeToExpire = (await this.redis.pttl(key)) as number;

      // Check if blocked
      const isBlocked = totalHits > limit;
      const timeToBlockExpire = isBlocked ? timeToExpire : 0;

      return {
        totalHits,
        timeToExpire: timeToExpire > 0 ? timeToExpire : 0,
        isBlocked,
        timeToBlockExpire,
      };
    } catch (error) {
      console.error('Redis increment error:', error);
      // Fail open: allow request if Redis is down
      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
    }
  }

  /**
   * Get current count without incrementing
   */
  async get(key: string): Promise<number> {
    try {
      const value = await this.redis.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Redis get error:', error);
      return 0;
    }
  }

  /**
   * Reset count for a key
   */
  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }
}
