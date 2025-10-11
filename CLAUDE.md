# CLAUDE.md

Quick reference for Claude Code when working with the ftry Salon & Spa Management SaaS project.

## Project Overview

**ftry** - Salon & Spa Management SaaS for Indian market (Pune-based startup)
**Current Milestone**: Authentication system implementation (feature/authentication branch)
**Approach**: Solo founder, TDD, incremental development, quality-first

## Tech Stack Essentials

- **Frontend**: React 19 + Vite + Tailwind CSS 4.1 + shadcn/ui + Zustand
- **Backend**: NestJS 11 + Bun runtime + Prisma 6 + PostgreSQL 18
- **Monorepo**: Nx 21.6.3 (non-buildable libraries)
- **Testing**: Vitest (frontend), Jest (backend)
- **Package Manager**: Bun 1.3.0 exclusively

**Full tech stack details**: See package.json or `.claude/TECH_STACK.md`

## Critical Standards

### Package Manager Policy

**Bun exclusively - Zero tolerance for other package managers**

```bash
# ✅ CORRECT
bun install
bun add <package>
nx serve frontend        # Nx detects bun automatically

# ❌ NEVER
npm install
yarn add
node script.js
bun nx serve             # Don't prefix nx with bun
```

**Why**: Nx has built-in bun support. Package manager enforced via packageManager field in package.json.

### Test-Driven Development

**Always write tests BEFORE implementation**

1. Write failing tests first
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Commit with passing tests only

Use `/test-first [component] [type]` command for guided TDD workflow.

### Conventional Commits

**Format**: `type(scope): subject`

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore

**Examples**:

```bash
feat(auth): implement JWT refresh token rotation
fix(billing): correct GST calculation for multi-item invoices
test(appointments): add integration tests for booking flow
```

**Enforcement**: commitlint via Husky pre-commit hook

### Documentation Policy

**CRITICAL: Docusaurus is the ONLY documentation medium**

All project documentation MUST be maintained in Docusaurus (`apps/docs/`).

```bash
# Access documentation
nx serve docs                    # http://localhost:3002

# Update documentation after changes
/update-docs [feature-name]

# Create new feature documentation
/update-docs new [feature-name]

# Validate all documentation
/update-docs validate
```

**Rules**:

- ✅ All technical documentation in `apps/docs/docs/`
- ✅ Use `/update-docs` command after feature implementation
- ✅ Documentation updates required before PR merge
- ❌ NEVER create standalone markdown files in `docs/` root
- ❌ NEVER create README.md files outside package documentation
- ❌ NEVER skip documentation updates

**For Claude Code, Agents, Commands, and Hooks**:

- Always create/update documentation in Docusaurus when implementing features
- Reference Docusaurus URLs in comments and error messages
- Update sidebar navigation when adding new sections
- Validate documentation links before committing

**Legacy docs in `docs/` are being migrated and will be removed.**

## Quick Commands

### Development

```bash
nx serve frontend        # Start React dev server (port 3000)
nx serve backend         # Start NestJS dev server (port 3001)
nx serve docs            # Start Docusaurus (port 3002)
bun run dev             # Start both frontend and backend
```

### Quality Checks

```bash
bun run check-all       # Run all quality checks (format, lint, typecheck, test)
bun run format          # Format all files with Prettier
bun run lint            # Lint affected files
bun run typecheck       # Type check affected files
bun run test            # Run affected tests
```

### Database

```bash
bunx prisma migrate dev     # Create and apply migration
bunx prisma generate        # Generate Prisma client
bunx prisma studio          # Open database GUI
```

### Nx-Specific

```bash
nx affected:graph       # Visualize affected projects
nx affected --target=test   # Test only affected projects
```

## Expert Agents & Slash Commands

**Quick Access**: See `.claude/AGENT_COMMAND_CATALOG.md` for complete reference

### Common Workflows

```bash
# Feature implementation (full TDD cycle)
/implement-feature "appointment-booking" fullstack

# Write tests first for specific component
/test-first "BookingForm" unit

# Sync repository after feature (docs, agents, commands, review, security)
/sync-repo

# Run comprehensive review only
/full-review

# Quick targeted fixes
/quick-fix performance

# Quality checks and commit
/commit "feat(scope): description"

# Update documentation only
/update-docs authentication
```

### Agent Specializations

- **Core Review**: senior-architect, frontend-expert, backend-expert, database-expert
- **Nx Management**: nx-specialist, module-boundaries
- **Testing**: test-guardian, test-refactor
- **Code Quality**: code-quality-enforcer, code-duplication-detector
- **Optimization**: performance-optimizer
- **Workflow**: feature-planner, git-workflow, docs-maintainer

**Invoke agents via**: `/use-agent [agent-name] [task]`

## Nx Monorepo Architecture

### Core Principles

1. **Non-buildable libraries** - Only apps have build targets
2. **Type-based organization** - feature, ui, data-access, util
3. **Tag-based boundaries** - ESLint enforces dependency rules
4. **Small libraries** - Better affected detection

### Library Types & Dependencies

| Type        | Can Depend On                  | Location Pattern            |
| ----------- | ------------------------------ | --------------------------- |
| feature     | feature, ui, data-access, util | libs/[scope]/feature-[name] |
| ui          | ui, util                       | libs/[scope]/ui-[name]      |
| data-access | data-access, util              | libs/[scope]/data-access    |
| util        | util                           | libs/shared/util-[name]     |

### Creating Libraries

Use `/add-library [type] [scope] [name]` or:

```bash
nx g @nx/react:library feature-booking \
  --directory=libs/appointments/feature-booking \
  --tags=type:feature,scope:appointments \
  --bundler=none \
  --unitTestRunner=vitest
```

**Detailed guide**: See `.nx/NX_ARCHITECTURE.md`

## shadcn/ui Components

**CRITICAL**: Always run from project root, not `apps/frontend/`

```bash
# ✅ Correct
bunx shadcn@latest add button card dialog

# ❌ Wrong
cd apps/frontend && bunx shadcn@latest add button
```

**Usage**: Import from `@/components/ui/[component]`

## Admin CRUD Pattern

**New Architecture** (2025-10-11): Configuration-based admin interfaces

### Creating New Admin Resource

**Quick**: See `docs/ADMIN_QUICK_START.md` (30-minute guide)

```typescript
// 1. Create config file: apps/frontend/src/config/admin/resource.config.tsx
import { ResourceManager } from '@/components/admin/common/ResourceManager';
import { resourceConfig } from '@/config/admin/resource.config';

export const resourceConfig: ResourceConfig<Entity, CreateDto, UpdateDto> = {
  metadata: { singular: 'User', plural: 'Users', icon: Users },
  permissions: { create: ['users:create:all'], read: ['users:read:all'] },
  hooks: { useList: useUsers, useCreate: useCreateUser },
  table: { columns: [...], defaultSort: { key: 'name', direction: 'asc' } },
  form: { component: UserForm },
};

// 2. Use in page: apps/frontend/src/pages/admin/UsersPage.tsx
export const UsersPage = () => <ResourceManager config={resourceConfig} />;
```

**Benefits**:

- 93% code reduction (450 lines → 150 lines)
- Type-safe with full IntelliSense
- Consistent UX across all admin pages
- Single source of truth per resource

**Detailed Guide**: `docs/ADMIN_CRUD_ARCHITECTURE.md`

## Common Pitfalls

### Package Manager

- ❌ Using npm/yarn/pnpm instead of bun
- ❌ Running `bun nx` instead of `nx`
- **Fix**: Use bun for package management, nx directly for commands

### Testing

- ❌ Implementing before writing tests
- ❌ Committing with failing tests
- **Fix**: Always TDD, use `/test-first` command

### Nx Libraries

- ❌ Adding build targets to libraries
- ❌ Wrong dependency directions (ui → feature)
- **Fix**: Follow type-based dependency rules, libraries are non-buildable

### Database

- ❌ Forgetting to run `bunx prisma generate` after schema changes
- ❌ Missing tenant isolation in queries
- **Fix**: Always regenerate client, use RLS (automatic via JwtStrategy)

## Code Quality Automation

### Pre-commit Hooks (Husky)

- Automatically format with Prettier
- Run ESLint with auto-fix
- Type check affected files
- Validate commit message format

### CI/CD (GitHub Actions)

- Lint, format check, type check
- Run affected tests with coverage
- Build affected projects
- **Requirement**: All checks must pass

## Module-Specific Guidance

**Detailed CLAUDE.md files exist for**:

- `libs/backend/auth/CLAUDE.md` - Authentication (JWT, CSRF, RLS)
- `prisma/CLAUDE.md` - Database schema, migrations, RLS
- `apps/frontend/CLAUDE.md` - Frontend patterns, component architecture
- More in individual library directories

**Rule**: Read module CLAUDE.md before making significant changes

## Documentation

**Primary Documentation**: All technical documentation is maintained in **Docusaurus** at `apps/docs/`.

```bash
# Access documentation site
nx serve docs       # http://localhost:3002
```

### Documentation Sections

**Docusaurus (`apps/docs/docs/`):**

- **Getting Started** - Introduction, quick start, project structure, workflow
- **Architecture** - Overview, Nx monorepo, frontend, backend, database, auth, admin
- **API Reference** - REST API endpoints and schemas
- **Guides** - Contributing, Claude Code setup, TDD, libraries, testing

### Legacy Documentation

**Note**: Files in `docs/` are being migrated to Docusaurus and will be archived.

**Still referenced (temporary)**:

- `.nx/NX_ARCHITECTURE.md` - Monorepo architecture (migrating)
- `.claude/WORKFLOWS.md` - Development workflows (migrating)
- `.claude/AGENT_COMMAND_CATALOG.md` - Agent reference
- `prisma/CLAUDE.md` - Database-specific guidance
- `libs/backend/auth/CLAUDE.md` - Auth module guidance

## Market Context

**Target**: Indian salon/spa businesses (Indian SMB market)
**Key Requirements**:

- GST compliance for all billing
- Support for Indian payment gateways (Razorpay, UPI)
- Mobile-first design (salon reception context)
- Offline-first considerations (variable internet)
- Hindi/regional language support (future)

## Getting Help

1. **Documentation Site**: `nx serve docs` (http://localhost:3002)
2. **Quick Reference**: This file (CLAUDE.md)
3. **Module Specifics**: Read relevant CLAUDE.md in module directory
4. **Agents & Commands**: See `.claude/AGENT_COMMAND_CATALOG.md`

## Reference Documents

Strategic planning documents in `knowledge-base/`:

1. Blueprint for Building Your Salon SaaS as a Solo Developer
2. Roadmap for Launching a Salon SaaS Startup (Pune, India)
3. Salon & Spa Management App: Core Features and AI Innovations

---

**Last Updated**: 2025-10-11
**Status**: Active development (Authentication feature)
**Documentation**: Docusaurus at `apps/docs/` (port 3002)
