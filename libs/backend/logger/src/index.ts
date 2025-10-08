/**
 * Shared Logger Library
 *
 * Production-ready logging for NestJS microservices with:
 * - Pino (fastest Node.js logger)
 * - OpenTelemetry trace context
 * - Request correlation IDs
 * - Structured JSON logging
 */

export * from './lib/logger';
export * from './lib/logger.module';

// Re-export nestjs-pino for convenience
export { Logger as PinoLogger, InjectPinoLogger } from 'nestjs-pino';
