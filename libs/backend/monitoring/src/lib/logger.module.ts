import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { Request } from 'express';

/**
 * Structured Logging Module using Pino
 *
 * This module provides structured JSON logging with:
 * - Request/response logging with trace context
 * - Multi-tenant support (tenant_id in logs)
 * - Integration with Loki for log aggregation
 * - Development-friendly pretty printing
 * - Production-optimized JSON output
 *
 * Log levels: trace, debug, info, warn, error, fatal
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        // Log level from environment or default to 'info'
        level: process.env['LOG_LEVEL'] || 'info',

        // Transport for development (pretty printing)
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  singleLine: false,
                  messageFormat: '{tenant_id} {context} - {msg}',
                },
              }
            : undefined,

        // Custom log format
        formatters: {
          level: (label: string) => {
            return { level: label };
          },
          bindings: (bindings: Record<string, unknown>) => {
            return {
              pid: bindings.pid,
              hostname: bindings.hostname,
              node_version: process.version,
            };
          },
        },

        // Serializers for request/response
        serializers: {
          req: (req: any) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            path: req.path,
            // Include trace context for correlation with Tempo
            trace_id: req.headers['x-trace-id'] as string,
            span_id: req.headers['x-span-id'] as string,
            // Include tenant context for multi-tenancy
            tenant_id: (req as any).user?.tenantId || 'unknown',
            user_id: (req as any).user?.id || 'anonymous',
            // Client information
            user_agent: req.headers['user-agent'],
            ip: req.ip || req.socket.remoteAddress,
          }),
          res: (res: any) => ({
            statusCode: res.statusCode,
          }),
          err: (err: Error) => ({
            type: err.name,
            message: err.message,
            stack: err.stack,
          }),
        },

        // Redact sensitive information
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.confirmPassword',
            'req.body.oldPassword',
            'req.body.newPassword',
            'req.body.token',
            'req.body.refreshToken',
            'res.headers["set-cookie"]',
            // Add more sensitive fields as needed
          ],
          remove: true,
        },

        // Automatic request ID generation
        genReqId: (req: any) => {
          // Use existing trace ID if available, otherwise generate new ID
          return (req.headers?.['x-request-id'] as string) || crypto.randomUUID();
        },

        // Custom log level assignment based on response
        customLogLevel: (req: any, res: any, err?: Error) => {
          if (err || res.statusCode >= 500) {
            return 'error';
          }
          if (res.statusCode >= 400) {
            return 'warn';
          }
          if (res.statusCode >= 300) {
            return 'info';
          }
          return 'info';
        },

        // Custom success message
        customSuccessMessage: (req: any, res: any) => {
          return `${req.method} ${req.url} ${res.statusCode}`;
        },

        // Custom error message
        customErrorMessage: (req: any, res: any, err: Error) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
        },

        // Custom attribute keys
        customAttributeKeys: {
          req: 'request',
          res: 'response',
          err: 'error',
          responseTime: 'duration_ms',
        },

        // Custom props to add to each log entry
        customProps: (req: any) => ({
          // Environment information
          environment: process.env['NODE_ENV'] || 'development',
          service: 'ftry-backend',
          version: process.env['APP_VERSION'] || '1.0.0',

          // Tenant context (for multi-tenant filtering in Loki)
          tenant_id: req.user?.tenantId || 'unknown',
          user_id: req.user?.id || 'anonymous',

          // Trace context (for correlation with Tempo)
          trace_id: (req.headers?.['x-trace-id'] as string) || '',
          span_id: (req.headers?.['x-span-id'] as string) || '',
        }),

        // Auto-logging of requests
        autoLogging: {
          ignore: (req: any) => {
            // Don't log health check and metrics endpoints
            return (
              req.url === '/api/health' ||
              req.url === '/api/metrics' ||
              req.url === '/health' ||
              req.url === '/metrics'
            );
          },
        },
      },
    }),
  ],
})
export class LoggerConfigModule {}
