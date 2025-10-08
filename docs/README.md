# ftry Documentation

**ftry** is a Salon & Spa Management SaaS application for the Indian market.

## Quick Links

- [Authentication Guide](./AUTHENTICATION.md) - Complete auth implementation details
- [Database Schema](./DATABASE.md) - PostgreSQL schema and Prisma setup
- [Development Setup](#development-setup) - Get started developing

## Development Setup

### Prerequisites

- Bun 1.2.19+
- PostgreSQL 16+
- Node.js (for Nx compatibility)

### Quick Start

```bash
# Install dependencies
bun install

# Start database (Docker)
docker-compose up -d

# Run migrations
bunx prisma migrate dev

# Seed database
bunx prisma db seed

# Start backend
nx serve backend

# Start frontend (in another terminal)
nx serve frontend
```

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

## Project Structure

```
ftry/
├── apps/
│   ├── frontend/          # React 19 + Vite
│   └── backend/           # NestJS 11
├── libs/
│   ├── frontend/          # Frontend libraries
│   ├── backend/           # Backend libraries
│   └── shared/            # Shared code
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Seed data
└── docs/                  # Documentation
```

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, shadcn/ui
- **Backend**: NestJS 11, Bun runtime
- **Database**: PostgreSQL 16, Prisma 6
- **Monorepo**: Nx 21.6
- **Auth**: JWT with refresh token rotation

## Available Commands

```bash
# Development
nx serve frontend          # Start frontend dev server
nx serve backend           # Start backend dev server

# Testing
nx test frontend           # Run frontend tests (Vitest)
nx test backend            # Run backend tests (Jest)
nx test --all              # Run all tests

# Building
nx build frontend          # Build frontend for production
nx build backend           # Build backend for production

# Database
bunx prisma studio         # Open Prisma Studio
bunx prisma migrate dev    # Create and apply migration
bunx prisma db seed        # Seed database

# Code Quality
bun run format             # Format all files
bun run lint               # Lint affected files
bun run typecheck          # Type check affected files
bun run check-all          # Run all quality checks
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**Required variables**:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (generate with `openssl rand -base64 64`)
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiry (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiry (default: 7d)

## Documentation

- **[Authentication](./AUTHENTICATION.md)** - Complete authentication & authorization guide
- **[Database](./DATABASE.md)** - Schema design, migrations, and best practices
- **[Contributing](../CLAUDE.md)** - Development guidelines and code standards

## Support

For issues or questions:

1. Check the relevant documentation file
2. Review the CLAUDE.md files in each module
3. Create an issue in the GitHub repository

---

**Version**: 1.0.0
**Last Updated**: 2025-10-08
