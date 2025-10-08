# Architecture

System design and technical architecture documentation.

## Overview

This directory contains architectural documentation for the ftry Salon & Spa Management SaaS application. These documents describe the high-level design decisions, patterns, and principles that guide the implementation.

## Available Documentation

### Database Architecture

- **[Database Architecture](./DATABASE.md)**
  - Multi-tenant database design
  - Schema design patterns and conventions
  - Prisma ORM configuration
  - Security policies and Row-Level Security (RLS)
  - Indexing strategies and query optimization
  - Data integrity and constraints

## Architectural Principles

The ftry architecture follows these core principles:

1. **Multi-Tenancy First**
   - Shared schema with tenant discriminator
   - Row-Level Security (RLS) for data isolation
   - Tenant context in every authenticated request

2. **Security by Design**
   - Database-level security policies
   - Input validation at all layers
   - CSRF protection and HTTP-only cookies
   - Rate limiting and throttling

3. **Performance & Scalability**
   - Strategic indexing (composite, partial)
   - Redis caching for hot data
   - Connection pooling
   - Efficient query patterns

4. **Maintainability**
   - Clean separation of concerns
   - Nx monorepo structure
   - Type safety with TypeScript
   - Comprehensive testing

5. **Observability**
   - Structured logging
   - Distributed tracing (OpenTelemetry)
   - Metrics collection (Prometheus)
   - Health checks

## System Components

### Frontend

- **Framework**: React 19 with Vite
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **State Management**: React hooks and context
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library

### Backend

- **Framework**: NestJS 11 with Bun runtime
- **Authentication**: JWT with HTTP-only cookies
- **Caching**: Redis 7
- **Background Jobs**: Bull Queue (Redis-backed)
- **Testing**: Jest

### Database

- **RDBMS**: PostgreSQL 18
- **ORM**: Prisma 6
- **Pattern**: Multi-tenant with RLS
- **Migrations**: Prisma Migrate

### Infrastructure

- **Monorepo**: Nx 21.6
- **Package Manager**: Bun 1.2.19
- **Monitoring**: Grafana Cloud (Prometheus, Loki, Tempo)
- **CI/CD**: GitHub Actions

## Architecture Decision Records (ADRs)

Major architectural decisions are documented with the following information:

- **Context**: Why the decision was needed
- **Decision**: What was decided
- **Consequences**: Trade-offs and implications
- **Alternatives**: Other options considered

### Existing ADRs

1. **Multi-Tenant Architecture**: Shared schema with RLS (see DATABASE.md)
2. **HTTP-Only Cookie Authentication**: Security-first auth approach
3. **Nx Monorepo**: Shared code and build optimization
4. **Grafana Cloud**: Observability and monitoring

## Related Documentation

- **[Guides](../guides/)** - Implementation guides for developers
- **[Operations](../operations/)** - DevOps and infrastructure
- **[Development](../development/)** - Project planning and roadmap
- **[Archive](../archive/reviews/)** - Historical architecture reviews

## Future Architecture Plans

### Short-term (Next Quarter)

- Background job queue for asynchronous processing
- File upload service for customer photos
- Email notification service

### Medium-term (6 months)

- Multi-location support (franchise chains)
- Mobile app (React Native)
- Real-time features (WebSockets)

### Long-term (1 year)

- AI-powered features (recommendations, insights)
- Multi-region deployment
- Microservices extraction (if needed)

## Architecture Reviews

Historical architecture reviews are archived in `../archive/reviews/`. These provide snapshots of the system at specific points in time and are useful for understanding evolution and decisions.

---

**Last Updated**: 2025-10-08
**System Health**: Production-ready
**Tech Debt**: Low (managed through regular refactoring)
