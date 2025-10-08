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
- **Package Manager**: Bun 1.2.19 exclusively

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

## Quick Commands

### Development

```bash
nx serve frontend        # Start React dev server (port 3000)
nx serve backend         # Start NestJS dev server (port 3001)
bun run dev             # Start both with auto-cleanup
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

# Run comprehensive review
/full-review

# Quick targeted fixes
/quick-fix performance

# Quality checks and commit
/commit "feat(scope): description"

# Update documentation
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

## Documentation Index

### Architecture & Design

- `.nx/NX_ARCHITECTURE.md` - Monorepo structure, library patterns
- `docs/ARCHITECTURE_REVIEW_EXECUTIVE_SUMMARY.md` - Strategic decisions
- `docs/DATABASE_ARCHITECTURE_REVIEW.md` - Complete database review

### Security & Authentication

- `docs/AUTHENTICATION.md` - Auth system overview
- `docs/RLS_INTEGRATION_REPORT.md` - Row-Level Security implementation
- `docs/CSRF_MIGRATION.md` - CSRF protection details

### Operations & Infrastructure

- `docs/BACKUP_RESTORE_GUIDE.md` - Database backup strategy
- `docs/GRAFANA_CLOUD_SETUP.md` - Monitoring setup
- `docs/CLOUD_MIGRATION_SUMMARY.md` - Infrastructure decisions

### Development

- `.claude/WORKFLOWS.md` - Standard development workflows (TDD, feature implementation)
- `.claude/AGENT_COMMAND_CATALOG.md` - Complete agent and command reference
- `docs/QUICK_START.md` - Getting started guide

## Market Context

**Target**: Indian salon/spa businesses (Indian SMB market)
**Key Requirements**:

- GST compliance for all billing
- Support for Indian payment gateways (Razorpay, UPI)
- Mobile-first design (salon reception context)
- Offline-first considerations (variable internet)
- Hindi/regional language support (future)

## Getting Help

1. **Quick reference**: This file (CLAUDE.md)
2. **Module specifics**: Read relevant CLAUDE.md in module directory
3. **Workflows**: See `.claude/WORKFLOWS.md`
4. **Commands**: See `.claude/SLASH_COMMANDS.md`
5. **Agents**: See `.claude/AGENT_COMMAND_CATALOG.md`
6. **Architecture**: See `.nx/NX_ARCHITECTURE.md`
7. **Database**: See `prisma/CLAUDE.md`

## Reference Documents

Strategic planning documents in `knowledge-base/`:

1. Blueprint for Building Your Salon SaaS as a Solo Developer
2. Roadmap for Launching a Salon SaaS Startup (Pune, India)
3. Salon & Spa Management App: Core Features and AI Innovations

---

**Last Updated**: 2025-10-08
**Status**: Active development (Authentication feature)
**Line Count**: ~190 (Target: <200)
