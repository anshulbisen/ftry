# ftry

Salon & Spa Management SaaS - A comprehensive platform for Indian salon businesses.

## Tech Stack

- **Runtime & Package Manager**: Bun
- **Frontend**: React 19 with Vite
- **Backend**: NestJS 11
- **Monorepo**: Nx 21.6.3
- **Language**: TypeScript 5.9.2

## Prerequisites

- [Bun](https://bun.sh) v1.2.19 or later
- Nx will automatically use bun for package operations

**IMPORTANT**: This project exclusively uses **bun**. Do not use npm, yarn, pnpm, or node.

## Getting Started

```bash
# Install dependencies
bun install

# Start frontend development server
nx serve frontend

# Start backend development server
nx serve backend

# Run tests
nx test frontend
nx test backend

# Build for production
nx build frontend
nx build backend

# Lint code
nx lint frontend
nx lint backend
```

> **Note**: Nx automatically detects and uses bun via the `packageManager` field in package.json and the bun.lock file. Simply run `nx` commands directly.

## Project Structure

```
/apps
  /frontend          # React application
  /backend           # NestJS application
  /backend-e2e       # E2E tests
/libs
  /shared
    /types           # Shared types
    /utils           # Shared utilities
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for comprehensive project documentation, architecture decisions, and development guidelines.

## License

Private - All Rights Reserved
