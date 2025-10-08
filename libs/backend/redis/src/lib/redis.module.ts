import { Module, Global, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

/**
 * Global Redis Module
 *
 * Provides a shared Redis connection for all modules in the application.
 * This prevents connection exhaustion and improves performance.
 *
 * Features:
 * - Single shared connection pool
 * - Automatic reconnection with exponential backoff
 * - Health monitoring and event logging
 * - Graceful shutdown on module destroy
 * - Lazy connection (won't block startup)
 *
 * Used by:
 * - CacheModule: In-memory caching
 * - QueueModule: Background job processing
 * - ThrottlerModule: Rate limiting
 * - SessionModule: Session storage (future)
 *
 * Connection Settings:
 * - Max retries: 3
 * - Connect timeout: 10 seconds
 * - Retry strategy: Exponential backoff (1s, 2s, 3s)
 * - Keep-alive: 30 seconds
 *
 * Environment Variables:
 * - REDIS_HOST: Redis server host (default: localhost)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_USERNAME: Redis username (optional, for Redis Cloud)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');

        const redis = new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          username: configService.get('REDIS_USERNAME'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),

          // Connection resilience settings
          maxRetriesPerRequest: 3,
          connectTimeout: 10000, // 10 seconds
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.error('❌ Redis connection failed after 3 retries');
              logger.warn('   Application will run with degraded performance');
              logger.warn('   Cache, Queue, and Rate Limiting will use fallback strategies');
              return null; // Stop retrying
            }
            const delay = Math.min(times * 1000, 3000);
            logger.warn(`⚠️  Redis retry attempt ${times}/3 in ${delay}ms...`);
            return delay;
          },

          // Lazy connection - won't block application startup
          lazyConnect: true,
          enableReadyCheck: false,
          enableOfflineQueue: true,

          // Keep-alive to prevent connection drops
          keepAlive: 30000, // 30 seconds

          // Auto-pipeline for better performance
          enableAutoPipelining: true,
        });

        // Connection event handlers
        redis.on('connect', () => {
          logger.log('🔌 Connecting to Redis...');
        });

        redis.on('ready', () => {
          logger.log('✅ Redis connection ready');
          logger.log(`   Host: ${configService.get('REDIS_HOST', 'localhost')}`);
          logger.log(`   Port: ${configService.get('REDIS_PORT', 6379)}`);
          logger.log(`   DB: ${configService.get('REDIS_DB', 0)}`);
        });

        redis.on('error', (err) => {
          logger.error(`❌ Redis error: ${err.message}`);
        });

        redis.on('close', () => {
          logger.warn('⚠️  Redis connection closed');
        });

        redis.on('reconnecting', (delay: number) => {
          logger.log(`🔄 Redis reconnecting in ${delay}ms...`);
        });

        redis.on('end', () => {
          logger.warn('⚠️  Redis connection ended');
        });

        // Attempt initial connection (non-blocking)
        redis.connect().catch((err) => {
          logger.error(`❌ Initial Redis connection failed: ${err.message}`);
          logger.warn('   Application will continue with fallback strategies');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection...');
    try {
      await this.redis.quit();
      this.logger.log('✅ Redis connection closed gracefully');
    } catch (error) {
      this.logger.error(`❌ Error closing Redis connection: ${error}`);
    }
  }
}
