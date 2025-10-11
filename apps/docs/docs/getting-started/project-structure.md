# Project Structure

ftry uses an Nx monorepo architecture with clear separation between apps and libraries.

## Overview

```
ftry/
├── apps/
│   ├── frontend/          # React 19 application (all frontend code here)
│   ├── backend/           # NestJS 11 application
│   └── docs/              # Docusaurus documentation
├── libs/
│   ├── backend/           # Backend-specific libraries (shared across microservices)
│   └── shared/            # Cross-platform utilities (used by both frontend and backend)
├── prisma/                # Database schema and migrations
├── .claude/               # Claude Code agent configurations
└── docs/                  # Legacy documentation (migrating to apps/docs)
```

## Applications

### Frontend (`apps/frontend/`)

React application with Vite bundler.

**Key directories:**

- `src/pages/` - Page components (routes)
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/config/` - Configuration files (admin configs, etc.)
- `src/lib/` - Utilities and helpers

### Backend (`apps/backend/`)

NestJS application running on Bun runtime.

**Key directories:**

- `src/app/` - Application modules
- `src/modules/` - Feature modules (auth, tenants, etc.)
- `src/common/` - Shared decorators, guards, interceptors

### Documentation (`apps/docs/`)

Docusaurus site for all project documentation.

## Libraries

### Library Organization

ftry uses a **scope-based** approach, not type-based extraction:

| Scope       | Purpose                                    | Used By               |
| ----------- | ------------------------------------------ | --------------------- |
| **backend** | Backend NestJS modules                     | Backend microservices |
| **shared**  | Cross-platform utilities, types, constants | Frontend AND backend  |

:::danger No Frontend Libraries
Frontend code is NOT extracted into libraries. All frontend code lives in `apps/frontend/src/` because future frontend applications will use different tech stacks (React Native, Next.js, etc.) and cannot reuse React-specific code.
:::

### Backend Libraries (`libs/backend/`)

```
libs/backend/
├── auth/                  # Authentication module
├── admin/                 # Admin CRUD services
├── tenants/               # Multi-tenancy
├── users/                 # User management
├── permissions/           # Permission system
└── roles/                 # Role management
```

### Shared Libraries (`libs/shared/`)

**Only cross-platform code** (no framework dependencies):

```
libs/shared/
├── types/                 # TypeScript types and interfaces
├── constants/             # Shared constants (HTTP codes, etc.)
├── utils/                 # Pure utility functions
└── prisma/                # Prisma client
```

## Key Files

### Root Configuration

- `nx.json` - Nx workspace configuration
- `package.json` - Dependencies and scripts
- `tsconfig.base.json` - Base TypeScript config
- `.gitignore` - Git ignore rules
- `CLAUDE.md` - Claude Code instructions

### Database

- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - Migration history
- `prisma/seed.ts` - Database seeding script

### Claude Code

- `.claude/` - Agent and command configurations
- `.claude/AGENT_COMMAND_CATALOG.md` - Agent reference
- `.claude/DOCUMENTATION_STANDARDS.md` - Doc standards

## Module-Specific CLAUDE.md Files

Many modules have their own `CLAUDE.md` with specific guidance:

- `libs/backend/auth/CLAUDE.md` - Authentication patterns
- `prisma/CLAUDE.md` - Database schema guidelines
- `apps/frontend/CLAUDE.md` - Frontend conventions

## Import Paths

ftry uses TypeScript path mapping for clean imports:

```typescript
// Frontend
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// Backend
import { AuthModule } from '@ftry/backend/auth';
import { TenantsService } from '@ftry/backend/tenants';

// Shared
import { Tenant } from '@ftry/shared/types';
```

Path mappings are configured in `tsconfig.base.json`.

## Non-Buildable Libraries

**CRITICAL**: Libraries in ftry are non-buildable. Only apps have build targets.

This means:

- Libraries have no `build` target in `project.json`
- Faster development (no intermediate builds)
- Better affected detection by Nx
- Simpler dependency management

## Documentation

**Official Documentation**: Always maintained in **Docusaurus** (`apps/docs/`).

Legacy markdown files in `docs/` are being migrated. See [Documentation Standards](../guides/claude-code#documentation-policy).

## Next Steps

- [Development Workflow](./development-workflow)
- [Nx Monorepo Architecture](../architecture/nx-monorepo)
