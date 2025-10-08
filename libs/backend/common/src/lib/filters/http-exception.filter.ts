import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { errorResponse } from '@ftry/shared/utils';

/**
 * Global HTTP Exception Filter
 * Standardizes error responses across the entire application
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;
    let validationErrors: string[] | undefined;

    // Handle different exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj['message'] as string) || exception.message;
        error = (responseObj['error'] as string) || exception.name;

        // Extract validation errors from class-validator
        if (status === HttpStatus.BAD_REQUEST || status === HttpStatus.UNPROCESSABLE_ENTITY) {
          if (Array.isArray(responseObj['message'])) {
            validationErrors = responseObj['message'] as string[];
            message = 'Validation failed';
          }
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('Unknown error type', exception);
    }

    // Create standardized error response
    const errorResponseData = errorResponse(message, error);

    // Add additional context
    const fullResponse = {
      ...errorResponseData,
      statusCode: status,
      path: request.url,
      method: request.method,
      ...(validationErrors && { validationErrors }),
    };

    // Log errors (except expected client errors)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - Status: ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(`${request.method} ${request.url} - Status: ${status} - ${message}`);
    }

    response.status(status).json(fullResponse);
  }
}
