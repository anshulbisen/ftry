# ftry

Salon & Spa Management SaaS for Indian businesses.

## Quick Start

```bash
bun install
cp .env.example .env
# Edit .env with your configuration
# Note: PostgreSQL (Neon) and Redis Cloud credentials are pre-configured
bun run db:migrate
bun run dev
```

**→ See [QUICK_START.md](./QUICK_START.md) for detailed setup**

## Demo Credentials

- super@ftry.com / DevPassword123!@#
- admin@glamour.com / DevPassword123!@#
- manager@glamour.com / DevPassword123!@#

## Tech Stack

- **Runtime**: Bun 1.2.19
- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui
- **Backend**: NestJS 11, PostgreSQL 18 (Neon Cloud), Prisma 6, Redis 7 (Redis Cloud)
- **Monorepo**: Nx 21.6.3
- **Telemetry**: Grafana Cloud

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[CLAUDE.md](./CLAUDE.md)** - Complete project documentation
- **[docs/](./docs/)** - Technical guides

## Development

```bash
# Start development servers
bun run dev           # Start backend + frontend

# Database (Cloud-based - Neon PostgreSQL)
bun run db:migrate    # Run migrations
bun run db:studio     # Open Prisma Studio

# Code quality
bun run format        # Format code
bun run lint          # Lint code
bun run test          # Run tests
bun run check-all     # All checks
```

## Project Structure

```
apps/
  backend/          # NestJS API
  frontend/         # React SPA
libs/
  backend/          # Backend libraries
  frontend/         # Frontend libraries
  shared/           # Shared code
docs/               # Documentation
prisma/             # Database schema
```

## License

Proprietary - Anshul Bisen
