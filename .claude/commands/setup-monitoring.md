---
description: Add monitoring and observability instrumentation using Grafana Cloud
---

Deploy the **monitoring-observability** specialist to instrument your application for Grafana Cloud monitoring.

**Note**: This command focuses on **adding monitoring capabilities** to your code. Infrastructure setup (Grafana Cloud, Prometheus, Loki, Tempo) is handled separately via Grafana Cloud.

**Monitoring Instrumentation Commands:**

**/setup-monitoring** - Complete application instrumentation

- Add Prometheus metrics to backend
- Configure structured logging with Pino
- Set up OpenTelemetry tracing
- Add frontend performance monitoring
- Create health check endpoints
- Add business metrics tracking
- Configure multi-tenant metrics

**/setup-monitoring backend** - Instrument NestJS backend

- Add Prometheus metrics module (@willsoto/nestjs-prometheus)
- Configure structured logging with Pino
- Set up OpenTelemetry tracing (@opentelemetry/sdk-node)
- Add metrics interceptor for automatic instrumentation
- Create /metrics endpoint for Prometheus scraping
- Add /health endpoint with liveness/readiness checks
- Add business metrics (appointments, bookings, revenue)
- Configure multi-tenant metric labels

**/setup-monitoring frontend** - Instrument React frontend

- Add OpenTelemetry for browser (@opentelemetry/sdk-trace-web)
- Set up Web Vitals tracking (CLS, FID, LCP, FCP, TTFB)
- Create error boundary with error tracking
- Add user interaction tracking
- Configure frontend metrics collection
- Add performance marks for critical user flows
- Track route navigation timing

**/setup-monitoring metrics [component]** - Add custom metrics

- Design appropriate metric type (counter, gauge, histogram, summary)
- Implement instrumentation code in specified component
- Add proper labels for multi-tenancy and filtering
- Document metric purpose and usage
- Create example queries for dashboards

**/setup-monitoring alerts [service]** - Add alerting instrumentation

- Add metric exports for alert rules
- Document recommended alert thresholds
- Create example alert rule definitions
- Add health check endpoints for alerting
- Implement graceful degradation patterns

**The monitoring-observability agent will:**

1. **Add instrumentation code** - Integrate monitoring libraries
2. **Create metrics endpoints** - Expose /metrics and /health
3. **Implement structured logging** - Add Pino with trace correlation
4. **Configure tracing** - Set up OpenTelemetry spans
5. **Add business metrics** - Track domain-specific KPIs
6. **Multi-tenant support** - Add tenant labels to all metrics
7. **Document metrics** - Create metrics catalog
8. **Create dashboard queries** - Provide PromQL/LogQL examples

**Output includes:**

- Backend metrics module configuration
- Structured logging setup (Pino)
- OpenTelemetry tracing configuration
- Frontend Web Vitals tracking
- Custom business metrics implementation
- Health check endpoints
- Metrics catalog documentation (docs/METRICS.md)
- Example dashboard queries (PromQL/LogQL)
- Alert rule recommendations
- Quick integration guide

**Monitoring Coverage:**

- ✅ Application metrics (latency, throughput, errors)
- ✅ Business metrics (appointments, bookings, revenue)
- ✅ HTTP metrics (request duration, status codes)
- ✅ Database metrics (query duration, connection pool)
- ✅ Structured logs with trace correlation
- ✅ Distributed tracing (API calls, DB queries)
- ✅ Frontend performance (Web Vitals, user timing)
- ✅ Multi-tenant isolation and tracking

**Integration with Grafana Cloud:**

Your instrumented application will export:

- **Metrics**: Scraped by Grafana Cloud Prometheus at `/metrics` endpoint
- **Logs**: Sent to Grafana Cloud Loki via Promtail or direct push
- **Traces**: Sent to Grafana Cloud Tempo via OTLP protocol

**Best for:**

- Adding observability to existing applications
- Instrumenting new features with metrics
- Creating custom business metrics
- Multi-tenant SaaS monitoring
- Production-ready observability with Grafana Cloud

Usage: `/setup-monitoring [backend|frontend|metrics component|alerts service]`

The monitoring-observability specialist ensures your application code is fully instrumented for Grafana Cloud.
