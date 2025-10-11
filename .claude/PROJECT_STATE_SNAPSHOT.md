# Project State Snapshot - 2025-10-10

Generated for agent configuration synchronization.

## Package Manager

**Bun 1.2.19** (exclusively) - Enforced via `packageManager` field in package.json

## Core Technologies

### Frontend Stack

- **Framework**: React 19.0.0
- **Language**: TypeScript 5.9.2
- **Build Tool**: Vite 7.0.0
- **Styling**: Tailwind CSS 4.1.14
- **UI Components**: shadcn 3.4.0 (Radix UI primitives)
- **State Management**: Zustand 5.0.8
- **Router**: React Router 7.9.4
- **Forms**: React Hook Form 7.64.0
- **Validation**: Zod 4.1.12
- **Data Fetching**: TanStack Query (React Query) 5.90.2
- **HTTP Client**: Axios 1.6.0
- **Virtual Lists**: @tanstack/react-virtual 3.13.12
- **Icons**: Lucide React 0.545.0
- **Testing**: Vitest 3.0.0 + React Testing Library 16.1.0
- **Coverage**: @vitest/coverage-v8 3.0.5

### Backend Stack

- **Framework**: NestJS 11.0.0
- **Runtime**: Bun 1.2.19 (exclusively - no Node.js/npm)
- **Language**: TypeScript 5.9.2
- **Database ORM**: Prisma 6.16.3
- **Database**: PostgreSQL 18
- **Authentication**: @nestjs/jwt 11.0.0, passport-jwt 4.0.1
- **Security**: helmet 8.1.0, bcrypt 6.0.0, csrf-csrf 4.0.3
- **Caching**: @nestjs/cache-manager 3.0.1, cache-manager-redis-yet 5.1.5
- **Queue**: @nestjs/bull 11.0.3, bullmq 5.61.0
- **Redis**: ioredis 5.8.1, redis 5.8.3
- **Logging**: pino 10.0.0, pino-http 11.0.0, nestjs-pino 4.4.1
- **Monitoring**: prom-client 15.1.3, @opentelemetry/sdk-node 0.206.0
- **Health Checks**: @nestjs/terminus 11.0.0
- **Scheduling**: @nestjs/schedule 6.0.1
- **Validation**: class-validator 0.14.2, class-transformer 0.5.1
- **Testing**: Jest 30.0.2 + @nestjs/testing 11.0.0
- **API Docs**: @nestjs/swagger 11.2.0
- **Rate Limiting**: @nestjs/throttler 6.4.0

### Shared/Infrastructure

- **Monorepo**: Nx 21.6.3
- **Package Manager**: Bun 1.2.19
- **Linting**: ESLint 9.8.0, typescript-eslint 8.40.0
- **Formatting**: Prettier 3.6.2
- **Git Hooks**: Husky 9.1.7
- **Commit Linting**: @commitlint/cli 20.1.0
- **Testing Utilities**:
  - @testing-library/jest-dom 6.9.1
  - @testing-library/user-event 14.6.1
  - @testing-library/dom 10.4.0
  - jest-mock-extended 4.0.0
  - axios-mock-adapter 2.1.0
- **Build Tools**:
  - @swc/core 1.13.5
  - webpack-cli 5.1.4
  - ts-node 10.9.1

## Key Libraries

### UI/Styling

- @radix-ui/react-dialog 1.1.15
- @radix-ui/react-dropdown-menu 2.1.16
- @radix-ui/react-select 2.2.6
- @radix-ui/react-checkbox 1.3.3
- @radix-ui/react-label 2.1.7
- @radix-ui/react-icons 1.3.2
- @radix-ui/react-slot 1.2.3
- @radix-ui/react-alert-dialog 1.1.15
- @tailwindcss/vite 4.1.14
- tailwind-merge 3.3.1
- class-variance-authority 0.7.1
- clsx 2.1.1
- next-themes 0.4.6
- sonner 2.0.7 (toast notifications)

### Form Handling

- react-hook-form 7.64.0
- @hookform/resolvers 5.2.2
- zod 4.1.12

### Data Fetching & State

- @tanstack/react-query 5.90.2
- @tanstack/react-query-devtools 5.90.2
- zustand 5.0.8
- axios 1.6.0

### Security & Authentication

- @nestjs/passport 11.0.5
- passport 0.7.0
- passport-jwt 4.0.1
- passport-local 1.0.0
- bcrypt 6.0.0
- helmet 8.1.0
- csrf-csrf 4.0.3
- cookie-parser 1.4.7
- crypto-js 4.2.0

### Database & ORM

- @prisma/client 6.16.3
- prisma 6.16.3

### Monitoring & Observability

- @opentelemetry/api 1.9.0
- @opentelemetry/sdk-node 0.206.0
- @opentelemetry/auto-instrumentations-node 0.65.0
- @opentelemetry/exporter-trace-otlp-http 0.206.0
- @opentelemetry/sdk-trace-web 2.1.0
- @opentelemetry/resources 2.1.0
- @opentelemetry/semantic-conventions 1.37.0
- prom-client 15.1.3

## Project Structure

### Applications

```
apps/
├── frontend/          # React 19 + Vite 7 application
│   └── src/
│       ├── components/
│       │   ├── ui/        # shadcn/ui components
│       │   ├── common/    # Shared components
│       │   ├── layouts/   # Layout components
│       │   └── modals/    # Modal components
│       ├── pages/         # Route pages
│       ├── hooks/         # Custom hooks
│       ├── lib/           # Utilities (api-client, csrf)
│       ├── store/         # Zustand stores
│       └── routes/        # Routing configuration
└── backend/           # NestJS 11 + Bun application
    └── src/
        ├── app/
        └── main.ts
```

### Libraries

```
libs/
├── backend/
│   ├── auth/          # Authentication & authorization
│   ├── cache/         # Redis caching module
│   ├── common/        # Common utilities
│   ├── health/        # Health check endpoints
│   ├── logger/        # Pino logging
│   ├── monitoring/    # Prometheus & OpenTelemetry
│   ├── queue/         # BullMQ job queue
│   └── redis/         # Redis client
├── frontend/
│   ├── api-client/    # Unified API client with TanStack Query
│   ├── auth/          # Auth library (LEGACY - migrate to api-client)
│   ├── hooks/         # Shared custom hooks
│   ├── test-utils/    # Testing utilities
│   └── ui-components/ # Shared UI components
└── shared/
    ├── prisma/        # Prisma schema & migrations
    └── types/         # Shared TypeScript types
```

## Common Import Patterns

```typescript
// UI Components
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';

// Utilities
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// API & Data Fetching
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { authApi } from '@/lib/auth';
import { QueryProvider } from '@/lib/api';

// State Management
import { useUIStore, useAuthStore } from '@/store';

// Testing
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
```

## Critical Configuration

### TypeScript

- Version: 5.9.2
- Strict mode: enabled
- Target: es2015
- Module: esnext
- Lib: ["es2020", "dom"]

### Nx Configuration

- Version: 21.6.3
- Plugin-based configuration (no project.json in many libs)
- Affected detection enabled
- Caching enabled
- Non-buildable libraries (only apps have build targets)

### Testing Configuration

- Frontend: Vitest 3.0.0
- Backend: Jest 30.0.2
- E2E: SuperTest (apps/backend-e2e)
- Coverage tools: @vitest/coverage-v8, native Jest coverage

### Build Tools

- Frontend: Vite 7.0.0
- Backend: Webpack (via @nx/webpack)
- Transpiler: SWC 1.13.5

## Scripts

```json
{
  "format": "prettier --write .",
  "lint": "nx affected --target=lint --parallel=3",
  "typecheck": "nx affected --target=typecheck --parallel=3",
  "test": "nx affected --target=test --parallel=3",
  "build": "nx affected --target=build --parallel=3",
  "dev": "bun run scripts/kill-ports.ts && concurrently --kill-others-on-fail --names \"backend,frontend\" \"nx serve backend\" \"nx serve frontend\"",
  "check-all": "bun run format && concurrently --kill-others-on-fail --names \"lint,types,test\" \"bun run lint\" \"bun run typecheck\" \"bun run test\"",
  "db:generate": "bunx prisma generate",
  "db:migrate": "bunx prisma migrate dev",
  "db:studio": "bunx prisma studio"
}
```

## Recent Major Changes

1. **React 19 Migration**: Updated from React 18 to React 19.0.0
2. **Vite 7 Migration**: Updated from Vite 5/6 to Vite 7.0.0
3. **TanStack Query Integration**: Added React Query 5.90.2 for data fetching
4. **NestJS 11 Migration**: Updated from NestJS 10 to NestJS 11.0.0
5. **Prisma 6 Migration**: Updated from Prisma 5 to Prisma 6.16.3
6. **Jest 30 Migration**: Updated from Jest 29 to Jest 30.0.2
7. **TypeScript 5.9**: Updated from TypeScript 5.8 to TypeScript 5.9.2
8. **Nx 21.6**: Updated to Nx 21.6.3

## Current Focus

- **Feature**: Authentication system implementation
- **Branch**: feature/authentication
- **Key Features**:
  - JWT with HTTP-only cookies
  - CSRF protection
  - Row-Level Security (RLS) for multi-tenant isolation
  - TanStack Query integration for API calls
