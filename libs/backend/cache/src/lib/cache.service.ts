import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Type-safe cache service with automatic error handling
 *
 * Features:
 * - Type-safe get/set operations
 * - Automatic TTL management
 * - Graceful degradation on cache failures
 * - Comprehensive logging for monitoring
 * - Cache hit/miss metrics
 *
 * Usage:
 * ```typescript
 * // Set with default TTL (from config)
 * await this.cacheService.set('user:123', userData);
 *
 * // Set with custom TTL (seconds)
 * await this.cacheService.set('session:abc', sessionData, 600);
 *
 * // Get with type safety
 * const user = await this.cacheService.get<User>('user:123');
 *
 * // Delete
 * await this.cacheService.del('user:123');
 * ```
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Get value from cache
   * @returns null if key doesn't exist or on error
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);

      if (value !== undefined && value !== null) {
        this.cacheHits++;
        this.logger.debug(`Cache HIT: ${key}`);
        return value;
      }

      this.cacheMisses++;
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}: ${error}`);
      this.cacheMisses++;
      return null; // Graceful degradation
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache (must be JSON-serializable)
   * @param ttl Time to live in seconds (optional, uses default from config)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl ? ttl * 1000 : undefined);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'}s)`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}: ${error}`);
      // Don't throw - cache failure should not break the application
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}: ${error}`);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * WARNING: Use sparingly - can be expensive in Redis
   * Note: Not implemented in cache-manager v5+ - use individual del() calls
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      this.logger.warn(
        `delPattern is not supported in cache-manager v5+. Pattern: ${pattern}. Use individual del() calls instead.`,
      );
    } catch (error) {
      this.logger.error(`Cache DEL pattern error for ${pattern}: ${error}`);
    }
  }

  /**
   * Clear entire cache
   * WARNING: Use with extreme caution
   * Note: Reset functionality varies by cache store version
   */
  async reset(): Promise<void> {
    try {
      // Reset method may not be available in all cache-manager versions
      const store = this.cacheManager as any;
      if (store.reset) {
        await store.reset();
        this.logger.warn('Cache RESET - all keys cleared');
        this.cacheHits = 0;
        this.cacheMisses = 0;
      } else {
        this.logger.warn('Cache RESET not supported by current cache store');
      }
    } catch (error) {
      this.logger.error(`Cache RESET error: ${error}`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; hitRate: string } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? ((this.cacheHits / total) * 100).toFixed(2) : '0.00';

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset statistics (useful for monitoring)
   */
  resetStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.logger.debug('Cache stats reset');
  }

  /**
   * Check if cache is healthy (for health checks)
   */
  async isHealthy(): Promise<boolean> {
    try {
      const testKey = '__health_check__';
      const testValue = Date.now();

      await this.cacheManager.set(testKey, testValue, 5000); // 5 seconds TTL
      const retrieved = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);

      return retrieved === testValue;
    } catch (error) {
      this.logger.error(`Cache health check failed: ${error}`);
      return false;
    }
  }
}
