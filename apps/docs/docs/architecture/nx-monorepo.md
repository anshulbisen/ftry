# Nx Monorepo Architecture

ftry uses an Nx monorepo to manage multiple applications and libraries with clear boundaries and efficient build caching.

## Overview

**Nx Version**: 21.6.3
**Philosophy**: Non-buildable libraries, type-based organization, tag-based boundaries
**Benefits**: Faster builds, better code reuse, enforced architecture

## Repository Structure

```
ftry/
├── apps/
│   ├── frontend/          # React 19 application
│   ├── backend/           # NestJS 11 application
│   └── docs/              # Docusaurus documentation
│
├── libs/
│   ├── frontend/          # Frontend-specific libraries
│   ├── backend/           # Backend-specific libraries
│   └── shared/            # Cross-platform utilities
│
├── prisma/                # Database schema and migrations
├── .claude/               # Claude Code agent configurations
├── nx.json                # Nx workspace configuration
├── package.json           # Root dependencies
└── tsconfig.base.json     # Base TypeScript configuration
```

## Library Types

Nx promotes organizing libraries by type, each with specific responsibilities and dependency rules.

### Four Library Types

| Type            | Purpose                              | Can Depend On                  | Location Pattern                  |
| --------------- | ------------------------------------ | ------------------------------ | --------------------------------- |
| **feature**     | Smart components with business logic | feature, ui, data-access, util | `libs/[scope]/feature-[name]`     |
| **ui**          | Presentational components            | ui, util                       | `libs/[scope]/ui-[name]`          |
| **data-access** | API calls, state management          | data-access, util              | `libs/[scope]/data-access-[name]` |
| **util**        | Pure utilities (no dependencies)     | util                           | `libs/shared/util-[name]`         |

### Dependency Rules (Enforced by ESLint)

```
feature ───┬──> ui ──────┐
           │             │
           ├──> data-access ──> util
           │             │
           └─────────────┘
```

**Rule**: Dependencies flow downward. A `ui` library cannot import from `feature`.

## Applications

### Frontend (`apps/frontend/`)

React application with Vite bundler.

**Key Configuration**:

- **Build Target**: Yes (deployable app)
- **Dev Server**: `nx serve frontend` (port 3000)
- **Path Alias**: `@/` for internal imports
- **Testing**: Vitest + React Testing Library

**Structure**:

```
apps/frontend/
├── src/
│   ├── pages/             # Route components
│   ├── components/        # UI components (consolidated)
│   ├── hooks/             # Custom React hooks
│   ├── config/            # Configuration files
│   ├── lib/               # Utilities
│   ├── routes/            # React Router configuration
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── project.json           # Nx targets
```

:::info Recent Consolidation
Frontend libraries were consolidated into the app directory (2025-10-11) to reduce complexity. Future extraction will be strategic based on reuse patterns.
:::

### Backend (`apps/backend/`)

NestJS application running on Bun runtime.

**Key Configuration**:

- **Build Target**: Yes (deployable app)
- **Dev Server**: `nx serve backend` (port 3001)
- **Runtime**: Bun 1.3.0 (not Node.js)
- **Testing**: Jest

**Structure**:

```
apps/backend/
├── src/
│   ├── app/
│   │   ├── app.module.ts      # Root module
│   │   └── app.controller.ts  # Health check
│   └── main.ts                # Entry point with Bun
├── webpack.config.js          # Webpack for Bun
├── tsconfig.json              # TypeScript config
└── project.json               # Nx targets
```

### Documentation (`apps/docs/`)

Docusaurus site for all project documentation.

**Key Configuration**:

- **Build Target**: Yes (deployable site)
- **Dev Server**: `nx serve docs` (port 3002)
- **Framework**: Docusaurus 3.x

**Structure**:

```
apps/docs/
├── docs/                  # Markdown documentation
│   ├── getting-started/
│   ├── architecture/
│   ├── api/
│   └── guides/
├── src/                   # Docusaurus components
├── static/                # Static assets
├── docusaurus.config.ts   # Configuration
├── sidebars.ts            # Navigation structure
└── project.json           # Nx targets
```

## Libraries

### Frontend Libraries (`libs/frontend/`)

**Current Status**: Consolidated into `apps/frontend/src/components/`

**Future Structure** (as patterns emerge):

```
libs/frontend/
├── feature-auth/          # Authentication UI flows
├── feature-admin/         # Admin CRUD interfaces
├── ui-components/         # Reusable UI components
├── data-access-api/       # TanStack Query API client
└── util-hooks/            # Custom React hooks
```

### Backend Libraries (`libs/backend/`)

NestJS modules organized by domain.

```
libs/backend/
├── auth/                  # Authentication (JWT, refresh tokens)
│   ├── src/lib/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── strategies/
│   │   ├── guards/
│   │   └── auth.module.ts
│   └── CLAUDE.md          # Module-specific guidance
│
├── admin/                 # Admin CRUD operations
│   ├── src/lib/
│   │   ├── controllers/   # User, Role, Permission, Tenant
│   │   ├── services/
│   │   └── admin.module.ts
│   └── README.md
│
├── tenants/               # Multi-tenancy support
├── health/                # Health check endpoints
├── monitoring/            # Metrics and observability
└── common/                # Shared guards, interceptors, decorators
```

**Key Patterns**:

- Each library is a complete NestJS module
- Export public API through `index.ts`
- Module-specific `CLAUDE.md` for AI guidance
- Non-buildable (referenced directly)

### Shared Libraries (`libs/shared/`)

Cross-platform code shared between frontend and backend.

```
libs/shared/
├── types/                 # TypeScript types and interfaces
│   ├── src/lib/
│   │   ├── user.types.ts
│   │   ├── auth.types.ts
│   │   └── api.types.ts
│   └── index.ts
│
├── constants/             # Shared constants
│   ├── src/lib/
│   │   ├── auth.constants.ts
│   │   └── validation.constants.ts
│   └── index.ts
│
├── utils/                 # Pure utility functions
│   ├── src/lib/
│   │   ├── formatting.ts
│   │   └── validation.ts
│   └── index.ts
│
└── prisma/                # Prisma client and database access
    ├── src/lib/
    │   └── prisma.service.ts
    └── index.ts
```

## Non-Buildable Libraries

**CRITICAL CONCEPT**: Libraries in ftry are non-buildable (no build targets).

### Why Non-Buildable?

**Benefits**:

- **Faster Development**: No intermediate builds, instant changes
- **Better Affected Detection**: Nx can track at file level, not library level
- **Simpler Setup**: No build configuration per library
- **Direct Imports**: TypeScript resolves imports directly

**Trade-offs**:

- Cannot publish libraries to npm (not a goal for ftry)
- All code bundled into consuming app

### Configuration

```json
// libs/backend/auth/project.json
{
  "name": "backend-auth",
  "sourceRoot": "libs/backend/auth/src",
  "projectType": "library",
  "tags": ["scope:backend", "type:data-access"],
  "targets": {
    "lint": { ... },
    "test": { ... }
    // NO "build" target
  }
}
```

## Tag-Based Boundaries

Nx uses tags to enforce dependency rules via ESLint.

### Tag System

```typescript
// .eslintrc.json (root)
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "depConstraints": [
        // Frontend can only depend on frontend + shared
        {
          "sourceTag": "scope:frontend",
          "onlyDependOnLibsWithTags": ["scope:frontend", "scope:shared"]
        },
        // Backend can only depend on backend + shared
        {
          "sourceTag": "scope:backend",
          "onlyDependOnLibsWithTags": ["scope:backend", "scope:shared"]
        },
        // Feature can depend on ui, data-access, util
        {
          "sourceTag": "type:feature",
          "onlyDependOnLibsWithTags": [
            "type:feature",
            "type:ui",
            "type:data-access",
            "type:util"
          ]
        },
        // UI can only depend on ui and util
        {
          "sourceTag": "type:ui",
          "onlyDependOnLibsWithTags": ["type:ui", "type:util"]
        }
      ]
    }
  ]
}
```

### Library Tags

```json
// libs/backend/auth/project.json
{
  "tags": ["scope:backend", "type:data-access"]
}

// libs/frontend/ui-components/project.json (future)
{
  "tags": ["scope:frontend", "type:ui"]
}
```

**Enforcement**: ESLint will error if you violate dependency rules.

## Import Paths

ftry uses TypeScript path mapping for clean imports.

### Frontend Imports

```typescript
// Internal app imports use @/
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// Library imports use @ftry/ prefix
import { User } from '@ftry/shared/types';
```

### Backend Imports

```typescript
// Library imports use @ftry/ prefix
import { AuthModule } from '@ftry/backend/auth';
import { PrismaService } from '@ftry/shared/prisma';
import { UserWithPermissions } from '@ftry/shared/types';
```

### Path Configuration

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@ftry/backend/auth": ["libs/backend/auth/src/index.ts"],
      "@ftry/backend/admin": ["libs/backend/admin/src/index.ts"],
      "@ftry/shared/types": ["libs/shared/types/src/index.ts"],
      "@ftry/shared/constants": ["libs/shared/constants/src/index.ts"],
      "@ftry/shared/utils": ["libs/shared/utils/src/index.ts"],
      "@ftry/shared/prisma": ["libs/shared/prisma/src/index.ts"]
    }
  }
}
```

## Creating Libraries

### Using Nx Generators

```bash
# React library (frontend)
nx g @nx/react:library feature-booking \
  --directory=libs/frontend/feature-booking \
  --tags=scope:frontend,type:feature \
  --bundler=none \
  --unitTestRunner=vitest

# NestJS library (backend)
nx g @nx/nest:library tenants \
  --directory=libs/backend/tenants \
  --tags=scope:backend,type:data-access \
  --buildable=false

# Shared utility library
nx g @nx/js:library util-formatting \
  --directory=libs/shared/util-formatting \
  --tags=scope:shared,type:util \
  --bundler=none \
  --unitTestRunner=vitest
```

### Library Naming Convention

**Pattern**: `[scope]/[type]-[name]`

**Examples**:

- `frontend/feature-appointments`
- `backend/data-access-billing`
- `shared/util-validation`

:::warning
Always set `--bundler=none` or `--buildable=false` to maintain non-buildable architecture.
:::

## Affected Commands

Nx only runs tasks on affected projects (those changed since base branch).

### Common Affected Commands

```bash
# See what's affected
nx affected:graph

# Test only affected
nx affected --target=test

# Lint only affected
nx affected --target=lint

# Build only affected apps
nx affected --target=build

# Typecheck affected
nx affected --target=typecheck
```

### How Affected Detection Works

Nx compares current branch to base branch (main) and:

1. Detects changed files
2. Builds dependency graph
3. Marks changed projects as affected
4. Marks projects depending on affected projects

**Example**:

```
Change libs/shared/types → Affects:
  - libs/shared/types (direct)
  - libs/backend/auth (imports types)
  - apps/backend (imports auth)
  - apps/frontend (imports types)
```

## Nx Cache

Nx caches task results to avoid redundant work.

### What Gets Cached?

- Test results
- Build outputs
- Lint results
- Type check results

### Cache Configuration

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^default", "{workspaceRoot}/jest.preset.js"]
    }
  }
}
```

### Cache Invalidation

Cache invalidates when:

- Source files change
- Dependencies change
- Configuration files change

### Remote Cache (Future)

Nx Cloud can share cache across team:

```bash
# Share cache with team
nx connect-to-nx-cloud
```

## Common Workflows

### Adding a New Feature

```bash
# 1. Create feature library (if needed)
nx g @nx/react:library feature-billing \
  --directory=libs/frontend/feature-billing \
  --tags=scope:frontend,type:feature

# 2. Add necessary UI components

# 3. Add data-access for API calls (if needed)

# 4. Wire up in app routing

# 5. Run tests
nx test frontend-feature-billing

# 6. Check affected projects
nx affected:graph
```

### Refactoring Across Libraries

```bash
# 1. Make changes in library

# 2. See what's affected
nx affected:graph

# 3. Test affected projects
nx affected --target=test

# 4. Fix any breaking changes

# 5. Commit
```

### Debugging Dependency Issues

```bash
# Visualize full dependency graph
nx graph

# Check specific project dependencies
nx graph --focus=backend-auth

# Check why project is affected
nx affected:graph --base=main --head=HEAD

# Lint module boundaries
nx lint
```

## Performance Optimization

### Parallel Execution

```bash
# Run tests in parallel (default)
nx affected --target=test --parallel=3

# Build multiple apps in parallel
nx run-many --target=build --projects=frontend,backend --parallel
```

### Task Orchestration

```json
// nx.json - Define task dependencies
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"] // Build dependencies first
    }
  }
}
```

## Troubleshooting

### "Cannot find module '@ftry/...'"

**Solution**:

1. Check `tsconfig.base.json` has correct path mapping
2. Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")
3. Clear Nx cache: `nx reset`

### ESLint Module Boundary Violation

**Error**: `A project tagged with "scope:frontend" can only depend on libs tagged with "scope:frontend", "scope:shared"`

**Solution**: Review your import. Frontend cannot import from backend.

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset

# Skip cache for single run
nx test frontend --skip-nx-cache

# Disable cache temporarily
NX_CACHE_PROJECT_GRAPH=false nx affected --target=test
```

## Best Practices

### DO ✅

- Use generators to create libraries (consistency)
- Tag libraries correctly (scope + type)
- Keep libraries small and focused
- Export only public API through `index.ts`
- Document complex libraries with README.md or CLAUDE.md
- Use affected commands in CI/CD
- Respect dependency boundaries

### DON'T ❌

- Create buildable libraries (use non-buildable)
- Cross scope boundaries (frontend → backend)
- Violate type hierarchy (ui → feature)
- Bypass path aliases with relative imports
- Create circular dependencies
- Export internal implementation details

## Next Steps

- [Frontend Architecture](./frontend.md) - React app structure
- [Backend Architecture](./backend.md) - NestJS module design

## Resources

- [Nx Documentation](https://nx.dev)
- [Nx Library Types](https://nx.dev/more-concepts/library-types)
- [Module Boundaries](https://nx.dev/core-features/enforce-module-boundaries)

---

**Last Updated**: 2025-10-11
**Nx Version**: 21.6.3
