import { Module, Global } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { MetricsController } from './controllers/metrics.controller';

/**
 * Prometheus Metrics Module
 *
 * This module configures Prometheus metrics collection using prom-client directly.
 * It provides:
 * - Default Node.js metrics (memory, CPU, event loop, etc.)
 * - HTTP request metrics (duration, status codes)
 * - Business metrics (appointments, bookings, revenue)
 * - Database metrics (query duration, connection pool)
 * - Multi-tenant metrics (per-tenant performance tracking)
 *
 * Metrics endpoint: /metrics
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsInterceptor],
  exports: [MetricsService, MetricsInterceptor],
})
export class PrometheusMetricsModule {}
