# Backend Redis Module

Shared Redis connection module for the ftry backend. Provides a single, production-ready Redis connection pool used by all modules.

## Overview

This module implements the **recommended production architecture** for NestJS applications using Redis. Instead of creating separate Redis connections for each feature (cache, queue, throttler), it provides a **single shared connection pool** that all modules reuse.

### Benefits

✅ **Single Connection Pool** - More efficient resource usage
✅ **Centralized Configuration** - One place to manage Redis settings
✅ **Better Error Handling** - Graceful degradation and automatic retries
✅ **Health Monitoring** - Built-in health checks and diagnostics
✅ **Production Ready** - Proper connection management, timeouts, and keep-alive
✅ **No Docker Crashes** - Resilient connection handling prevents system crashes

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   RedisModule                       │
│                 (Global, Single Instance)           │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │         Redis Connection Pool              │  │
│  │  - Lazy connect (non-blocking)             │  │
│  │  - Auto-reconnect with exponential backoff │  │
│  │  - Connection timeout: 10s                 │  │
│  │  - Max retries: 3                          │  │
│  │  - Keep-alive: 30s                         │  │
│  └─────────────────────────────────────────────┘  │
│                       │                             │
└───────────────────────┼─────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼────┐  ┌────▼─────┐  ┌───▼──────┐
    │  Cache   │  │  Queue   │  │Throttler │
    │  Module  │  │  Module  │  │  Module  │
    └──────────┘  └──────────┘  └──────────┘
```

## Installation

The module is automatically available as `@ftry/backend/redis`.

## Usage

### 1. Import RedisModule

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@ftry/backend/redis';

@Module({
  imports: [RedisModule],
  // ...
})
export class AppModule {}
```

### 2. Inject Redis Client or Service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT, RedisService } from '@ftry/backend/redis';
import type Redis from 'ioredis';

@Injectable()
export class MyService {
  constructor(
    // Option 1: Inject Redis client directly
    @Inject(REDIS_CLIENT) private readonly redis: Redis,

    // Option 2: Inject Redis service (recommended)
    private readonly redisService: RedisService,
  ) {}

  async doSomething() {
    // Using client directly
    await this.redis.set('key', 'value');
    const value = await this.redis.get('key');

    // Using service wrapper
    const isHealthy = await this.redisService.isHealthy();
    const stats = await this.redisService.getMemoryStats();
  }
}
```

### 3. Use Specialized Connections for Modules

Different modules have different Redis connection requirements:

#### For Bull/BullMQ (Queue Module)

Bull requires `maxRetriesPerRequest: null` - use `createBullConnection()`:

```typescript
import { RedisService } from '@ftry/backend/redis';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        createClient: () => redisService.createBullConnection(), // ← Bull-compatible
      }),
    }),
  ],
})
export class QueueModule {}
```

**Note**: Bull doesn't support `maxRetriesPerRequest` with a number value. See [Bull Issue #1873](https://github.com/OptimalBits/bull/issues/1873).

#### For Other Modules (Throttler, Sessions)

For modules that need their own connection but don't have Bull's restrictions, use `duplicate()`:

```typescript
import { RedisService } from '@ftry/backend/redis';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        storage: new RedisThrottlerStorage(redisService.duplicate()), // ← Standard duplicate
      }),
    }),
  ],
})
export class AppModule {}
```

## Configuration

Configure Redis via environment variables:

```bash
# .env
REDIS_HOST=redis-17992.crce217.ap-south-1-1.ec2.redns.redis-cloud.com  # Redis Cloud host
REDIS_PORT=17992                                                         # Redis Cloud port
REDIS_USERNAME=default                                                   # Redis Cloud username
REDIS_PASSWORD=byPbq9DosLA7pYbMeJnyP65sWoS4zas9                          # Redis Cloud password
REDIS_DB=0                                                                # Redis database number
```

**Note**: This project uses **Redis Cloud** (free tier) instead of local Docker Redis.

## Connection Management

### Automatic Reconnection

The module automatically reconnects on connection failure with exponential backoff:

- **Retry 1**: Wait 1 second
- **Retry 2**: Wait 2 seconds
- **Retry 3**: Wait 3 seconds
- **After 3 retries**: Stop retrying, log error, continue with degraded functionality

### Lazy Connection

The Redis connection is **lazy** - it won't block application startup if Redis is unavailable. The app will start and Redis will connect in the background.

### Graceful Shutdown

The module automatically closes the Redis connection when the application shuts down.

## Health Checks

### Using RedisService

```typescript
import { RedisService } from '@ftry/backend/redis';

const isHealthy = await redisService.isHealthy(); // Returns true/false
const state = redisService.getConnectionState(); // 'connected', 'reconnecting', etc.
```

### Using Health Indicator

```typescript
import { RedisHealthIndicator } from '@ftry/backend/health';

@Get('health')
@HealthCheck()
async check() {
  return this.health.check([
    () => this.redisHealth.isHealthy('redis'), // Detailed check
    () => this.redisHealth.pingCheck('redis'),  // Quick ping
  ]);
}
```

## Monitoring & Diagnostics

### Get Redis Info

```typescript
const info = await redisService.getInfo();
// Returns: { redis_version, connected_clients, used_memory, ... }
```

### Get Memory Statistics

```typescript
const memStats = await redisService.getMemoryStats();
// Returns: { used: '2.5M', peak: '3.1M', fragmentation: '1.03' }
```

### Get Connected Clients

```typescript
const clientCount = await redisService.getConnectedClients();
// Returns: 5
```

### Get Database Size

```typescript
const keyCount = await redisService.getDbSize();
// Returns: 1234
```

## Event Logging

The module logs all connection events:

```
🔌 Connecting to Redis...
✅ Redis connection ready
   Host: localhost
   Port: 6379
   DB: 0

❌ Redis error: Connection refused
🔄 Redis reconnecting in 1000ms...
⚠️  Redis connection closed
```

## Error Handling

### Connection Failures

If Redis fails to connect, the application **continues running** with degraded functionality:

- **CacheModule**: Falls back to in-memory cache
- **QueueModule**: Queues jobs in memory until Redis connects
- **ThrottlerModule**: Uses memory-based rate limiting

### Preventing Docker Crashes

Previous implementation could crash Docker Desktop due to aggressive retry logic. The new implementation:

✅ Limited to 3 retries with delays
✅ Lazy connection (non-blocking)
✅ Proper error handling
✅ Graceful degradation

## Best Practices

### ✅ DO

- Import `RedisModule` in your root `AppModule`
- Use `RedisService` for common operations
- Use `duplicate()` for modules that need separate connections (Bull, etc.)
- Check `isHealthy()` before critical operations
- Monitor memory usage in production

### ❌ DON'T

- Create new Redis instances manually
- Use multiple Redis modules
- Skip health checks in critical flows
- Ignore connection state in production

## Migration from Previous Setup

If you're migrating from the old multi-connection setup:

### Before (❌ Old Way)

```typescript
// Separate connections in each module
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: await redisStore({
          socket: { host: 'localhost', port: 6379 }, // Connection #1
        }),
      }),
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: { host: 'localhost', port: 6379 }, // Connection #2
      }),
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        storage: new RedisThrottlerStorage(
          new Redis({ host: 'localhost', port: 6379 }) // Connection #3
        ),
      }),
    }),
  ],
})
```

### After (✅ New Way)

```typescript
// Single shared connection
@Module({
  imports: [
    RedisModule, // Single connection pool
    CacheModule, // Uses shared connection
    QueueModule, // Uses shared connection
    ThrottlerModule, // Uses shared connection
  ],
})
```

## Troubleshooting

### Redis Not Connecting

1. Check internet connection (cloud service required)
2. Verify Redis Cloud credentials in `.env`
3. Ensure Redis Cloud instance is active (check https://redis.io/cloud/)
4. Check logs for connection errors

### Performance Issues

1. Check memory usage: `redisService.getMemoryStats()`
2. Check connected clients: `redisService.getConnectedClients()`
3. Check database size: `redisService.getDbSize()`
4. Consider enabling Redis persistence if needed

### Connection Keeps Dropping

1. Check keep-alive settings (default: 30s)
2. Check network stability
3. Check Redis server logs
4. Consider adjusting retry strategy

## API Reference

### RedisService

| Method                   | Returns                           | Description                                                    |
| ------------------------ | --------------------------------- | -------------------------------------------------------------- |
| `getClient()`            | `Redis`                           | Get underlying Redis client                                    |
| `duplicate()`            | `Redis`                           | Create duplicated connection (for Throttler, etc.)             |
| `createBullConnection()` | `Redis`                           | Create Bull-compatible connection (maxRetriesPerRequest: null) |
| `isHealthy()`            | `Promise<boolean>`                | Check if Redis is connected                                    |
| `getConnectionState()`   | `RedisConnectionState`            | Get current connection state                                   |
| `getInfo()`              | `Promise<Record<string, string>>` | Get Redis server info                                          |
| `getMemoryStats()`       | `Promise<MemoryStats>`            | Get memory usage statistics                                    |
| `getConnectedClients()`  | `Promise<number>`                 | Get connected client count                                     |
| `getDbSize()`            | `Promise<number>`                 | Get number of keys in DB                                       |
| `flushDb()`              | `Promise<void>`                   | ⚠️ Flush current database                                      |

### Constants

| Constant               | Type     | Description                      |
| ---------------------- | -------- | -------------------------------- |
| `REDIS_CLIENT`         | `Symbol` | Injection token for Redis client |
| `RedisConnectionState` | `enum`   | Connection state enum            |

## Examples

See `/docs/examples/redis-usage.md` for complete examples.

## Related Modules

- `@ftry/backend/cache` - Caching with Redis
- `@ftry/backend/queue` - Background jobs with Bull
- `@ftry/backend/health` - Health checks with Redis indicator

## License

Private - All Rights Reserved
