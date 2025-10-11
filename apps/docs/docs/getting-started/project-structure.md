# Project Structure

ftry uses an Nx monorepo architecture with clear separation between apps and libraries.

## Overview

```
ftry/
├── apps/
│   ├── frontend/          # React 19 application
│   ├── backend/           # NestJS 11 application
│   └── docs/              # Docusaurus documentation
├── libs/
│   ├── frontend/          # Frontend-specific libraries
│   ├── backend/           # Backend-specific libraries
│   └── shared/            # Shared utilities
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

### Library Types

ftry follows Nx best practices with four library types:

| Type        | Purpose                   | Can Depend On                  |
| ----------- | ------------------------- | ------------------------------ |
| feature     | Business logic            | feature, ui, data-access, util |
| ui          | Presentational components | ui, util                       |
| data-access | API calls, state          | data-access, util              |
| util        | Pure utilities            | util                           |

### Frontend Libraries (`libs/frontend/`)

```
libs/frontend/
├── feature-auth/          # Authentication feature
├── feature-admin/         # Admin CRUD interfaces
├── ui-components/         # Shared UI components
├── data-access-api/       # API client (TanStack Query)
└── util-hooks/            # Reusable React hooks
```

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

```
libs/shared/
├── types/                 # Shared TypeScript types
├── util-validation/       # Validation utilities
└── util-formatting/       # Formatting helpers
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
