import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { CsrfService } from '../csrf/csrf.service';

/**
 * CSRF Interceptor
 *
 * Automatically adds CSRF token to response headers for state-changing operations.
 * Works with csrf-csrf library's double submit cookie pattern.
 * Frontend should:
 * 1. Extract token from X-CSRF-Token header from GET /api/v1/auth/csrf endpoint
 * 2. Include token in X-CSRF-Token header for POST/PUT/PATCH/DELETE requests
 *
 * @example
 * // In controller:
 * @Post('login')
 * @UseInterceptors(CsrfInterceptor)
 * async login(@Body() dto: LoginDto) {
 *   // CSRF protected
 * }
 */
@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  constructor(private readonly csrfService: CsrfService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate CSRF token using csrf-csrf library's generator
    const csrfToken = this.csrfService.generateToken(request, response);
    if (csrfToken) {
      response.setHeader('X-CSRF-Token', csrfToken);
    }

    return next.handle();
  }
}
