# Technology Stack

Complete technology reference for ftry Salon & Spa Management SaaS.

**Last Updated**: 2025-10-11 | **Source**: package.json

## Frontend

### Core

- **React**: 19.0.0 - UI library with concurrent features
- **Vite**: 7.0.0 - Build tool with HMR
- **TypeScript**: 5.9.2 - Static typing (strict mode)

### Styling & UI

- **Tailwind CSS**: 4.1.14 - Utility-first CSS
- **shadcn/ui**: 3.4.0 - Component library
- **Radix UI**: 1.x - Headless UI primitives
- **lucide-react**: 0.545.0 - Icons

### State & Data

- **Zustand**: 5.0.8 - State management
- **TanStack Query**: 5.90.2 - Server state
- **TanStack Virtual**: 3.13.12 - Virtual scrolling
- **axios**: 1.6.0 - HTTP client

### Forms & Validation

- **react-hook-form**: 7.64.0 - Form management
- **zod**: 4.1.12 - Schema validation
- **@hookform/resolvers**: 5.2.2 - Validation resolvers

### Routing

- **react-router-dom**: 7.9.4 - Client routing

### Testing

- **Vitest**: 3.0.0 - Unit test runner
- **@testing-library/react**: 16.1.0 - Component testing
- **@vitest/coverage-v8**: 3.0.5 - Coverage

## Backend

### Core

- **NestJS**: 11.0.0 - Node.js framework
- **Bun**: 1.3.0 - Runtime + package manager
- **TypeScript**: 5.9.2 - Static typing
- **rxjs**: 7.8.0 - Reactive extensions

### Authentication & Security

- **Passport**: 0.7.0 + **passport-jwt**: 4.0.1
- **bcrypt**: 6.0.0 - Password hashing
- **csrf-csrf**: 4.0.3 - CSRF protection
- **helmet**: 8.1.0 - Security headers
- **@nestjs/throttler**: 6.4.0 - Rate limiting

### API & Validation

- **@nestjs/swagger**: 11.2.0 - OpenAPI docs
- **class-validator**: 0.14.2 - Validation decorators
- **class-transformer**: 0.5.1 - Transformation

### Jobs & Caching

- **bullmq**: 5.61.0 - Redis queues
- **cache-manager**: 7.2.4 - Caching
- **cache-manager-redis-yet**: 5.1.5 - Redis adapter
- **ioredis**: 5.8.1 - Redis client

### Logging & Monitoring

- **pino**: 10.0.0 - Fast JSON logger
- **nestjs-pino**: 4.4.1 - Pino integration
- **prom-client**: 15.1.3 - Prometheus metrics

### Observability

- **@opentelemetry/api**: 1.9.0
- **@opentelemetry/sdk-node**: 0.206.0
- **@opentelemetry/auto-instrumentations-node**: 0.65.0
- **@opentelemetry/exporter-trace-otlp-http**: 0.206.0

### Testing

- **Jest**: 30.0.2 - Test framework
- **@nestjs/testing**: 11.0.0 - NestJS utilities
- **jest-mock-extended**: 4.0.0 - Advanced mocking

## Database

- **PostgreSQL**: 18 - Relational database
- **Prisma**: 6.16.3 - Next-gen ORM
- Row-Level Security (RLS) for multi-tenancy
- Optimistic locking with version fields
- Soft deletes for retention
- Comprehensive indexing

## Monorepo & Build

### Monorepo

- **Nx**: 21.6.3 - Build system and tools
- **@nx/workspace**: 21.6.3 - Workspace utilities
- **@nx/react**: 21.6.3 - React integration
- **@nx/nest**: 21.6.3 - NestJS integration

### Build

- **Vite**: 7.0.0 - Frontend bundler
- **Webpack**: Latest - Backend bundling
- **@swc/core**: 1.13.5 - Fast TS/JS compiler

## Code Quality

### Linting & Formatting

- **ESLint**: 9.8.0 - Linting
- **typescript-eslint**: 8.40.0 - TS ESLint
- **Prettier**: 3.6.2 - Code formatter

### Git Hooks

- **Husky**: 9.1.7 - Git hooks
- **lint-staged**: 16.2.3 - Staged linters
- **@commitlint/cli**: 20.1.0 - Commit linting

## Monitoring Stack

### Metrics & Logs

- **Prometheus** - Metrics collection
- **prom-client** - Client library
- **Loki** - Log aggregation (Grafana Cloud)
- **Tempo** - Traces (Grafana Cloud)

### Dashboards

- **Grafana Cloud** - Visualization + alerting

## Performance Characteristics

### Build Times

- Full build: ~30-45s
- Incremental: ~5-10s
- Nx cache hit: &lt;1s

### Test Execution

- All tests: ~20-30s
- Affected: ~5-10s
- Single file: &lt;1s

### Dev Server

- Frontend (Vite): &lt;500ms startup
- Backend (NestJS): ~2-3s startup
- HMR: &lt;100ms

### Bundle Sizes

- Frontend: ~250KB gzipped (target: &lt;300KB)

## Security Stack

### Authentication

- JWT with HTTP-only cookies
- Refresh token rotation
- CSRF protection
- Rate limiting

### Authorization

- Role-based access control (RBAC)
- Row-Level Security (RLS)
- Permission-based guards

### Data Protection

- Password hashing (bcrypt, 12 rounds)
- Helmet.js security headers
- Input validation (class-validator, zod)
- SQL injection prevention (Prisma)
- XSS prevention (React escaping)

## Key Architecture Decisions

### Non-Buildable Libraries

- All libraries are non-buildable
- Only apps have build targets
- Faster development, simpler model

### Bun Exclusive

- Bun for runtime AND package management
- Never use npm/yarn/pnpm
- Enforced via packageManager field

### Multi-Tenancy

- Row-Level Security (RLS) in PostgreSQL
- Tenant isolation at database level
- Automatic via JwtStrategy

### Test-Driven Development

- TDD enforced via test-guardian agent
- Write tests BEFORE implementation
- Zero tolerance for failing tests

## Planned Additions

### Under Evaluation

- **Playwright** - E2E testing
- **date-fns** or **dayjs** - Date manipulation
- **tRPC** - Type-safe API (maybe)

### Future

- **Stripe** - Payment processing
- **Razorpay** - Indian payments
- **SendGrid** / **Resend** - Email
- **Twilio** - SMS
- **i18next** - Internationalization (Hindi)

## GST Compliance (India)

- Multi-rate GST calculation
- GSTIN validation
- GST-compliant invoicing
- Tax reports generation

## Learning Resources

### Official Docs

- **React 19**: https://react.dev
- **NestJS 11**: https://docs.nestjs.com
- **Prisma 6**: https://www.prisma.io/docs
- **Nx 21**: https://nx.dev
- **Bun**: https://bun.sh/docs

### Project-Specific

- `CLAUDE.md` - Project overview
- Architecture docs in `apps/docs/docs/architecture/`
- Guide docs in `apps/docs/docs/guides/`

## Related Documentation

- [Project Structure](../getting-started/project-structure)
- [Nx Monorepo](../architecture/nx-monorepo)
- [Development Workflows](../guides/development-workflows)
