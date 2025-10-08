import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

/**
 * Metrics Interceptor
 *
 * This interceptor automatically tracks HTTP request metrics:
 * - Request duration (histogram with P50, P95, P99)
 * - Request count (counter)
 * - Labels: method, route, status_code, tenant_id
 *
 * Apply globally or to specific controllers/routes.
 *
 * @example
 * // Apply globally in main.ts
 * app.useGlobalInterceptors(app.get(MetricsInterceptor));
 *
 * @example
 * // Apply to specific controller
 * @UseInterceptors(MetricsInterceptor)
 * @Controller('appointments')
 * export class AppointmentsController {}
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    // Extract tenant ID from authenticated user
    const tenantId = request.user?.tenantId || 'unknown';

    // Extract route pattern (e.g., /api/v1/appointments/:id)
    const route = request.route?.path || 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          // Success - record metrics
          this.recordMetrics(request, context, startTime, tenantId, route);
        },
        error: (error) => {
          // Error - record metrics with error status
          this.recordMetrics(request, context, startTime, tenantId, route, error);
        },
      }),
    );
  }

  /**
   * Record HTTP request metrics
   */
  private recordMetrics(
    request: any,
    context: ExecutionContext,
    startTime: number,
    tenantId: string,
    route: string,
    error?: Error,
  ): void {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const response = context.switchToHttp().getResponse();
    const statusCode = error ? (error as any).status || 500 : response.statusCode;

    // Record HTTP request metrics
    this.metricsService.recordHttpRequest(request.method, route, statusCode, tenantId, duration);
  }
}
