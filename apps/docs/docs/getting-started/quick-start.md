# Quick Start

Get up and running with ftry in minutes. This guide will walk you through setting up your development environment and running the application locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Bun**: v1.3.0 or later ([Download](https://bun.sh))
- **PostgreSQL**: v18 ([Download](https://www.postgresql.org/download/))
- **Node.js**: v20+ (for compatibility, but we use Bun)
- **Git**: For version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ftry/ftry.git
cd ftry
```

### 2. Install Dependencies

**CRITICAL**: Use `bun` exclusively for package management.

```bash
bun install
```

:::danger Never use npm, yarn, or pnpm
This project uses Bun exclusively. Using other package managers will cause issues.
:::

### 3. Set Up Database

Create a PostgreSQL database for development:

```bash
# Create database
createdb ftry_dev

# Copy environment variables
cp .env.example .env

# Update .env with your database URL
# DATABASE_URL="postgresql://username:password@localhost:5432/ftry_dev"
```

### 4. Run Database Migrations

```bash
bunx prisma migrate dev
```

This will:

- Apply all migrations
- Generate Prisma Client
- Seed the database with initial data

### 5. Start Development Servers

#### Option 1: Start Both Frontend and Backend

```bash
bun run dev
```

This starts:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

#### Option 2: Start Individually

```bash
# Terminal 1 - Backend
nx serve backend

# Terminal 2 - Frontend
nx serve frontend
```

## Verify Installation

### Test Backend

Visit http://localhost:3001/api/health - you should see:

```json
{
  "status": "ok",
  "timestamp": "2025-10-11T..."
}
```

### Test Frontend

Visit http://localhost:3000 - you should see the ftry login page.

## Default Credentials

After seeding, you can log in with:

- **Email**: `admin@example.com`
- **Password**: `password123`

:::caution Change Default Credentials
These are development credentials. Never use these in production.
:::

## Running Tests

```bash
# Run all tests
bun run test

# Run frontend tests
nx test frontend

# Run backend tests
nx test backend
```

## Common Commands

### Package Management

```bash
bun install                    # Install dependencies
bun add <package>             # Add dependency
bun add -d <package>          # Add dev dependency
```

### Development

```bash
nx serve frontend             # Start React dev server
nx serve backend              # Start NestJS dev server
bun run dev                   # Start both servers
```

### Database

```bash
bunx prisma migrate dev       # Create and apply migration
bunx prisma generate          # Generate Prisma Client
bunx prisma studio            # Open database GUI
bunx prisma db seed           # Seed database
```

### Quality Checks

```bash
bun run check-all             # Run all quality checks
bun run format                # Format code with Prettier
bun run lint                  # Lint affected files
bun run typecheck             # Type check affected files
```

### Nx Commands

```bash
nx affected:graph             # Visualize affected projects
nx affected --target=test     # Test affected projects
nx affected --target=build    # Build affected projects
```

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues

1. Ensure PostgreSQL is running:

   ```bash
   pg_isready
   ```

2. Check your DATABASE_URL in `.env`

3. Verify database exists:
   ```bash
   psql -l | grep ftry
   ```

### Prisma Client Out of Sync

If you see "Prisma Client is out of sync":

```bash
bunx prisma generate
```

### Build Errors

Clear Nx cache and rebuild:

```bash
nx reset
bun install
nx affected --target=build
```

## Next Steps

Now that you have ftry running locally:

1. [Explore the Project Structure](./project-structure)
2. [Learn the Development Workflow](./development-workflow)
3. [Understand the Architecture](../architecture/overview)
4. [Set Up Claude Code](../guides/claude-code)

## Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/ftry/ftry/issues)
- **Contributing**: See [Contributing Guide](../guides/contributing)
- **Documentation**: Browse the [Architecture](../architecture/overview) section

---

**Congratulations!** You're ready to start developing with ftry.
