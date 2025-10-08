# Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- **Bun** (v1.2.19+): https://bun.sh/

**Note**: Docker is no longer required! Both PostgreSQL (Neon) and Redis (Redis Cloud) are cloud-hosted.

## Setup

```bash
# 1. Install dependencies
bun install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your configuration
# - Set DEVELOPER_NAME to your name
# - Database and Redis credentials are pre-configured for cloud services
# - Add Grafana Cloud credentials (optional, see docs/GRAFANA_CLOUD_SETUP.md)

# 4. Run database migrations
bun run db:migrate

# 5. Seed demo data (optional)
bun run db:seed

# 6. Start development servers
bun run dev
```

**That's it!** 🎉

- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- Grafana Cloud: https://anshulbisen.grafana.net/ (if configured)

## Common Commands

```bash
# Development
bun run dev          # Start backend + frontend

# Database (Cloud-based - Neon PostgreSQL)
bun run db:migrate   # Run migrations
bun run db:seed      # Seed demo data
bun run db:studio    # Open Prisma Studio GUI

# Code Quality
bun run format       # Format code
bun run lint         # Lint code
bun run typecheck    # Type check
bun run test         # Run tests
bun run check-all    # Run all checks
```

## Troubleshooting

**Backend won't connect to database?**

- Verify DATABASE_URL in `.env` points to Neon cloud instance
- Check your internet connection (cloud services required)
- Ensure Neon database is active (free tier may pause after inactivity)

**Redis connection issues?**

- Verify REDIS_HOST, REDIS_PORT, REDIS_USERNAME, and REDIS_PASSWORD in `.env`
- Check your internet connection
- Verify Redis Cloud instance is active

**Ports already in use?**

- The dev script automatically kills ports 3000 & 3001
- If still an issue, manually kill: `lsof -ti:3000 | xargs kill -9`

## Learn More

- **Full Docs**: `CLAUDE.md` - Complete project documentation
- **Grafana Setup**: `docs/GRAFANA_CLOUD_SETUP.md` - Telemetry setup
- **Architecture**: `docs/` - Technical documentation
