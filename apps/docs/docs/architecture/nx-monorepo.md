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
│   ├── backend/           # Backend-specific libraries (shared across backend microservices)
│   └── shared/            # Cross-platform utilities (used by both frontend and backend)
│
├── prisma/                # Database schema and migrations
├── .claude/               # Claude Code agent configurations
├── nx.json                # Nx workspace configuration
├── package.json           # Root dependencies
└── tsconfig.base.json     # Base TypeScript configuration
```

## Library Organization Strategy

ftry uses a **scope-based** approach to organize libraries, not type-based extraction.

### Two Library Scopes

| Scope       | Purpose                                    | Used By                   | Location Pattern      |
| ----------- | ------------------------------------------ | ------------------------- | --------------------- |
| **backend** | Backend-specific code (NestJS modules)     | Backend microservices     | `libs/backend/[name]` |
| **shared**  | Cross-platform utilities, types, constants | Both frontend and backend | `libs/shared/[name]`  |

### Why No Frontend Libraries?

**Key Architectural Decision**: We do NOT extract frontend-specific libraries because:

1. **Different Tech Stacks**: Future frontend applications (mobile app, admin panel, customer portal) will use different technologies (React Native, Next.js, Vue, etc.)
2. **No Reuse Benefit**: Sharing React components across different tech stacks is impossible
3. **Simpler Architecture**: Keeping frontend code in `apps/frontend/src/` reduces abstraction overhead
4. **Backend Reuse**: Backend microservices (NestJS) share common modules, making `libs/backend/` valuable

### What Goes Where?

| Code Type                         | Location                | Examples                            |
| --------------------------------- | ----------------------- | ----------------------------------- |
| Frontend UI components            | `apps/frontend/src/`    | React components, pages, hooks      |
| Backend NestJS modules            | `libs/backend/[name]`   | Auth, Admin, Tenants, Monitoring    |
| Shared types and interfaces       | `libs/shared/types`     | User, Tenant, API response types    |
| Shared utilities (cross-platform) | `libs/shared/utils`     | Date formatting, validation helpers |
| Shared constants                  | `libs/shared/constants` | HTTP status codes, error messages   |

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

:::info Frontend Code Organization
Frontend code lives directly in `apps/frontend/src/` and will NEVER be extracted to shared libraries. This is an architectural decision based on the fact that future frontend applications will use different tech stacks and cannot reuse React-specific code.
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

**Cross-platform code** shared between BOTH frontend and backend.

**Purpose**: Only code that can be used by different tech stacks (TypeScript types, constants, pure utility functions).

```
libs/shared/
├── types/                 # TypeScript types and interfaces
│   ├── src/lib/
│   │   ├── user.types.ts
│   │   ├── auth.types.ts
│   │   └── api.types.ts
│   └── index.ts           # Shared by React frontend AND NestJS backend
│
├── constants/             # Shared constants
│   ├── src/lib/
│   │   ├── auth.constants.ts
│   │   └── validation.constants.ts
│   └── index.ts           # HTTP status codes, error messages, etc.
│
├── utils/                 # Pure utility functions (no framework dependencies)
│   ├── src/lib/
│   │   ├── formatting.ts   # Date formatting, currency, etc.
│   │   └── validation.ts   # Email validation, phone, etc.
│   └── index.ts
│
└── prisma/                # Prisma client and database access
    ├── src/lib/
    │   └── prisma.service.ts
    └── index.ts
```

:::tip Shared Library Rule
Only add code to `libs/shared/` if it will be used by BOTH frontend and backend. Framework-specific code (React hooks, NestJS decorators) belongs in the app or backend libraries.
:::

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
        // Backend can only depend on backend + shared
        {
          "sourceTag": "scope:backend",
          "onlyDependOnLibsWithTags": ["scope:backend", "scope:shared"]
        },
        // Shared libraries can only depend on other shared libraries
        {
          "sourceTag": "scope:shared",
          "onlyDependOnLibsWithTags": ["scope:shared"]
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

// libs/shared/types/project.json
{
  "tags": ["scope:shared", "type:util"]
}
```

**Enforcement**: ESLint will error if you violate dependency rules.

:::warning No Frontend Library Tags
Frontend code in `apps/frontend/` does not use library tags since it's not extracted into libraries. Module boundaries are enforced at the app level through TypeScript path aliases and code organization.
:::

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

**Pattern**: `[scope]/[name]`

**Examples**:

- `backend/auth` - Authentication module
- `backend/tenants` - Multi-tenancy module
- `shared/types` - Shared TypeScript types
- `shared/utils` - Pure utility functions

:::warning
Always set `--bundler=none` or `--buildable=false` to maintain non-buildable architecture.
:::

:::danger No Frontend Libraries
Do NOT create libraries for frontend code. Keep all frontend code in `apps/frontend/src/`. Future frontend applications will use different tech stacks and cannot reuse React-specific libraries.
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

### Adding a New Frontend Feature

```bash
# 1. Add components directly to apps/frontend/src/
# - Create page in apps/frontend/src/pages/
# - Create components in apps/frontend/src/components/
# - Create hooks in apps/frontend/src/hooks/

# 2. Wire up in app routing (apps/frontend/src/routes/)

# 3. Run tests
nx test frontend

# 4. Check affected projects
nx affected:graph
```

### Adding a New Backend Feature

```bash
# 1. Create backend library
nx g @nx/nest:library billing \
  --directory=libs/backend/billing \
  --tags=scope:backend,type:data-access

# 2. Implement NestJS module

# 3. Run tests
nx test backend-billing

# 4. Check affected projects
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

- Use generators to create backend and shared libraries (consistency)
- Tag libraries correctly (scope:backend or scope:shared)
- Keep libraries small and focused
- Export only public API through `index.ts`
- Document complex libraries with README.md or CLAUDE.md
- Use affected commands in CI/CD
- Respect dependency boundaries
- Keep frontend code in `apps/frontend/src/`

### DON'T ❌

- Create buildable libraries (use non-buildable)
- Create frontend-specific libraries (keep in app)
- Cross scope boundaries (backend → frontend or vice versa)
- Bypass path aliases with relative imports
- Create circular dependencies
- Export internal implementation details
- Extract React components to shared libraries

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
