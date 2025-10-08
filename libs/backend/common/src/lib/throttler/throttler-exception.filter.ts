import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

/**
 * Custom exception filter for rate limiting
 *
 * Provides informative error messages when rate limits are exceeded.
 * Includes retry-after header for client backoff.
 *
 * @example
 * // In main.ts:
 * app.useGlobalFilters(new ThrottlerExceptionFilter());
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = HttpStatus.TOO_MANY_REQUESTS;
    const exceptionResponse: any = exception.getResponse();

    // Extract retry-after from exception or default to 60 seconds
    const retryAfter = exceptionResponse?.retryAfter || 60;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: 'Too many requests. Please try again later.',
      error: 'Too Many Requests',
      path: request.url,
      retryAfter, // Seconds until rate limit resets
      timestamp: new Date().toISOString(),
    });
  }
}
