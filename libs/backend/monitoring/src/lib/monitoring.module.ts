import { Module, Global } from '@nestjs/common';
import { PrometheusMetricsModule } from './prometheus.module';

/**
 * Monitoring Module
 *
 * This global module provides comprehensive observability for the ftry backend:
 *
 * 1. **Metrics (Prometheus)**:
 *    - HTTP request metrics (duration, count, status codes)
 *    - Business metrics (appointments, bookings, revenue)
 *    - Database metrics (query duration, connection pool)
 *    - Cache metrics (hits, misses, operation duration)
 *    - Multi-tenant metrics (per-tenant performance tracking)
 *
 * 2. **Logging (Pino + Loki)**:
 *    - Structured JSON logging
 *    - Request/response logging with trace context
 *    - Multi-tenant log filtering
 *    - Sensitive data redaction
 *
 * 3. **Tracing (OpenTelemetry + Tempo)**:
 *    - Distributed request tracing
 *    - Automatic instrumentation (HTTP, DB, Redis)
 *    - Trace-log-metric correlation
 *
 * ## Setup
 *
 * ### 1. Initialize tracing (main.ts - BEFORE creating NestJS app)
 * ```typescript
 * import { initTracing } from '@ftry/backend/monitoring';
 *
 * // Initialize tracing FIRST
 * initTracing();
 *
 * // Then create NestJS app
 * const app = await NestFactory.create(AppModule);
 * ```
 *
 * ### 2. Import monitoring module (app.module.ts)
 * ```typescript
 * import { MonitoringModule } from '@ftry/backend/monitoring';
 *
 * @Module({
 *   imports: [MonitoringModule, ...],
 * })
 * export class AppModule {}
 * ```
 *
 * ### 3. Apply metrics interceptor globally (main.ts)
 * ```typescript
 * import { MetricsInterceptor } from '@ftry/backend/monitoring';
 *
 * app.useGlobalInterceptors(app.get(MetricsInterceptor));
 * ```
 *
 * ## Usage
 *
 * ### Record business metrics
 * ```typescript
 * import { MetricsService } from '@ftry/backend/monitoring';
 *
 * constructor(private readonly metrics: MetricsService) {}
 *
 * // Track appointment creation
 * this.metrics.recordAppointmentCreated(tenantId, 'confirmed', 'haircut');
 *
 * // Track revenue
 * this.metrics.recordRevenue(tenantId, 50000, 'haircut', 'card'); // ₹500.00
 * ```
 *
 * ### Structured logging
 * ```typescript
 * import { Logger } from '@nestjs/common';
 *
 * private readonly logger = new Logger(MyService.name);
 *
 * this.logger.log('Appointment created', {
 *   appointmentId: '123',
 *   tenantId: 'tenant-1',
 *   serviceType: 'haircut',
 * });
 * ```
 *
 * ## Metrics Endpoint
 *
 * - **URL**: `/api/metrics`
 * - **Format**: Prometheus exposition format
 * - **Access**: Configure authentication in production
 *
 * ## Environment Variables
 *
 * ```bash
 * # Logging
 * LOG_LEVEL=info  # trace | debug | info | warn | error | fatal
 *
 * # Tracing
 * OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
 * APP_VERSION=1.0.0
 * ```
 */
@Global()
@Module({
  imports: [PrometheusMetricsModule],
  providers: [],
  exports: [PrometheusMetricsModule],
})
export class MonitoringModule {}
