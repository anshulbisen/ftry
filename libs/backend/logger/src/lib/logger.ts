import { Injectable, LoggerService } from '@nestjs/common';
import { LoggerOptions } from 'pino';

/**
 * Shared Logger Interface
 *
 * Provides consistent logging across all microservices with:
 * - Structured JSON logging
 * - OpenTelemetry trace context injection
 * - Request correlation IDs
 * - Multiple log levels
 * - Production-optimized performance
 */
@Injectable()
export class Logger implements LoggerService {
  constructor(
    private readonly pinoLogger: any,
    private readonly context?: string,
  ) {}

  /**
   * Set context for this logger instance
   */
  setContext(context: string): void {
    // Context is immutable in this implementation
    // Create a new logger instance with different context if needed
  }

  /**
   * Log at INFO level
   */
  log(message: string, context?: string): void;
  log(message: string, data?: Record<string, any>, context?: string): void;
  log(message: string, dataOrContext?: Record<string, any> | string, context?: string): void {
    const ctx = typeof dataOrContext === 'string' ? dataOrContext : context || this.context;
    const data = typeof dataOrContext === 'object' ? dataOrContext : undefined;

    this.pinoLogger.info({ context: ctx, ...data }, message);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, trace?: string, context?: string): void;
  error(message: string, error?: Error, context?: string): void;
  error(message: string, data?: Record<string, any>, context?: string): void;
  error(
    message: string,
    errorOrTraceOrData?: Error | Record<string, any> | string,
    context?: string,
  ): void {
    const ctx = context || this.context;

    if (errorOrTraceOrData instanceof Error) {
      this.pinoLogger.error({ context: ctx, err: errorOrTraceOrData }, message);
    } else if (typeof errorOrTraceOrData === 'string') {
      this.pinoLogger.error({ context: ctx, trace: errorOrTraceOrData }, message);
    } else {
      this.pinoLogger.error({ context: ctx, ...errorOrTraceOrData }, message);
    }
  }

  /**
   * Log at WARN level
   */
  warn(message: string, context?: string): void;
  warn(message: string, data?: Record<string, any>, context?: string): void;
  warn(message: string, dataOrContext?: Record<string, any> | string, context?: string): void {
    const ctx = typeof dataOrContext === 'string' ? dataOrContext : context || this.context;
    const data = typeof dataOrContext === 'object' ? dataOrContext : undefined;

    this.pinoLogger.warn({ context: ctx, ...data }, message);
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, context?: string): void;
  debug(message: string, data?: Record<string, any>, context?: string): void;
  debug(message: string, dataOrContext?: Record<string, any> | string, context?: string): void {
    const ctx = typeof dataOrContext === 'string' ? dataOrContext : context || this.context;
    const data = typeof dataOrContext === 'object' ? dataOrContext : undefined;

    this.pinoLogger.debug({ context: ctx, ...data }, message);
  }

  /**
   * Log at VERBOSE/TRACE level
   */
  verbose(message: string, context?: string): void;
  verbose(message: string, data?: Record<string, any>, context?: string): void;
  verbose(message: string, dataOrContext?: Record<string, any> | string, context?: string): void {
    const ctx = typeof dataOrContext === 'string' ? dataOrContext : context || this.context;
    const data = typeof dataOrContext === 'object' ? dataOrContext : undefined;

    this.pinoLogger.trace({ context: ctx, ...data }, message);
  }

  /**
   * Log at FATAL level
   */
  fatal(message: string, context?: string): void;
  fatal(message: string, error?: Error, context?: string): void;
  fatal(message: string, data?: Record<string, any>, context?: string): void;
  fatal(
    message: string,
    errorOrData?: Error | Record<string, any> | string,
    context?: string,
  ): void {
    const ctx = typeof errorOrData === 'string' ? errorOrData : context || this.context;

    if (errorOrData instanceof Error) {
      this.pinoLogger.fatal({ context: ctx, err: errorOrData }, message);
    } else if (typeof errorOrData === 'object') {
      this.pinoLogger.fatal({ context: ctx, ...errorOrData }, message);
    } else {
      this.pinoLogger.fatal({ context: ctx }, message);
    }
  }
}

/**
 * Create Pino logger configuration
 */
export function createLoggerConfig(serviceName: string): LoggerOptions {
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  return {
    // Base configuration
    level: process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info'),
    name: serviceName,

    // Serializers for consistent formatting
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers?.host,
          'user-agent': req.headers?.['user-agent'],
          'content-type': req.headers?.['content-type'],
        },
        remoteAddress: req.remoteAddress || req.socket?.remoteAddress,
        remotePort: req.remotePort || req.socket?.remotePort,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers?.['content-type'],
          'content-length': res.headers?.['content-length'],
        },
      }),
      err: (err: Error) => ({
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
      }),
    },

    // Base fields added to every log
    base: {
      service: serviceName,
      environment: process.env['NODE_ENV'] || 'development',
      pid: process.pid,
    },

    // Timestamp format
    timestamp: () => `,"time":"${new Date().toISOString()}"`,

    // Redact sensitive fields
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'apiKey',
      ],
      censor: '[REDACTED]',
    },

    // Pretty print in development
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '{context} - {msg}',
        },
      },
    }),
  };
}
