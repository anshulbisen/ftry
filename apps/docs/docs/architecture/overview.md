# Architecture Overview

ftry is built with a modern, scalable architecture designed for multi-tenant SaaS operations. This document provides a high-level overview of the system design and architectural decisions.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  React 19 + Vite + Tailwind CSS + shadcn/ui         │
│  TanStack Query + Zustand                           │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS/JSON
                  │
┌─────────────────┴───────────────────────────────────┐
│                   API Gateway                        │
│  NestJS 11 + Bun Runtime                            │
│  JWT Authentication + CSRF Protection                │
└─────────────────┬───────────────────────────────────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
┌──────▼─────┐ ┌─▼─────┐ ┌─▼──────────┐
│ Auth       │ │ Admin │ │ Business   │
│ Module     │ │ CRUD  │ │ Logic      │
└──────┬─────┘ └─┬─────┘ └─┬──────────┘
       │         │         │
       └─────────┼─────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│           Data Access Layer                         │
│  Prisma 6 ORM + Row-Level Security (RLS)           │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              PostgreSQL 18                           │
│  Multi-tenant with RLS + Automatic Isolation        │
└──────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Multi-Tenancy First

Every aspect of ftry is designed for multi-tenant operation:

- **Database Isolation**: Row-Level Security (RLS) automatically filters data by tenant
- **Null Tenant Pattern**: Super admins (tenantId = null) can access all tenants
- **Automatic Context**: JWT strategy sets tenant context on every authenticated request
- **Zero Trust**: Database enforces isolation even if application code has bugs

:::tip Defense in Depth
RLS provides database-level security. Even if you forget a `WHERE tenantId = ?` clause, the database blocks cross-tenant access.
:::

### 2. Type-Safe Throughout

Full TypeScript coverage across the stack:

- **Frontend**: React 19 with TypeScript 5.9.2
- **Backend**: NestJS 11 with strict mode enabled
- **Database**: Prisma generates type-safe client from schema
- **Shared Types**: Common types in `@ftry/shared/types`

### 3. Test-Driven Development

Quality-first approach with comprehensive testing:

- **Unit Tests**: Vitest (frontend), Jest (backend)
- **Integration Tests**: Full request lifecycle testing
- **E2E Tests**: Critical user flows
- **Coverage Target**: 80% minimum

### 4. Monorepo Architecture

Nx 21.6.3 monorepo with clear boundaries:

- **Apps**: Deployable applications (frontend, backend, docs)
- **Libraries**: Reusable code with enforced dependency rules
- **Non-buildable**: Libraries are code references, not build artifacts
- **Affected Detection**: Only test/build what changed

## Technology Stack

### Frontend

| Technology     | Version | Purpose                               |
| -------------- | ------- | ------------------------------------- |
| React          | 19.0.0  | UI framework with concurrent features |
| Vite           | 7.x     | Fast build tool and dev server        |
| TypeScript     | 5.9.2   | Type safety                           |
| Tailwind CSS   | 4.1.14  | Utility-first styling                 |
| shadcn/ui      | Latest  | High-quality UI components            |
| TanStack Query | Latest  | Server state management               |
| Zustand        | Latest  | Client state management               |
| React Router   | 7.9.4   | Client-side routing                   |

### Backend

| Technology | Version | Purpose                      |
| ---------- | ------- | ---------------------------- |
| NestJS     | 11.x    | Enterprise Node.js framework |
| Bun        | 1.3.0   | Fast JavaScript runtime      |
| Prisma     | 6.16.3  | Type-safe database ORM       |
| PostgreSQL | 18      | Primary database             |
| JWT        | Latest  | Token-based authentication   |
| bcrypt     | Latest  | Password hashing             |

### Infrastructure

| Technology     | Version | Purpose                      |
| -------------- | ------- | ---------------------------- |
| Nx             | 21.6.3  | Monorepo build system        |
| Docker         | Latest  | Containerization             |
| Grafana Cloud  | N/A     | Monitoring and observability |
| GitHub Actions | N/A     | CI/CD pipeline               |

## Security Architecture

### Authentication Flow

```
1. User Login (POST /api/v1/auth/login)
   │
   ├─> Validate credentials (bcrypt)
   ├─> Check account status (active, not locked)
   ├─> Generate JWT tokens (access + refresh)
   ├─> Store refresh token in database
   └─> Return tokens in HTTP-only cookies

2. Authenticated Request (GET /api/v1/resource)
   │
   ├─> Extract access token from cookie
   ├─> Validate JWT signature
   ├─> Set RLS tenant context
   ├─> Load user with permissions
   └─> Process request (tenant-scoped)

3. Token Refresh (POST /api/v1/auth/refresh)
   │
   ├─> Extract refresh token from cookie
   ├─> Validate token in database
   ├─> Check not revoked or expired
   ├─> Generate new token pair (rotation)
   ├─> Revoke old refresh token
   └─> Return new tokens
```

### Security Features

- **JWT Access Tokens**: Short-lived (15 minutes), stateless
- **Refresh Tokens**: Long-lived (7 days), stored in database for revocation
- **Token Rotation**: New refresh token on every refresh (prevents reuse attacks)
- **CSRF Protection**: Required for state-changing operations
- **Account Lockout**: 5 failed attempts = 15 minute lockout
- **Row-Level Security**: Database-enforced tenant isolation
- **Password Hashing**: bcrypt with 12 salt rounds
- **HTTP-Only Cookies**: Tokens not accessible to JavaScript

:::warning Production Security
Always use HTTPS in production. Update `JWT_SECRET` to a cryptographically secure value (minimum 64 characters).
:::

## Data Architecture

### Multi-Tenant Database Schema

```prisma
model Tenant {
  id     String @id @default(cuid())
  name   String
  slug   String @unique
  users  User[]
  // ... other fields
}

model User {
  id        String   @id @default(cuid())
  email     String
  tenantId  String?  // NULL for super admins

  tenant    Tenant?  @relation(fields: [tenantId], references: [id])

  @@unique([email, tenantId])  // Same email across tenants OK
  @@index([tenantId])          // CRITICAL for RLS performance
}
```

### Row-Level Security (RLS)

PostgreSQL RLS policies automatically filter queries by tenant:

```sql
-- Policy applied to User table
CREATE POLICY user_tenant_isolation ON "User"
  USING (
    -- Super admin (NULL tenant) sees all
    current_setting('app.current_tenant_id', true) IS NULL
    OR
    -- Regular users see only their tenant
    "tenantId" = current_setting('app.current_tenant_id', true)
  );
```

**Benefits**:

- Defense against SQL injection and logic errors
- Automatic filtering without manual WHERE clauses
- Audit trail with tenant context
- Super admin support with NULL tenant

**See Also**: [Database Architecture](./database.md) for full schema design

## Performance Considerations

### Current Performance Profile

| Metric             | Value       | Target      | Status |
| ------------------ | ----------- | ----------- | ------ |
| API Response Time  | Under 100ms | Under 100ms | ✅     |
| Database Queries   | Optimized   | Under 50ms  | ✅     |
| JWT Strategy Cache | None        | Redis       | ⚠️     |
| Connection Pool    | 10          | 10-20       | ✅     |
| Concurrent Users   | ~50         | 500+        | ⚠️     |

:::danger Critical Performance Issue
JWT strategy queries database on every authenticated request. **Redis caching required** before production scaling. See [Backend Architecture](./backend.md#performance-jwt-caching-issue).
:::

### Optimization Strategies

1. **Database Indexing**: All foreign keys and common query patterns indexed
2. **Query Optimization**: Avoid N+1 queries with Prisma includes
3. **Connection Pooling**: Prisma connection pool configured for concurrency
4. **Caching Strategy**: Redis caching for JWT user data (pending)
5. **CDN for Static Assets**: Frontend build artifacts on CDN

## Scalability

### Current Scale

- **Database**: PostgreSQL 18 with RLS (vertical scaling)
- **Backend**: Stateless NestJS (horizontal scaling ready)
- **Frontend**: Static build (CDN-ready)

### Growth Path

```
Phase 1: Single Server (Current)
  ├─> Backend (NestJS on Bun)
  ├─> PostgreSQL 18
  └─> Frontend (Vite build)

Phase 2: Horizontal Scaling (Next)
  ├─> Load Balancer
  ├─> Multiple Backend Instances
  ├─> Redis for JWT Cache + Sessions
  ├─> PostgreSQL Read Replicas
  └─> CDN for Frontend

Phase 3: Microservices (Future)
  ├─> Service Mesh
  ├─> Event-Driven Architecture
  ├─> Separate Databases per Service
  └─> Message Queue (RabbitMQ/Kafka)
```

## Development Workflow

### Local Development

Start all services or individually:

```bash
# Start all services
bun run dev

# Or individually
nx serve frontend
# Frontend at http://localhost:3000

nx serve backend
# Backend at http://localhost:3001

nx serve docs
# Docs at http://localhost:3002
```

### Quality Checks

```bash
# Run all quality checks
bun run check-all

# Individual checks
bun run format     # Prettier
bun run lint       # ESLint
bun run typecheck  # TypeScript
bun run test       # Vitest/Jest
```

### Database Operations

```bash
# Generate Prisma client
bunx prisma generate

# Create migration
bunx prisma migrate dev --name description

# View database GUI
bunx prisma studio
```

## Deployment Architecture

### Environments

| Environment | Purpose    | Branch     | Auto-Deploy |
| ----------- | ---------- | ---------- | ----------- |
| Development | Local dev  | feature/\* | No          |
| Staging     | QA testing | develop    | Yes         |
| Production  | Live app   | main       | Manual      |

### CI/CD Pipeline

```
GitHub Push
  │
  ├─> Lint + Format Check
  ├─> Type Check (TypeScript)
  ├─> Run Tests (affected)
  ├─> Build (affected apps)
  └─> Deploy (if branch matches)
```

### Production Deployment Checklist

- [ ] All tests passing
- [ ] Coverage > 80%
- [ ] No TypeScript errors
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] JWT_SECRET updated (64+ chars)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Monitoring configured (Grafana)
- [ ] Backups configured (daily)
- [ ] Disaster recovery plan documented

## Monitoring & Observability

### Grafana Cloud Integration

- **Metrics**: Request rate, error rate, latency
- **Logs**: Structured JSON logs with tenant context
- **Traces**: Request tracing through microservices (future)
- **Alerts**: PagerDuty integration for critical issues

### Health Checks

```bash
# Backend health
GET /api/health
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" }
  }
}
```

## Next Steps

- [Nx Monorepo Architecture](./nx-monorepo.md) - Understand the monorepo structure
- [Frontend Architecture](./frontend.md) - React app design
- [Backend Architecture](./backend.md) - NestJS modules and services
- [Database Architecture](./database.md) - PostgreSQL schema and RLS
- [Authentication](./authentication.md) - JWT flow and security
- [Admin CRUD](./admin-crud.md) - Configuration-based admin interfaces

## Additional Resources

- [API Reference](../api/overview.md) - REST API endpoints
- [Development Workflow](../getting-started/development-workflow.md) - Day-to-day development
- [Contributing Guide](../guides/contributing.md) - How to contribute

---

**Architecture Review Date**: 2025-10-11
**System Health Score**: 78/100 (Good)
**Production Ready**: ⚠️ Pending P0 fixes (JWT caching)
