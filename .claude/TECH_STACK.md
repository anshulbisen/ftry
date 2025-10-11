# Technology Stack - ftry

Complete technology stack reference for the ftry Salon & Spa Management SaaS platform.

**Last Updated**: 2025-10-10
**Source**: package.json

---

## Frontend Stack

### Core Framework

- **React**: 19.0.0 - UI library with concurrent features
- **Vite**: 7.0.0 - Build tool and dev server with HMR
- **TypeScript**: 5.9.2 - Static type checking (strict mode)

### Styling & UI

- **Tailwind CSS**: 4.1.14 - Utility-first CSS framework
- **shadcn/ui**: 3.4.0 - Re-usable component library
- **Radix UI**: 1.x - Headless UI primitives
- **next-themes**: 0.4.6 - Theme management
- **lucide-react**: 0.545.0 - Icon library
- **class-variance-authority**: 0.7.1 - CSS variant utilities
- **tailwind-merge**: 3.3.1 - Tailwind class merging

### State Management & Data Fetching

- **Zustand**: 5.0.8 - Lightweight state management
- **TanStack Query**: 5.90.2 - Server state management
- **TanStack Virtual**: 3.13.12 - Virtual scrolling
- **axios**: 1.6.0 - HTTP client

### Forms & Validation

- **react-hook-form**: 7.64.0 - Form state management
- **zod**: 4.1.12 - Schema validation
- **@hookform/resolvers**: 5.2.2 - Form validation resolvers

### Routing

- **react-router-dom**: 7.9.4 - Client-side routing

### Testing

- **Vitest**: 3.0.0 - Unit test runner
- **@testing-library/react**: 16.1.0 - React component testing
- **@testing-library/user-event**: 14.6.1 - User interaction testing
- **@testing-library/jest-dom**: 6.9.1 - Custom matchers
- **@vitest/coverage-v8**: 3.0.5 - Coverage reporting
- **@vitest/ui**: 3.0.0 - Test UI
- **jsdom**: 22.1.0 - DOM implementation

---

## Backend Stack

### Core Framework

- **NestJS**: 11.0.0 - Progressive Node.js framework
- **Bun**: 1.3.0 - JavaScript runtime and package manager
- **TypeScript**: 5.9.2 - Static type checking (strict mode)
- **reflect-metadata**: 0.1.13 - Metadata reflection API
- **rxjs**: 7.8.0 - Reactive extensions

### Authentication & Security

- **Passport**: 0.7.0 - Authentication middleware
- **passport-jwt**: 4.0.1 - JWT authentication strategy
- **passport-local**: 1.0.0 - Local authentication strategy
- **@nestjs/passport**: 11.0.5 - Passport NestJS integration
- **@nestjs/jwt**: 11.0.0 - JWT utilities
- **bcrypt**: 6.0.0 - Password hashing
- **csrf-csrf**: 4.0.3 - CSRF protection
- **helmet**: 8.1.0 - Security headers
- **@nestjs/throttler**: 6.4.0 - Rate limiting
- **cookie-parser**: 1.4.7 - Cookie parsing

### API & Documentation

- **@nestjs/swagger**: 11.2.0 - OpenAPI documentation
- **class-validator**: 0.14.2 - Validation decorators
- **class-transformer**: 0.5.1 - Object transformation

### Job Processing & Caching

- **@nestjs/bull**: 11.0.3 - Queue management
- **bullmq**: 5.61.0 - Redis-based queue
- **@nestjs/cache-manager**: 3.0.1 - Cache management
- **cache-manager**: 7.2.4 - Caching abstraction
- **cache-manager-redis-yet**: 5.1.5 - Redis cache adapter
- **ioredis**: 5.8.1 - Redis client
- **redis**: 5.8.3 - Redis utilities

### Scheduling & Health

- **@nestjs/schedule**: 6.0.1 - Cron jobs
- **@nestjs/terminus**: 11.0.0 - Health checks

### Logging & Monitoring

- **nestjs-pino**: 4.4.1 - Pino logger integration
- **pino**: 10.0.0 - Fast JSON logger
- **pino-http**: 11.0.0 - HTTP logging
- **pino-pretty**: 13.1.1 - Pretty logging (development)
- **prom-client**: 15.1.3 - Prometheus metrics

### Observability

- **@opentelemetry/api**: 1.9.0 - OpenTelemetry API
- **@opentelemetry/sdk-node**: 0.206.0 - Node.js SDK
- **@opentelemetry/sdk-trace-base**: 2.1.0 - Trace SDK
- **@opentelemetry/auto-instrumentations-node**: 0.65.0 - Auto instrumentation
- **@opentelemetry/exporter-trace-otlp-http**: 0.206.0 - OTLP HTTP exporter
- **@opentelemetry/resources**: 2.1.0 - Resource detection
- **@opentelemetry/semantic-conventions**: 1.37.0 - Semantic conventions

### Testing

- **Jest**: 30.0.2 - Test framework
- **@nestjs/testing**: 11.0.0 - NestJS testing utilities
- **jest-mock-extended**: 4.0.0 - Advanced mocking
- **ts-jest**: 29.4.0 - TypeScript preprocessor

---

## Database Stack

### Database & ORM

- **PostgreSQL**: 18 - Relational database
- **Prisma**: 6.16.3 - Next-generation ORM
- **@prisma/client**: 6.16.3 - Prisma client

### Features

- Row-Level Security (RLS) for multi-tenancy
- Optimistic locking with version fields
- Soft deletes for data retention
- Comprehensive indexing strategy
- Automated migrations

---

## Monorepo & Build Tools

### Monorepo Management

- **Nx**: 21.6.3 - Build system and monorepo tools
- **@nx/workspace**: 21.6.3 - Workspace utilities
- **@nx/eslint**: 21.6.3 - ESLint integration
- **@nx/jest**: 21.6.3 - Jest integration
- **@nx/vite**: 21.6.3 - Vite integration
- **@nx/react**: 21.6.3 - React integration
- **@nx/nest**: 21.6.3 - NestJS integration
- **@nx/node**: 21.6.3 - Node.js integration

### Build Tools

- **Vite**: 7.0.0 - Frontend build tool
- **@vitejs/plugin-react**: 4.2.0 - React plugin for Vite
- **Webpack**: Latest - Backend bundling
- **@nx/webpack**: 21.6.3 - Webpack integration
- **webpack-cli**: 5.1.4 - Webpack CLI

### Compilation

- **@swc/core**: 1.13.5 - Fast TypeScript/JavaScript compiler
- **@swc/cli**: 0.7.8 - SWC CLI
- **@swc/helpers**: 0.5.11 - SWC runtime helpers
- **@swc-node/register**: 1.9.1 - SWC Node.js loader
- **swc-loader**: 0.2.6 - Webpack SWC loader
- **@swc/jest**: 0.2.39 - Jest SWC transformer

---

## Code Quality & Tooling

### Linting & Formatting

- **ESLint**: 9.8.0 - Linting utility
- **typescript-eslint**: 8.40.0 - TypeScript ESLint
- **@nx/eslint-plugin**: 21.6.3 - Nx ESLint rules
- **eslint-config-prettier**: 10.0.0 - Prettier integration
- **Prettier**: 3.6.2 - Code formatter
- **jsonc-eslint-parser**: 2.1.0 - JSON with comments parser

### Git Hooks & Commit Standards

- **Husky**: 9.1.7 - Git hooks
- **lint-staged**: 16.2.3 - Run linters on staged files
- **@commitlint/cli**: 20.1.0 - Commit message linting
- **@commitlint/config-conventional**: 20.0.0 - Conventional commits config

### Type Checking

- **TypeScript**: 5.9.2
- Strict mode enabled
- Path aliases configured
- Composite projects for faster builds

---

## Development Tools

### Package Manager & Runtime

- **Bun**: 1.3.0 - Fast all-in-one JavaScript runtime

### CLI Tools

- **@nestjs/cli**: 11.0.0 - NestJS CLI
- **@nestjs/schematics**: 11.0.0 - NestJS schematics
- **shadcn**: 3.4.0 - Component CLI

### Process Management

- **concurrently**: 9.2.1 - Run commands concurrently
- Custom port cleanup scripts

### Type Definitions

- **@types/node**: 20.19.9
- **@types/react**: 19.0.0
- **@types/react-dom**: 19.0.0
- **@types/jest**: 30.0.0
- **@types/bcrypt**: 6.0.0
- **@types/passport-jwt**: 4.0.1
- **@types/passport-local**: 1.0.38
- **@types/cookie-parser**: 1.4.9
- **@types/crypto-js**: 4.2.2
- **@types/bull**: 4.10.4
- **@types/ioredis**: 5.0.0

---

## Testing Infrastructure

### Unit Testing

- **Vitest 3.0.0** - Frontend unit tests
- **Jest 30.0.2** - Backend unit tests
- **Testing Library** - Component testing
- **jest-mock-extended** - Advanced mocking

### Coverage

- **@vitest/coverage-v8** - V8 coverage for Vitest
- Coverage thresholds enforced in CI

### E2E Testing

- Planned: Playwright integration
- Currently: Manual E2E testing

---

## Monitoring & Observability

### Metrics

- **Prometheus** - Metrics collection
- **prom-client** - Prometheus client library
- Custom business metrics
- Multi-tenant metric labels

### Logging

- **Pino** - Structured JSON logging
- **Loki** - Log aggregation (Grafana Cloud)
- Request/response logging
- Error tracking

### Tracing

- **OpenTelemetry** - Distributed tracing
- **Tempo** - Trace storage (Grafana Cloud)
- Automatic instrumentation
- Custom spans for business operations

### Dashboards

- **Grafana Cloud** - Visualization and alerting
- Custom dashboards for:
  - Application performance
  - Business metrics
  - Error rates
  - Database performance

---

## UI Components (shadcn/ui)

**Installed Components:**

- alert-dialog
- checkbox
- dialog
- dropdown-menu
- label
- select
- slot (Radix UI primitive)

**Component Library Philosophy:**

- Copy-paste components (not npm packages)
- Full customization control
- Tailwind CSS styling
- Radix UI primitives
- TypeScript support

---

## Utilities & Helpers

### Cryptography

- **crypto-js**: 4.2.0 - Cryptographic functions

### Date & Time

- Native JavaScript Date API
- Considering: date-fns or dayjs for complex operations

### Toast Notifications

- **sonner**: 2.0.7 - Toast notifications

### Other

- **tslib**: 2.3.0 - TypeScript runtime library
- **axios-mock-adapter**: 2.1.0 - HTTP mocking for tests
- **jiti**: 2.4.2 - Runtime TypeScript loader

---

## Infrastructure & Deployment

### Planned Stack

- **Docker** - Containerization
- **Docker Compose** - Local development
- **Railway/Render** - Hosting platform (under evaluation)
- **Grafana Cloud** - Monitoring (configured)
- **PostgreSQL** - Managed database

### Environment

- Development: Local PostgreSQL + Redis
- Staging: TBD
- Production: TBD

---

## Key Architecture Decisions

### Non-Buildable Libraries

- All libraries in Nx monorepo are non-buildable
- Only apps (frontend, backend) have build targets
- Libraries bundled into apps during app build
- Faster development, simpler mental model

### Bun Exclusive

- Bun used for both runtime and package management
- Never use npm, yarn, or pnpm
- Enforced via packageManager field
- Significant performance improvements

### Multi-Tenancy

- Row-Level Security (RLS) in PostgreSQL
- Tenant isolation at database level
- Automatic tenant context via JwtStrategy
- No application-level tenant filtering needed

### Test-Driven Development

- TDD enforced via test-guardian agent
- Write tests BEFORE implementation
- Zero tolerance for failing tests
- Minimum coverage thresholds

### Conventional Commits

- commitlint enforces conventional commit format
- Automated changelog generation ready
- Semantic versioning support

---

## Version Update Process

When updating dependencies:

1. Update package.json
2. Run `bun install`
3. Update this TECH_STACK.md file
4. Run `/update-agents` to sync agent configs
5. Run `/update-commands` to sync slash commands
6. Update CLAUDE.md if major changes
7. Test all affected code
8. Commit with `chore(deps): update [package-name] to [version]`

---

## Migration Notes

### Recent Migrations

**2025-10-08: Authentication Migration**

- Migrated from session-based to JWT with HTTP-only cookies
- Added CSRF protection
- Implemented refresh token rotation
- Added Row-Level Security (RLS)

**2025-10-07: Frontend Consolidation**

- Consolidated frontend libraries into app directory
- Simplified architecture
- Removed unnecessary abstraction layers

**2025-10-06: TanStack Query Integration**

- Added @tanstack/react-query for server state
- Unified API client architecture
- Improved caching and invalidation

---

## Future Considerations

### Under Evaluation

- **Playwright** - E2E testing framework
- **date-fns** or **dayjs** - Date manipulation
- **Zod** extensions - Advanced validation
- **tRPC** - Type-safe API alternative (maybe)
- **Drizzle ORM** - Alternative to Prisma (monitoring)

### Planned Additions

- **Stripe** - Payment processing
- **Razorpay** - Indian payment gateway
- **SendGrid** / **Resend** - Email service
- **Twilio** - SMS notifications
- **i18next** - Internationalization (Hindi support)

---

## Performance Characteristics

### Build Times

- **Full build**: ~30-45 seconds
- **Incremental build**: ~5-10 seconds
- **Nx cache hit**: <1 second

### Test Execution

- **All tests**: ~20-30 seconds
- **Affected tests**: ~5-10 seconds
- **Single test file**: <1 second

### Development Server

- **Frontend (Vite)**: <500ms startup
- **Backend (NestJS)**: ~2-3 seconds startup
- **HMR**: <100ms

### Bundle Sizes (Production)

- **Frontend**: ~250KB gzipped (target: <300KB)
- **Backend**: N/A (server-side)

---

## Security Stack

### Authentication

- JWT with HTTP-only cookies
- Refresh token rotation
- CSRF protection (csrf-csrf)
- Rate limiting (@nestjs/throttler)

### Authorization

- Role-based access control (RBAC)
- Row-Level Security (RLS) in database
- Permission-based guards

### Data Protection

- Password hashing (bcrypt)
- Helmet.js security headers
- Input validation (class-validator, zod)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React default escaping)

---

## Compliance

### GST Compliance (India)

- Multi-rate GST calculation
- GSTIN validation
- GST-compliant invoicing
- Tax reports generation

### Data Privacy

- GDPR considerations (for future EU expansion)
- Data retention policies
- Soft deletes for audit trails
- PII encryption (planned)

---

## Learning Resources

### Official Documentation

- **React 19**: https://react.dev
- **NestJS 11**: https://docs.nestjs.com
- **Prisma 6**: https://www.prisma.io/docs
- **Nx 21**: https://nx.dev
- **Bun**: https://bun.sh/docs

### Project-Specific

- `CLAUDE.md` - Project overview
- `.nx/NX_ARCHITECTURE.md` - Monorepo architecture
- `prisma/CLAUDE.md` - Database documentation
- `docs/AUTHENTICATION.md` - Auth system
- `.claude/WORKFLOWS.md` - Development workflows

---

**This document is automatically maintained. Run `/update-commands` to sync with package.json.**
