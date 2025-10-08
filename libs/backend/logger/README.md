# Backend Logger Library

Production-ready logging for NestJS microservices with Pino, OpenTelemetry, and correlation IDs.

## Features

- ✅ **Fast** - Pino is the fastest Node.js logger (~30k msg/s)
- ✅ **Structured** - JSON logs for easy parsing and analysis
- ✅ **OpenTelemetry** - Automatic trace context injection
- ✅ **Correlation IDs** - Track requests across services
- ✅ **NestJS Integration** - Drop-in replacement for NestJS Logger
- ✅ **Auto-logging** - HTTP requests/responses logged automatically
- ✅ **Sensitive Data** - Auto-redaction of passwords, tokens, etc.
- ✅ **Pretty Dev Mode** - Colorized output in development
- ✅ **Production Ready** - Optimized for production performance

## Installation

The logger is already installed. Just import and use:

```typescript
import { LoggerModule } from '@ftry/backend/logger';
```

## Usage

### 1. Setup in AppModule

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@ftry/backend/logger';

@Module({
  imports: [
    LoggerModule.forRoot({ serviceName: 'my-service' }),
    // ... other imports
  ],
})
export class AppModule {}
```

### 2. Use in Services/Controllers

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from '@ftry/backend/logger';

@Injectable()
export class MyService {
  constructor(
    @InjectPinoLogger(MyService.name)
    private readonly logger: PinoLogger,
  ) {}

  async doSomething() {
    // Simple logging
    this.logger.log('Processing request');

    // With additional data
    this.logger.log({ userId: '123', action: 'update' }, 'User action performed');

    // Error logging
    try {
      // ... some code
    } catch (error) {
      this.logger.error({ err: error }, 'Operation failed');
    }

    // Different log levels
    this.logger.debug('Debug information');
    this.logger.info('Informational message');
    this.logger.warn('Warning message');
    this.logger.error('Error message');
    this.logger.fatal('Fatal error');
  }
}
```

### 3. Use with NestJS Logger Interface

If you prefer the standard NestJS Logger interface:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('This works too!');
    this.logger.error('Error occurred', error.stack);
    this.logger.warn('Warning message');
    this.logger.debug('Debug info');
  }
}
```

## Log Levels

| Level   | When to Use                | Example                                 |
| ------- | -------------------------- | --------------------------------------- |
| `fatal` | Application crashes        | Database connection lost, out of memory |
| `error` | Errors that need attention | API call failed, validation error       |
| `warn`  | Warnings, degraded state   | Slow query, deprecated API usage        |
| `info`  | Important events           | User logged in, order created           |
| `debug` | Debugging information      | Function entry/exit, variable values    |
| `trace` | Verbose debugging          | Very detailed execution flow            |

**Default Levels:**

- Development: `debug` (shows everything)
- Production: `info` (shows info and above)

Set `LOG_LEVEL` env variable to override: `LOG_LEVEL=debug`

## Features Explained

### OpenTelemetry Trace Context

Automatically includes trace IDs in logs:

```json
{
  "level": "info",
  "time": "2025-10-08T10:30:00.000Z",
  "msg": "Processing order",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "userId": "123"
}
```

This allows you to:

- Correlate logs with traces in Grafana Cloud
- Track requests across multiple services
- Debug distributed transactions

### Request Correlation IDs

Every HTTP request gets a unique ID:

```json
{
  "req": {
    "id": "1696766400123-abc123def456",
    "method": "POST",
    "url": "/api/orders"
  }
}
```

Use `x-request-id` or `x-correlation-id` header to pass IDs between services.

### Automatic Request Logging

HTTP requests are automatically logged:

```json
{
  "level": "info",
  "time": "2025-10-08T10:30:00.123Z",
  "msg": "POST /api/orders 201",
  "req": {
    "method": "POST",
    "url": "/api/orders",
    "headers": {
      "content-type": "application/json"
    }
  },
  "res": {
    "statusCode": 201
  },
  "responseTime": 45
}
```

Health checks (`/health`, `/metrics`) are excluded from auto-logging.

### Sensitive Data Redaction

Sensitive fields are automatically redacted:

```json
{
  "password": "[REDACTED]",
  "req": {
    "headers": {
      "authorization": "[REDACTED]",
      "cookie": "[REDACTED]"
    }
  }
}
```

Redacted fields:

- `password`, `token`, `secret`, `apiKey`
- `accessToken`, `refreshToken`
- HTTP headers: `authorization`, `cookie`

### Pretty Logs in Development

Development mode shows colorized, readable logs:

```
[14:30:00.123] INFO (MyService): Processing order
    userId: "123"
    orderId: "order_456"
    trace_id: "4bf92f3577b34da6a3ce929d0e0e4736"
```

Production mode uses compact JSON for performance.

## Best Practices

### ✅ DO

```typescript
// Include context
this.logger.log({ userId, orderId }, 'Order created');

// Log errors with context
this.logger.error({ err, userId }, 'Failed to create order');

// Use appropriate log levels
this.logger.warn({ responseTime: 5000 }, 'Slow API response');

// Add context to logger
constructor(@InjectPinoLogger(MyService.name) private readonly logger: PinoLogger) {}
```

### ❌ DON'T

```typescript
// Don't use console.log (ESLint will error)
console.log('This is not allowed in backend code');

// Don't log sensitive data directly
this.logger.log({ password: user.password }); // Use redaction instead

// Don't log in tight loops without level check
for (let i = 0; i < 10000; i++) {
  this.logger.debug(`Item ${i}`); // Expensive in production!
}

// Don't use string concatenation
this.logger.log('User ' + userId + ' logged in'); // Use object instead
```

## Configuration

### Environment Variables

```bash
# Log level (trace | debug | info | warn | error | fatal)
LOG_LEVEL=info

# Node environment
NODE_ENV=production

# Service name (set in LoggerModule.forRoot)
SERVICE_NAME=my-service
```

### Custom Configuration

```typescript
import { createLoggerConfig } from '@ftry/backend/logger';

const config = createLoggerConfig('my-service');
// Customize config as needed
```

## ESLint Rule

Backend code CANNOT use `console.log`:

```typescript
// ❌ This will cause ESLint error
console.log('Hello');

// ✅ Use logger instead
this.logger.log('Hello');

// ✅ console.warn and console.error are allowed (for special cases)
console.warn('Startup warning');
console.error('Critical startup error');
```

**Enforced in:**

- `apps/backend/**/*.ts`
- `libs/backend/**/*.ts`
- `libs/shared/**/*.ts` (except tests)

**Not enforced in:**

- Frontend code
- Test files (`*.spec.ts`)
- Scripts

## Performance

Pino is designed for high performance:

- **Async logging** - Uses worker threads
- **JSON stringification** - Optimized serialization
- **Minimal overhead** - <1ms per log in production
- **Zero dependencies** - No external deps in production

**Benchmarks:**

- Pino: ~30,000 msg/s
- Winston: ~9,000 msg/s
- Bunyan: ~6,000 msg/s

## Integration with Grafana Cloud

Logs automatically include:

- `trace_id` - Links to traces in Tempo
- `span_id` - Current span context
- `service` - Service name for filtering
- `environment` - Environment label

Query logs in Grafana Loki:

```
{service="ftry-backend-anshul"} |= "userId" | json
```

Correlate with traces:

```
View trace → See all logs for this trace_id
```

## Troubleshooting

### Logs not appearing

Check log level:

```bash
LOG_LEVEL=debug bun run dev
```

### Pretty logs in production

Set `NODE_ENV=production` to disable pretty logging.

### Missing trace context

Ensure OpenTelemetry is initialized before creating loggers.

### TypeScript errors

Install type definitions:

```bash
bun add -D @types/pino
```

## Examples

### Structured Logging

```typescript
this.logger.log(
  {
    action: 'user.login',
    userId: user.id,
    email: user.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  },
  'User logged in successfully',
);
```

### Error Handling

```typescript
try {
  await this.processOrder(order);
} catch (error) {
  this.logger.error(
    {
      err: error,
      orderId: order.id,
      userId: order.userId,
    },
    'Failed to process order',
  );
  throw error;
}
```

### Performance Logging

```typescript
const start = Date.now();
const result = await this.expensiveOperation();
const duration = Date.now() - start;

this.logger.info(
  {
    operation: 'expensiveOperation',
    duration,
    resultSize: result.length,
  },
  'Operation completed',
);
```

## Why Pino?

We chose Pino over alternatives because:

1. **Performance** - 3x faster than Winston, 5x faster than Bunyan
2. **OpenTelemetry** - First-class OTel support
3. **NestJS** - Excellent integration via `nestjs-pino`
4. **JSON** - Native structured logging
5. **Production Ready** - Used by Netflix, PayPal, Elastic
6. **Active** - Well-maintained, frequent updates

## Learn More

- [Pino Documentation](https://getpino.io/)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [OpenTelemetry Logs](https://opentelemetry.io/docs/concepts/signals/logs/)
- [Grafana Loki Query Language](https://grafana.com/docs/loki/latest/query/)
