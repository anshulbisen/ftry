import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';

/**
 * Metrics Controller
 *
 * Exposes Prometheus metrics at /metrics endpoint.
 * This endpoint should be scraped by Prometheus server.
 *
 * Security Note: In production, consider adding authentication
 * or restricting access to internal networks only.
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Get all metrics in Prometheus format
   *
   * @returns Metrics in Prometheus exposition format
   */
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
