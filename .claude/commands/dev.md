---
description: Start development servers with auto-cleanup and hot reload
---

Start both frontend and backend development servers with intelligent port management and hot reload.

## Usage

```bash
# Start both servers
/dev

# Start frontend only
/dev frontend

# Start backend only
/dev backend

# Start with specific ports
/dev --frontend-port 3000 --backend-port 3001

# Start with debug mode
/dev --debug
```

## What It Does

### Automatic Setup

1. **Port cleanup** - Kills processes on ports 3000 and 3001
2. **Environment check** - Validates `.env` configuration
3. **Database connection** - Verifies PostgreSQL availability
4. **Prisma client** - Ensures generated client is up-to-date
5. **Concurrent start** - Launches both servers in parallel

### Commands Executed

```bash
# Port cleanup
bun run scripts/kill-ports.ts

# Environment validation
# Checks DATABASE_URL, JWT_SECRET, etc.

# Start servers
concurrently --kill-others-on-fail \
  --names "backend,frontend" \
  "nx serve backend" \
  "nx serve frontend"
```

## Development Servers

### Frontend (Port 3000)

- **Framework**: React 19 + Vite
- **Hot Reload**: Instant HMR via Vite
- **Build Tool**: Vite 7.0.0
- **TypeScript**: Full type checking
- **Proxy**: API requests → `http://localhost:3001`

### Backend (Port 3001)

- **Framework**: NestJS 11
- **Runtime**: Bun 1.2.19
- **Watch Mode**: Auto-restart on changes
- **Build Tool**: Webpack (SWC)
- **API Docs**: Swagger at `/api/docs`

## Port Configuration

**Default Ports:**

- Frontend: `3000`
- Backend: `3001`
- PostgreSQL: `5432`
- Prisma Studio: `5555` (if running)

**Port conflicts?** Run `/dev` - it auto-kills existing processes

## Environment Requirements

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ftry

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CSRF Protection
CSRF_SECRET=your-csrf-secret-min-32-chars

# Environment
NODE_ENV=development
```

### Validation

The command validates:

- All required variables exist
- JWT_SECRET is strong enough (min 32 chars)
- DATABASE_URL is valid
- PostgreSQL is accessible
- Prisma schema is in sync

## Hot Reload Features

### Frontend

- **Component changes**: Instant HMR without page reload
- **Style changes**: Live CSS injection
- **Route changes**: Auto-refresh with state preservation
- **Type errors**: Displayed in browser overlay

### Backend

- **Controller changes**: Auto-restart with Webpack watch
- **Service changes**: Fast incremental compilation
- **Config changes**: Requires manual restart
- **Schema changes**: Run `/db-migrate` separately

## Debugging

### Frontend Debug

```bash
# Browser DevTools
# React DevTools (extension)
# Redux DevTools (for Zustand)

# Vite client console
[vite] connecting...
[vite] connected.
```

### Backend Debug

```bash
# NestJS logs
[Nest] INFO  [NestFactory] Starting Nest application...
[Nest] INFO  [InstanceLoader] AppModule dependencies initialized

# Attach debugger
/dev --debug  # Enables Node inspector
```

## Error Handling

### Common Issues

**Port already in use:**

- Auto-fixed by `kill-ports.ts` script
- Manual: `lsof -ti:3000 | xargs kill -9`

**Database not available:**

- Start PostgreSQL: `docker-compose up -d postgres`
- Check connection: `bunx prisma db pull`

**Prisma client outdated:**

- Auto-fixed: Runs `bunx prisma generate`
- Manual: `/db-migrate generate`

**Environment variables missing:**

- Copy `.env.example` to `.env`
- Fill in required values
- Restart `/dev`

## Performance

### Startup Time

- **Initial**: ~3-5 seconds
- **Hot reload (Frontend)**: ~100-500ms
- **Hot reload (Backend)**: ~1-2 seconds

### Resource Usage

- **Frontend (Vite)**: ~200-300 MB RAM
- **Backend (NestJS)**: ~150-250 MB RAM
- **Total**: ~500 MB RAM typical

## Integration with Workflow

### Typical Development Flow

```bash
# 1. Start development servers
/dev

# 2. Make changes
# Edit code in apps/frontend or apps/backend

# 3. See changes live
# Frontend: Instant HMR
# Backend: Auto-restart

# 4. Test changes
/test-first MyComponent unit

# 5. Commit when done
/commit "feat(scope): description"
```

## Advanced Usage

### Nx Target Options

```bash
# Frontend with specific options
nx serve frontend --port 4200 --open

# Backend with debug
nx serve backend --inspect

# Build mode (no watch)
nx build frontend
nx build backend
```

### Concurrent Options

```bash
# Different colors per service
# Prefix output with service name
# Kill all on first failure

# Configured in package.json scripts
```

## Production Build

**This command is for development only!**

For production:

```bash
# Build both apps
bun run build

# Or affected only
bun run build  # Uses nx affected
```

## Technology Stack

- **Package Manager**: Bun 1.2.19
- **Monorepo**: Nx 21.6.3
- **Frontend**: React 19 + Vite 7.0.0
- **Backend**: NestJS 11 + Webpack
- **Process Manager**: concurrently 9.2.1

## See Also

- `apps/frontend/CLAUDE.md` - Frontend development guide
- `apps/backend/CLAUDE.md` - Backend development guide
- `/test-first` - TDD workflow
- `/commit` - Automated quality checks and commit
