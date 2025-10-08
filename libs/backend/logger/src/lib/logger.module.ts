import { Module, DynamicModule, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { createLoggerConfig } from './logger';

export interface LoggerModuleOptions {
  serviceName: string;
}

/**
 * Shared Logger Module
 *
 * Provides consistent logging across all NestJS microservices.
 *
 * Features:
 * - Structured JSON logging (Pino)
 * - OpenTelemetry trace context injection
 * - Request correlation IDs
 * - Automatic request/response logging
 * - Performance optimized
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [LoggerModule.forRoot({ serviceName: 'my-service' })],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        PinoLoggerModule.forRoot({
          pinoHttp: {
            ...createLoggerConfig(options.serviceName),

            // Custom log level for HTTP requests
            customLogLevel: (req: IncomingMessage, res: ServerResponse, err?: Error) => {
              if (res.statusCode && res.statusCode >= 400 && res.statusCode < 500) {
                return 'warn';
              } else if ((res.statusCode && res.statusCode >= 500) || err) {
                return 'error';
              } else if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
                return 'silent'; // Don't log redirects
              }
              return 'info';
            },

            // Custom success message
            customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
              return `${req.method} ${req.url} ${res.statusCode}`;
            },

            // Custom error message
            customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
            },

            // Automatically log all HTTP requests
            autoLogging: {
              ignore: (req: IncomingMessage) => {
                // Don't log health checks
                const url = req.url || '';
                return url.includes('/health') || url.includes('/metrics');
              },
            },

            // Generate correlation ID for each request
            genReqId: (req: IncomingMessage): string => {
              // Use existing request ID from header if available
              const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
              if (existingId) {
                const id = Array.isArray(existingId) ? existingId[0] : existingId;
                if (id) return id;
              }

              // Generate new UUID-style ID
              return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            },
          } as any, // Type assertion needed for OpenTelemetry mixin support
        }),
      ],
      exports: [PinoLoggerModule],
    };
  }
}
