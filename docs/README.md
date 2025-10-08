# ftry Documentation

**ftry** is a Salon & Spa Management SaaS application for the Indian market.

## Getting Started

New to ftry? Start here:

1. **[Quick Start Guide](../QUICK_START.md)** - Get your development environment running in 5 minutes
2. **[Development Setup](#development-setup)** - Detailed setup instructions
3. **[Architecture Overview](./architecture/DATABASE.md)** - Understand the system design
4. **[Contributing Guidelines](../CLAUDE.md)** - Development standards and practices

## Documentation Structure

The documentation is organized into clear categories for easy navigation:

### Core Guides (`guides/`)

Essential documentation for daily development:

- **[Authentication Guide](./guides/AUTHENTICATION.md)** - Complete authentication & authorization implementation
  - HTTP-only cookie authentication
  - CSRF protection
  - JWT tokens with refresh rotation
  - Role-based access control (RBAC)
  - Row-level security (RLS)

- **[Frontend API Integration](./guides/FRONTEND_API_INTEGRATION.md)** - Frontend development guide
  - API client usage and patterns
  - CSRF token management
  - Authentication hooks
  - Error handling
  - Best practices

- **[Environment Variables](./guides/ENVIRONMENT_VARIABLES.md)** - Complete environment configuration reference
  - Authentication secrets (JWT, CSRF)
  - Database configuration
  - Redis configuration
  - Security best practices
  - Production deployment checklist

- **[Database Quick Reference](./guides/DATABASE_QUICK_REFERENCE.md)** - Quick database commands and tips
  - Common Prisma commands
  - Query examples
  - Migration tips

- **[Backup & Restore Guide](./guides/BACKUP_RESTORE_GUIDE.md)** - Database backup and recovery procedures
  - Automated daily backups
  - Manual backup procedures
  - Point-in-time recovery
  - Disaster recovery

### Architecture (`architecture/`)

System design and technical decisions:

- **[Database Architecture](./architecture/DATABASE.md)** - PostgreSQL schema and design
  - Multi-tenant architecture
  - Schema design patterns
  - Prisma configuration
  - Security policies

### Operations (`operations/`)

DevOps and infrastructure documentation:

- **[Grafana Cloud Setup](./operations/GRAFANA_CLOUD_SETUP.md)** - Monitoring and observability
  - Metrics collection
  - Log aggregation
  - Distributed tracing
  - Alerting

### Migration Guides (`migration/`)

Guides for major system changes:

- **[CSRF Migration](./migration/CSRF_MIGRATION.md)** - CSRF protection implementation details
- **[Grafana Cloud Migration](./migration/GRAFANA_CLOUD_MIGRATION.md)** - Migrating from self-hosted to Grafana Cloud
- **[Cloud Migration Summary](./migration/CLOUD_MIGRATION_SUMMARY.md)** - Infrastructure migration overview

### Development (`development/`)

Project planning and development resources:

- **[Strategic Roadmap 2025](./development/STRATEGIC_ROADMAP_2025.md)** - Product vision and roadmap

### Archived Documentation (`archive/`)

Historical reports and reviews (for reference only):

- **[reviews/](./archive/reviews/)** - Architecture reviews and assessments
- **[reports/](./archive/reports/)** - Implementation reports and analysis

## Development Setup

### Prerequisites

- **Bun 1.2.19+** (package manager and runtime)
- **PostgreSQL 18+** (database)
- **Redis 7+** (caching and background jobs)
- **Node.js 20+** (for Nx compatibility)

### Quick Start

```bash
# Install dependencies
bun install

# Start database and Redis (Docker)
docker-compose up -d

# Run migrations
bunx prisma migrate dev

# Seed database with demo data
bunx prisma db seed

# Start backend (Terminal 1)
nx serve backend

# Start frontend (Terminal 2)
nx serve frontend
```

Visit `http://localhost:4200` to access the application.

### Demo Credentials

**Super Admin** (all tenants):

- Email: `super@ftry.com`
- Password: `DevPassword123!@#`

**Tenant: Glamour Salon**

- Admin: `admin@glamour.com` / `DevPassword123!@#`
- Manager: `manager@glamour.com` / `DevPassword123!@#`

**Tenant: Elegance Beauty**

- Admin: `admin@elegance.com` / `DevPassword123!@#`
- Manager: `manager@elegance.com` / `DevPassword123!@#`

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, shadcn/ui
- **Backend**: NestJS 11, Bun runtime
- **Database**: PostgreSQL 18, Prisma 6
- **Caching**: Redis 7
- **Monorepo**: Nx 21.6
- **Auth**: JWT with HTTP-only cookies, CSRF protection, refresh token rotation
- **Security**: Row-Level Security (RLS), rate limiting, input validation
- **Monitoring**: Grafana Cloud (metrics, logs, traces)

## Available Commands

### Development

```bash
nx serve frontend          # Start frontend dev server (http://localhost:4200)
nx serve backend           # Start backend dev server (http://localhost:3000)
```

### Testing

```bash
nx test frontend           # Run frontend tests (Vitest)
nx test backend            # Run backend tests (Jest)
nx test --all              # Run all tests
nx test:coverage           # Run tests with coverage
```

### Building

```bash
nx build frontend          # Build frontend for production
nx build backend           # Build backend for production
nx build --all             # Build all applications
```

### Database

```bash
bunx prisma studio         # Open Prisma Studio (database GUI)
bunx prisma migrate dev    # Create and apply migration
bunx prisma db seed        # Seed database with demo data
bunx prisma generate       # Regenerate Prisma Client
```

### Code Quality

```bash
bun run format             # Format all files with Prettier
bun run lint               # Lint affected files with ESLint
bun run typecheck          # Type check affected files
bun run check-all          # Run all quality checks (recommended before PR)
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Critical variables**:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/ftry"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="generate-with-openssl-rand-base64-64"
JWT_ACCESS_TOKEN_EXPIRY="15m"
JWT_REFRESH_TOKEN_EXPIRY="7d"

# CSRF Protection
CSRF_SECRET="generate-with-openssl-rand-base64-32"

# Environment
NODE_ENV="development"
```

## Project Structure

```
ftry/
├── apps/
│   ├── frontend/          # React 19 application (Vite)
│   └── backend/           # NestJS 11 application (Webpack)
├── libs/
│   ├── frontend/          # Frontend libraries
│   │   ├── auth/          # Authentication hooks and utilities
│   │   ├── hooks/         # Shared React hooks
│   │   └── ui-components/ # Shared UI components
│   ├── backend/           # Backend libraries
│   │   ├── auth/          # Authentication module
│   │   ├── cache/         # Redis caching
│   │   ├── health/        # Health checks
│   │   ├── logger/        # Structured logging
│   │   └── monitoring/    # OpenTelemetry instrumentation
│   └── shared/            # Shared code (frontend + backend)
│       ├── prisma/        # Prisma client and service
│       └── types/         # Shared TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Seed data
└── docs/                  # Documentation (you are here!)
    ├── guides/            # User-facing guides
    ├── architecture/      # System design
    ├── operations/        # DevOps guides
    ├── migration/         # Migration guides
    ├── development/       # Planning and roadmap
    └── archive/           # Historical reports
```

## Documentation Maintenance

This documentation is actively maintained by the **docs-maintainer** Claude Code agent.

### Using the Documentation Agent

```bash
# Update docs after implementing a feature
/update-docs [feature-name]

# Create new documentation for a feature
/update-docs new [feature-name]

# Validate all documentation
/update-docs validate

# Generate documentation health metrics
/update-docs metrics
```

### Documentation Standards

- Keep docs synchronized with code changes
- Update examples when APIs change
- Archive outdated content (don't delete)
- Use clear, simple language
- Include working code examples
- Cross-reference related documentation

See `.claude/agents/docs-maintainer.md` for complete guidelines.

## Support and Contributing

### Getting Help

1. Check the relevant documentation in `docs/guides/`
2. Review the CLAUDE.md files in each module
3. Search for similar issues in the repository
4. Create a new issue with details

### Contributing

1. Read the [Contributing Guidelines](../CLAUDE.md)
2. Follow the [Code Standards](../CLAUDE.md#code-quality--standards)
3. Use Conventional Commits format
4. Run `bun run check-all` before submitting PR
5. Ensure all tests pass

### Code Quality Requirements

- No TypeScript errors
- All tests passing
- Code formatted with Prettier
- No ESLint violations
- Conventional commit messages

## Useful Links

- **[Root README](../README.md)** - Project overview
- **[CLAUDE.md](../CLAUDE.md)** - Complete development guide
- **[QUICK_START.md](../QUICK_START.md)** - Fast setup guide
- **[Prisma Schema](../prisma/schema.prisma)** - Database schema
- **[CI/CD](.github/workflows/)** - GitHub Actions workflows

## Documentation Index

### By Topic

**Authentication & Security**

- [Authentication Guide](./guides/AUTHENTICATION.md)
- [Frontend API Integration](./guides/FRONTEND_API_INTEGRATION.md)
- [Environment Variables](./guides/ENVIRONMENT_VARIABLES.md)
- [CSRF Migration](./migration/CSRF_MIGRATION.md)

**Database**

- [Database Architecture](./architecture/DATABASE.md)
- [Database Quick Reference](./guides/DATABASE_QUICK_REFERENCE.md)
- [Backup & Restore](./guides/BACKUP_RESTORE_GUIDE.md)

**Operations & Monitoring**

- [Grafana Cloud Setup](./operations/GRAFANA_CLOUD_SETUP.md)
- [Grafana Cloud Migration](./migration/GRAFANA_CLOUD_MIGRATION.md)

**Development**

- [Strategic Roadmap](./development/STRATEGIC_ROADMAP_2025.md)
- [Contributing Guidelines](../CLAUDE.md)

### By Audience

**New Developers**

1. [Quick Start Guide](../QUICK_START.md)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Contributing Guidelines](../CLAUDE.md)

**Frontend Developers**

1. [Frontend API Integration](./guides/FRONTEND_API_INTEGRATION.md)
2. [Authentication Guide](./guides/AUTHENTICATION.md)
3. [Frontend App Structure](../apps/frontend/README.md)

**Backend Developers**

1. [Database Architecture](./architecture/DATABASE.md)
2. [Authentication Guide](./guides/AUTHENTICATION.md)
3. [Backend App Structure](../apps/backend/README.md)

**DevOps Engineers**

1. [Grafana Cloud Setup](./operations/GRAFANA_CLOUD_SETUP.md)
2. [Backup & Restore](./guides/BACKUP_RESTORE_GUIDE.md)
3. [CI/CD Workflows](../.github/workflows/)

---

**Version**: 2.0.0
**Last Updated**: 2025-10-08
**Documentation Structure**: Reorganized and cleaned up
