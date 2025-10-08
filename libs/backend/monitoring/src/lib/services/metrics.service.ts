import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Metrics Service
 *
 * Centralized service for recording business and application metrics.
 * Uses prom-client directly for full control and compatibility.
 *
 * @example
 * // Inject in your service
 * constructor(private readonly metrics: MetricsService) {}
 *
 * // Track an appointment creation
 * this.metrics.recordAppointmentCreated(tenantId, 'confirmed', 'haircut');
 *
 * // Track revenue
 * this.metrics.recordRevenue(tenantId, 50000, 'haircut', 'card'); // ₹500.00
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  // Prometheus registry
  public readonly registry: Registry;

  // HTTP Metrics
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestsTotal: Counter<string>;

  // Business Metrics
  private readonly appointmentsCreated: Counter<string>;
  private readonly appointmentsCancelled: Counter<string>;
  private readonly appointmentsCompleted: Counter<string>;
  private readonly bookingsTotal: Counter<string>;
  private readonly revenueTotal: Counter<string>;
  private readonly activeUsers: Gauge<string>;
  private readonly userRegistrations: Counter<string>;

  // Database Metrics
  private readonly databaseQueryDuration: Histogram<string>;
  private readonly databaseConnectionPool: Gauge<string>;
  private readonly databaseErrors: Counter<string>;

  // Cache Metrics
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;
  private readonly cacheOperationDuration: Histogram<string>;

  // Authentication Metrics
  private readonly loginAttempts: Counter<string>;
  private readonly passwordResetRequests: Counter<string>;

  // Health Metrics
  private readonly appHealthStatus: Gauge<string>;

  constructor() {
    // Create a new registry
    this.registry = new Registry();

    // Set default labels for all metrics
    this.registry.setDefaultLabels({
      app: 'ftry-backend',
    });

    // ========================================================================
    // HTTP REQUEST METRICS
    // ========================================================================

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'tenant_id'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'tenant_id'],
      registers: [this.registry],
    });

    // ========================================================================
    // BUSINESS METRICS - Appointments
    // ========================================================================

    this.appointmentsCreated = new Counter({
      name: 'appointments_created_total',
      help: 'Total number of appointments created',
      labelNames: ['tenant_id', 'status', 'service_type'],
      registers: [this.registry],
    });

    this.appointmentsCancelled = new Counter({
      name: 'appointments_cancelled_total',
      help: 'Total number of appointments cancelled',
      labelNames: ['tenant_id', 'cancellation_reason'],
      registers: [this.registry],
    });

    this.appointmentsCompleted = new Counter({
      name: 'appointments_completed_total',
      help: 'Total number of appointments completed',
      labelNames: ['tenant_id', 'service_type'],
      registers: [this.registry],
    });

    // ========================================================================
    // BUSINESS METRICS - Bookings & Revenue
    // ========================================================================

    this.bookingsTotal = new Counter({
      name: 'bookings_total',
      help: 'Total number of bookings',
      labelNames: ['tenant_id', 'service_type', 'booking_source'],
      registers: [this.registry],
    });

    this.revenueTotal = new Counter({
      name: 'revenue_total_paisa',
      help: 'Total revenue in paisa (1 rupee = 100 paisa)',
      labelNames: ['tenant_id', 'service_type', 'payment_method'],
      registers: [this.registry],
    });

    // ========================================================================
    // BUSINESS METRICS - Users & Activity
    // ========================================================================

    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users',
      labelNames: ['tenant_id', 'role'],
      registers: [this.registry],
    });

    this.userRegistrations = new Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['tenant_id', 'role', 'registration_source'],
      registers: [this.registry],
    });

    // ========================================================================
    // DATABASE METRICS
    // ========================================================================

    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['query_type', 'table', 'tenant_id'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    this.databaseConnectionPool = new Gauge({
      name: 'database_connection_pool_size',
      help: 'Current database connection pool size',
      labelNames: ['pool_type'],
      registers: [this.registry],
    });

    this.databaseErrors = new Counter({
      name: 'database_errors_total',
      help: 'Total number of database errors',
      labelNames: ['error_type', 'table', 'tenant_id'],
      registers: [this.registry],
    });

    // ========================================================================
    // CACHE METRICS
    // ========================================================================

    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_key_prefix', 'tenant_id'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_key_prefix', 'tenant_id'],
      registers: [this.registry],
    });

    this.cacheOperationDuration = new Histogram({
      name: 'cache_operation_duration_seconds',
      help: 'Cache operation duration in seconds',
      labelNames: ['operation', 'cache_key_prefix'],
      buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
      registers: [this.registry],
    });

    // ========================================================================
    // AUTHENTICATION METRICS
    // ========================================================================

    this.loginAttempts = new Counter({
      name: 'login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['status', 'tenant_id'],
      registers: [this.registry],
    });

    this.passwordResetRequests = new Counter({
      name: 'password_reset_requests_total',
      help: 'Total number of password reset requests',
      labelNames: ['tenant_id'],
      registers: [this.registry],
    });

    // ========================================================================
    // HEALTH METRICS
    // ========================================================================

    this.appHealthStatus = new Gauge({
      name: 'app_health_status',
      help: 'Application health status (1=healthy, 0=unhealthy)',
      labelNames: ['component'],
      registers: [this.registry],
    });
  }

  /**
   * Initialize default metrics (Node.js runtime metrics)
   */
  onModuleInit() {
    // Collect default metrics (memory, CPU, event loop, etc.)
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'ftry_',
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // ==========================================================================
  // HTTP METRICS
  // ==========================================================================

  /**
   * Record HTTP request
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    tenantId: string,
    durationSeconds: number,
  ): void {
    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
      tenant_id: tenantId || 'unknown',
    };

    this.httpRequestDuration.observe(labels, durationSeconds);
    this.httpRequestsTotal.inc(labels);
  }

  // ==========================================================================
  // APPOINTMENT METRICS
  // ==========================================================================

  /**
   * Record appointment creation
   */
  recordAppointmentCreated(tenantId: string, status: string, serviceType: string): void {
    this.appointmentsCreated.inc({ tenant_id: tenantId, status, service_type: serviceType });
  }

  /**
   * Record appointment cancellation
   */
  recordAppointmentCancelled(tenantId: string, cancellationReason: string): void {
    this.appointmentsCancelled.inc({
      tenant_id: tenantId,
      cancellation_reason: cancellationReason,
    });
  }

  /**
   * Record appointment completion
   */
  recordAppointmentCompleted(tenantId: string, serviceType: string): void {
    this.appointmentsCompleted.inc({ tenant_id: tenantId, service_type: serviceType });
  }

  // ==========================================================================
  // BOOKING & REVENUE METRICS
  // ==========================================================================

  /**
   * Record booking
   */
  recordBooking(tenantId: string, serviceType: string, bookingSource: string): void {
    this.bookingsTotal.inc({
      tenant_id: tenantId,
      service_type: serviceType,
      booking_source: bookingSource,
    });
  }

  /**
   * Record revenue
   * @param amountInPaisa Amount in paisa (smallest currency unit). E.g., ₹500.00 = 50000 paisa
   */
  recordRevenue(
    tenantId: string,
    amountInPaisa: number,
    serviceType: string,
    paymentMethod: string,
  ): void {
    this.revenueTotal.inc(
      {
        tenant_id: tenantId,
        service_type: serviceType,
        payment_method: paymentMethod,
      },
      amountInPaisa,
    );
  }

  // ==========================================================================
  // USER METRICS
  // ==========================================================================

  /**
   * Set active users count
   */
  setActiveUsers(tenantId: string, role: string, count: number): void {
    this.activeUsers.set({ tenant_id: tenantId, role }, count);
  }

  /**
   * Record user registration
   */
  recordUserRegistration(tenantId: string, role: string, registrationSource: string): void {
    this.userRegistrations.inc({
      tenant_id: tenantId,
      role,
      registration_source: registrationSource,
    });
  }

  // ==========================================================================
  // DATABASE METRICS
  // ==========================================================================

  /**
   * Record database query duration
   */
  recordDatabaseQuery(
    queryType: string,
    table: string,
    tenantId: string,
    durationMs: number,
  ): void {
    this.databaseQueryDuration.observe(
      { query_type: queryType, table, tenant_id: tenantId },
      durationMs / 1000, // Convert to seconds
    );
  }

  /**
   * Set database connection pool size
   */
  setDatabaseConnectionPool(poolType: 'active' | 'available' | 'total', size: number): void {
    this.databaseConnectionPool.set({ pool_type: poolType }, size);
  }

  /**
   * Record database error
   */
  recordDatabaseError(errorType: string, table: string, tenantId: string): void {
    this.databaseErrors.inc({ error_type: errorType, table, tenant_id: tenantId });
  }

  // ==========================================================================
  // CACHE METRICS
  // ==========================================================================

  /**
   * Record cache hit
   */
  recordCacheHit(cacheKeyPrefix: string, tenantId: string): void {
    this.cacheHits.inc({ cache_key_prefix: cacheKeyPrefix, tenant_id: tenantId });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheKeyPrefix: string, tenantId: string): void {
    this.cacheMisses.inc({ cache_key_prefix: cacheKeyPrefix, tenant_id: tenantId });
  }

  /**
   * Record cache operation duration
   */
  recordCacheOperation(
    operation: 'get' | 'set' | 'del',
    cacheKeyPrefix: string,
    durationMs: number,
  ): void {
    this.cacheOperationDuration.observe(
      { operation, cache_key_prefix: cacheKeyPrefix },
      durationMs / 1000, // Convert to seconds
    );
  }

  // ==========================================================================
  // AUTHENTICATION METRICS
  // ==========================================================================

  /**
   * Record login attempt
   */
  recordLoginAttempt(tenantId: string, status: 'success' | 'failure'): void {
    this.loginAttempts.inc({ status, tenant_id: tenantId });
  }

  /**
   * Record password reset request
   */
  recordPasswordResetRequest(tenantId: string): void {
    this.passwordResetRequests.inc({ tenant_id: tenantId });
  }

  // ==========================================================================
  // HEALTH METRICS
  // ==========================================================================

  /**
   * Set application health status
   * @param component Component name (e.g., 'database', 'redis', 'api')
   * @param isHealthy true for healthy (1), false for unhealthy (0)
   */
  setHealthStatus(component: string, isHealthy: boolean): void {
    this.appHealthStatus.set({ component }, isHealthy ? 1 : 0);
  }
}
