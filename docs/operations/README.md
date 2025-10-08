# Operations

DevOps and infrastructure documentation for running ftry in production.

## Overview

This directory contains operational documentation for deploying, monitoring, and maintaining the ftry Salon & Spa Management SaaS application.

## Available Documentation

### Monitoring & Observability

- **[Grafana Cloud Setup](./GRAFANA_CLOUD_SETUP.md)**
  - Metrics collection with Prometheus
  - Log aggregation with Loki
  - Distributed tracing with Tempo
  - Dashboard configuration
  - Alerting rules and notifications

## Operational Domains

### Monitoring

**Metrics Collection**

- Application metrics (request rate, latency, errors)
- Business metrics (user signups, bookings, revenue)
- Infrastructure metrics (CPU, memory, disk, network)
- Database metrics (connections, query performance)

**Logging**

- Structured JSON logging with Pino
- Log aggregation in Grafana Loki
- Log-based alerting
- Audit logs for security events

**Tracing**

- Distributed tracing with OpenTelemetry
- Request flow visualization
- Performance bottleneck identification
- Service dependency mapping

### Health Checks

**Liveness Probes**

- Application is running
- Process is responsive

**Readiness Probes**

- Database connectivity
- Redis connectivity
- External service availability

### Backup & Recovery

See [Backup & Restore Guide](../guides/BACKUP_RESTORE_GUIDE.md) for:

- Automated daily backups
- Point-in-time recovery
- Disaster recovery procedures

### Deployment

**Development**

- Local development with Docker Compose
- Hot reload for fast development
- Seed data for testing

**Staging**

- Production-like environment
- Full integration testing
- Performance testing

**Production**

- Cloud-native deployment (AWS/GCP/Azure)
- Auto-scaling based on load
- Blue-green deployment strategy
- Rollback procedures

## Infrastructure Stack

### Core Services

**Application Tier**

- NestJS backend (containerized)
- React frontend (static hosting or containerized)
- Background job workers (Bull Queue)

**Data Tier**

- PostgreSQL 18 (managed service recommended)
- Redis 7 (managed service recommended)
- S3-compatible object storage (for files)

**Monitoring Tier**

- Grafana Cloud (metrics, logs, traces)
- Uptime monitoring
- Error tracking

### Networking

**Security**

- TLS/HTTPS everywhere
- Rate limiting and DDoS protection
- WAF (Web Application Firewall)

**Performance**

- CDN for static assets
- Edge caching
- Connection pooling

## Runbooks

### Common Scenarios

**High CPU Usage**

1. Check Grafana metrics for spike
2. Identify slow queries in database
3. Review trace data for bottlenecks
4. Scale horizontally if sustained

**Database Connection Exhaustion**

1. Monitor connection pool metrics
2. Check for connection leaks
3. Verify PgBouncer configuration
4. Increase pool size if needed

**Redis Connection Issues**

1. Check Redis health endpoint
2. Review connection count
3. Verify network connectivity
4. Failover to backup if needed

**Slow API Responses**

1. Check APM traces for bottlenecks
2. Review cache hit rate
3. Analyze database query performance
4. Check for N+1 query problems

### Incident Response

**Severity Levels**

- **P0 (Critical)**: Complete service outage
- **P1 (High)**: Major feature unavailable
- **P2 (Medium)**: Minor feature impacted
- **P3 (Low)**: Cosmetic issue

**Response Process**

1. Acknowledge incident
2. Assess severity
3. Notify stakeholders
4. Investigate root cause
5. Implement fix
6. Verify resolution
7. Post-mortem analysis

## Maintenance Windows

**Regular Maintenance**

- Database updates: Monthly (Sunday 2-4 AM IST)
- Security patches: As needed (coordinated)
- Dependency updates: Weekly (automated)

**Zero-Downtime Deployments**

- Blue-green deployment for app updates
- Rolling updates for backend services
- Database migrations with backwards compatibility

## Performance Targets

### Application SLOs

| Metric            | Target  | Measurement       |
| ----------------- | ------- | ----------------- |
| Uptime            | 99.9%   | Monthly           |
| API Latency (p95) | < 500ms | Per endpoint      |
| Page Load Time    | < 2s    | Lighthouse        |
| Error Rate        | < 0.1%  | Per 1000 requests |

### Database SLOs

| Metric                  | Target  | Measurement |
| ----------------------- | ------- | ----------- |
| Query Latency (p95)     | < 100ms | Per query   |
| Connection Availability | 99.99%  | Continuous  |
| Backup Success Rate     | 100%    | Daily       |

## Cost Optimization

**Resource Efficiency**

- Right-sizing compute resources
- Spot instances for non-critical workloads
- Reserved instances for stable workloads
- Auto-scaling based on metrics

**Data Storage**

- S3 lifecycle policies for archives
- Database cleanup of old audit logs
- Compression for backups

**Monitoring Costs**

- Log retention policies (30 days)
- Metrics aggregation
- Sample tracing (not 100%)

## Security Operations

**Security Monitoring**

- Failed authentication attempts
- Unusual access patterns
- API abuse detection
- Vulnerability scanning

**Compliance**

- PII handling (future: encryption at rest)
- Audit logging for compliance
- Access control reviews
- Security patch management

## Related Documentation

- **[Guides](../guides/)** - Implementation guides
- **[Architecture](../architecture/)** - System design
- **[Migration](../migration/)** - Migration guides
- **[Archive](../archive/)** - Historical reports

## Need Help?

**Operational Issues**

1. Check monitoring dashboards in Grafana
2. Review runbooks in this directory
3. Escalate to on-call engineer
4. Create incident report

**Questions**

1. Review relevant operations documentation
2. Check CLAUDE.md for development context
3. Consult team lead or DevOps engineer

---

**Last Updated**: 2025-10-08
**Operational Status**: MVP-ready, monitoring active
**SLA**: Best effort (pre-production)
