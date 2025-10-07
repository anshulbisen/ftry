# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ftry** is a Salon & Spa Management SaaS application being developed as a solo founder project. The goal is to build a comprehensive salon management platform that addresses gaps in existing solutions (like Dingg), with a focus on data-driven insights, AI-powered recommendations, and automated customer engagement.

**Target Market**: Indian salon and spa businesses, initially focusing on Pune and expanding to other Indian cities.

**Current Stage**: Development phase - Nx monorepo initialized with React frontend and NestJS backend applications.

## Tech Stack

- **Frontend**: React 19 with Vite bundler
- **UI Components**: shadcn/ui (component library built on Radix UI and Tailwind CSS)
- **Styling**: Tailwind CSS 4.1.14 with CSS variables
- **Backend**: NestJS 11 with Webpack
- **Runtime & Package Manager**: Bun (exclusively used for all operations)
- **Architecture**: Nx 21.6.3 monorepo with shared libraries
- **Testing**: Vitest for frontend, Jest for backend and libraries
- **Code Quality**: ESLint 9 (flat config), Prettier 3.6, Husky 9, lint-staged, commitlint
- **TypeScript**: 5.9.2 across the stack
- **Database**: PostgreSQL (planned for structured data)
- **Infrastructure**: Cloud-based (AWS/GCP/Azure with managed services)
- **Development Approach**: Microservices-ready modular architecture, starting with monolith

## Core Features (MVP Scope)

1. **Appointment Management**: Online booking, scheduling, calendar management
2. **Client Management**: Customer database, profiles, visit history, preferences
3. **Point of Sale**: Billing, invoicing with GST compliance for Indian market
4. **Reminders**: SMS/WhatsApp appointment reminders
5. **Staff Management**: Employee scheduling and basic resource management

## Future Features (Post-MVP)

- AI-driven insights and recommendations
- Automated customer outreach and re-engagement campaigns
- Analytics dashboard with business intelligence
- Loyalty programs and promotional tools
- Multi-location support
- Inventory management
- Mobile app for clients and staff

## Development Philosophy

This project follows a **lean, iterative, customer-focused approach**:

- Start with focused MVP solving core pain points
- Avoid feature creep - defer nice-to-haves
- Test early with real salons (dogfooding approach)
- Build incrementally with frequent releases
- Prioritize simplicity and maintainability (solo developer context)

## Key Architectural Decisions

- **Nx Monorepo**: Use Nx workspace to manage frontend, backend, and shared libraries in a single repository
- **Modular Design**: Structure code in clear modules/services even if starting as monolith
- **Cloud-First**: Leverage managed services and serverless where possible to minimize ops overhead
- **Multi-tenancy**: Design data isolation for multiple salon clients from the start
- **Mobile-Friendly**: Ensure UI works well on tablets and mobile devices (salon reception context)

## Indian Market Considerations

- **GST Compliance**: All invoicing and billing must support GST
- **Payment Integration**: Use Indian payment gateways (Razorpay, Instamojo) supporting UPI, cards, net banking
- **Language Support**: Plan for Hindi/regional language UI (future)
- **Pricing**: Sensitive to Indian SMB budgets, consider tiered subscription model
- **Local Infrastructure**: Design for variable internet connectivity

## Data Security & Compliance

- Handle sensitive customer PII (names, phone numbers, visit history)
- Secure payment information (use gateway tokenization)
- Plan for data backup and recovery
- Consider future compliance requirements for handling personal data

## Development Guidelines

- Use TypeScript for type safety across the stack
- Implement proper error handling and logging from the start
- Write basic tests for critical business logic (see TDD guidelines in global CLAUDE.md)
- Use environment variables for configuration
- Follow consistent code formatting (enforced by Prettier + ESLint)
- **CRITICAL**: Always use bun - never npm, yarn, pnpm, or node
- **REQUIRED**: Use Conventional Commits format for all commit messages
- **AUTOMATED**: Pre-commit hooks will format, lint, and type-check your code
- **BEST PRACTICE**: Run `bun run check-all` before pushing to ensure CI will pass

## Package Manager Policy

**This project uses bun exclusively**. No other package manager or runtime is permitted.

Nx has built-in support for bun (since v19.1). It detects bun via:

1. The `packageManager` field in package.json (set to `bun@1.2.19`)
2. The presence of bun.lock file

**Command Usage:**

- ✅ **DO**: Use `bun install`, `bun add`, `bun remove`, `bun update` for package management
- ✅ **DO**: Use `nx` commands directly (e.g., `nx serve frontend`) - Nx uses bun internally
- ✅ **DO**: Use `bun run` for running package.json scripts directly
- ✅ **DO**: Use `bun` as the runtime for all Node.js scripts
- ❌ **NEVER**: Use npm, npx, yarn, pnpm, or node commands
- ❌ **NEVER**: Prefix nx commands with other package managers (not `npm run nx`, just `nx`)
- ❌ **NEVER**: Create or maintain package-lock.json, yarn.lock, or pnpm-lock.yaml
- ✅ **ONLY**: bun.lock is the legitimate lock file

## UI Component Library: shadcn/ui

Frontend uses **shadcn/ui** (copy-paste components, not npm package) built with Radix UI + Tailwind CSS v4.

### Key Information

- **Config**: `/components.json` (monorepo-aware paths), `/tsconfig.json` (CLI compatibility)
- **Components**: Added to `apps/frontend/src/components/ui/`
- **Utility**: `cn()` function at `apps/frontend/src/lib/utils.ts` for class merging
- **Theme**: CSS variables in `apps/frontend/src/styles.css` (light + dark mode)

### Adding Components

**CRITICAL**: Run from project root, NOT from `apps/frontend/`:

```bash
# ✅ Correct
bunx shadcn@latest add button card dialog input

# ❌ Wrong
cd apps/frontend && bunx shadcn@latest add button
```

### Using Components

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Basic usage
<Button variant="outline">Click</Button>

// With cn() for conditional styling
<div className={cn('base', isActive && 'active')} />
```

### Important Notes

- Components are fully customizable (edit `apps/frontend/src/components/ui/*.tsx`)
- Use `@/` path alias for imports (configured in vite.config.ts)
- Theme variables in `@theme` block, dark mode in `.dark` selector
- All dependencies React 19 compatible

**See `apps/frontend/README.md` for detailed documentation.**

## Code Quality & Standards

This project enforces high code quality standards through automated tooling and processes.

### Git Hooks (Husky 9.x)

Git hooks are automatically installed via `bun install` (husky prepare script).

**Pre-commit Hook** (.husky/pre-commit):

- Runs lint-staged to check staged files
- Automatically formats code with Prettier
- Runs ESLint with auto-fix
- Performs type checking on affected files

**Commit Message Hook** (.husky/commit-msg):

- Validates commit messages follow Conventional Commits format
- Enforced via commitlint

### Commit Message Convention

We use **Conventional Commits** for clear and structured commit history.

**Format**: `type(scope): subject`

**Allowed types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (not CSS)
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes (tooling, etc.)
- `revert`: Revert previous commit

**Examples**:

```bash
feat(appointments): add online booking form
fix(billing): correct GST calculation for multi-item invoices
docs(readme): update setup instructions
refactor(auth): simplify token validation logic
```

### Code Formatting (Prettier 3.6.2)

Prettier automatically formats code on commit. Configuration in `.prettierrc`:

- Single quotes
- 100 character line width
- 2 space indentation
- Trailing commas (ES5)
- Semicolons required
- LF line endings

**Manual formatting**:

```bash
bun run format          # Format all files
bun run format:check    # Check formatting without writing
```

### Linting (ESLint 9 with Flat Config)

ESLint enforces code quality rules using the modern flat config format.

**Features**:

- Nx module boundary enforcement
- TypeScript-specific rules
- React best practices
- Automatic fixes where possible

**Commands**:

```bash
bun run lint           # Lint affected files
bun run lint:fix       # Lint and auto-fix affected files
```

### Type Checking

TypeScript type checking runs on affected files during pre-commit.

**Commands**:

```bash
bun run typecheck      # Type check affected files
```

### Continuous Integration (GitHub Actions)

**CI Workflow** (`.github/workflows/ci.yml`) runs on push and PRs:

1. **Code Quality Job**:
   - Linting (ESLint)
   - Type checking (TypeScript)
   - Format checking (Prettier)

2. **Tests Job**:
   - Unit tests (affected)
   - Coverage reports
   - Uploads to Codecov (if configured)

3. **Build Job**:
   - Builds all affected projects
   - Archives production artifacts on main branch

**CI uses**:

- Bun 1.2.19 (via oven-sh/setup-bun@v2)
- Parallel execution for speed
- Nx affected commands for efficiency

### Dependency Management

**Dependabot** (`.github/dependabot.yml`) automatically:

- Checks for updates weekly (Monday 9 AM IST)
- Groups related packages (Nx, NestJS, React, Testing, etc.)
- Creates PRs for minor and patch updates
- Ignores major updates (manual review required)
- Also updates GitHub Actions

### Pull Request Process

**PR Template** includes:

- Type of change checklist
- Related issues
- Testing checklist
- Screenshots (if applicable)
- Self-review confirmation

**PR Requirements** (enforced by CI):

- ✅ All tests pass
- ✅ Linting passes
- ✅ Type checking passes
- ✅ Code is formatted
- ✅ Conventional commit messages
- ✅ Build succeeds

### Issue Templates

Two structured issue templates available:

1. **Bug Report** (.github/ISSUE_TEMPLATE/bug_report.yml)
   - Description, steps to reproduce, expected vs actual behavior
   - Version and environment details

2. **Feature Request** (.github/ISSUE_TEMPLATE/feature_request.yml)
   - Problem statement, proposed solution
   - Priority and scope selection

### Quality Commands

Quick reference for common quality checks:

```bash
# Pre-push check (run all quality checks)
bun run check-all

# Individual checks
bun run format:check   # Check code formatting
bun run lint           # Run linter
bun run typecheck      # Type check TypeScript
bun run test           # Run affected tests
bun run build          # Build affected projects

# With coverage
bun run test:coverage

# All projects (not just affected)
bun run test:all
bun run build:all
```

### Claude Code Hooks

This project uses **Claude Code hooks** to automatically enforce standards and provide helpful context.

**Configured Hooks**:

1. **Bash Command Validator** (`PreToolUse` on Bash tool)
   - Blocks wrong package managers (npm, yarn, pnpm, node)
   - Warns about suboptimal patterns (`bun nx` → `nx`, bash commands → specialized tools)
   - Prevents git anti-patterns (--no-verify, --force)

2. **Tooling Context Injector** (`SessionStart`)
   - Automatically injects project standards at session start
   - Reminds about bun, nx commands, quality tools, commit format
   - No manual reminders needed!

3. **Code Quality Reminder** (`PostToolUse` on Write/Edit)
   - Suggests quality checks after file modifications
   - Context-aware (different suggestions for code, tests, configs)
   - Non-blocking reminders

**Hook Configuration**: `.claude/settings.json`
**Hook Scripts**: `.claude/hooks/`
**Documentation**: `.claude/hooks/README.md`

**Testing Hooks Manually**:

```bash
# Test bash validator
echo '{"tool_name":"Bash","tool_input":{"command":"npm install"}}' | .claude/hooks/validate-bash.py

# Test context injection
echo '{"hook_event_name":"SessionStart"}' | .claude/hooks/add-tooling-context.py

# Test quality reminder
echo '{"tool_name":"Write","tool_input":{"file_path":"src/test.ts"}}' | .claude/hooks/check-code-quality.py
```

**Debugging Hooks**:

```bash
# See detailed hook execution
claude --debug

# Review hook configuration
# In Claude Code, use: /hooks
```

**Modifying Hooks**:

1. Edit Python script in `.claude/hooks/`
2. Test manually with sample input
3. Reload Claude Code or review in `/hooks` menu

See `.claude/hooks/README.md` for detailed hook documentation.

## Nx Monorepo Architecture

This project follows Nx best practices for optimal build performance and maintainability.

### Core Principles

1. **Non-Buildable Libraries**: All libraries are NON-BUILDABLE by default. Only applications have build targets. Libraries are directly bundled into apps.
2. **Small, Focused Libraries**: Smaller libraries = more granular affected detection = faster builds
3. **Type-Based Organization**: Every library has a type (feature, ui, data-access, util) with enforced dependency rules
4. **Clear Module Boundaries**: ESLint enforces dependency constraints based on tags

### Library Types

**Four main types with specific purposes:**

1. **Feature (`type:feature`)** - Smart components with business logic
   - Can depend on: ANY library type
   - Location: `libs/[scope]/feature-[name]`
   - Example: `libs/appointments/feature-booking`

2. **UI (`type:ui`)** - Presentational components only
   - Can depend on: UI and util libraries ONLY
   - Location: `libs/[scope]/ui-[name]` or `libs/shared/ui-[name]`
   - Example: `libs/shared/ui-components`

3. **Data-Access (`type:data-access`)** - API services and state management
   - Can depend on: data-access and util libraries ONLY
   - Location: `libs/[scope]/data-access`
   - Example: `libs/appointments/data-access`

4. **Util (`type:util`)** - Pure functions and utilities
   - Can depend on: OTHER util libraries ONLY
   - Location: `libs/shared/util-[name]`
   - Example: `libs/shared/util-formatters`

### Creating New Libraries

**Before creating, ask:**

- Is this code reused in multiple places?
- Does this represent a distinct concern?
- What type is this (feature, ui, data-access, util)?

**Generate commands (always non-buildable):**

```bash
# Feature library (React)
nx g @nx/react:library feature-[name] \
  --directory=libs/[scope]/feature-[name] \
  --tags=type:feature,scope:[scope] \
  --bundler=none \
  --unitTestRunner=vitest

# UI library (React)
nx g @nx/react:library ui-[name] \
  --directory=libs/[scope]/ui-[name] \
  --tags=type:ui,scope:[scope] \
  --bundler=none \
  --unitTestRunner=vitest

# Data-access library (NestJS backend)
nx g @nx/nest:library data-access-[name] \
  --directory=libs/[scope]/data-access-[name] \
  --tags=type:data-access,scope:[scope],platform:server \
  --buildable=false

# Util library
nx g @nx/js:library util-[name] \
  --directory=libs/shared/util-[name] \
  --tags=type:util,scope:shared \
  --bundler=none \
  --unitTestRunner=vitest
```

**Required tags:**

- Type tag: `type:feature`, `type:ui`, `type:data-access`, or `type:util`
- Scope tag: `scope:shared`, `scope:appointments`, `scope:clients`, etc.

### Dependency Rules (Enforced by ESLint)

| From ↓ / To →   | feature | ui  | data-access | util |
| --------------- | ------- | --- | ----------- | ---- |
| **feature**     | ✅      | ✅  | ✅          | ✅   |
| **ui**          | ❌      | ✅  | ❌          | ✅   |
| **data-access** | ❌      | ❌  | ✅          | ✅   |
| **util**        | ❌      | ❌  | ❌          | ✅   |

### Nx Affected Optimization

**How it works:**

1. Git diff identifies changed files
2. Project graph determines affected projects
3. Only affected projects are tested/built

**Best practices:**

- Keep libraries small and focused
- Avoid large "shared" libraries that cause everything to rebuild
- Use proper tags for module boundary enforcement

**Commands:**

```bash
nx affected:graph              # Visualize what's affected
nx affected --target=test      # Test only affected projects
nx affected --target=lint      # Lint only affected projects
nx affected --target=build     # Build only affected apps (not libs!)
```

### Important: No Library Builds

**Libraries are NEVER built separately:**

- ❌ Libraries do NOT have build targets in `project.json`
- ✅ Libraries are bundled directly into applications
- ✅ Only apps/frontend and apps/backend have build targets

This maximizes incremental build performance and tree-shaking.

**Full Architecture Documentation**: See `.nx/NX_ARCHITECTURE.md`

## Project Structure

```
/apps
  /frontend          # React 19 application with Vite
  /backend           # NestJS 11 application with Webpack
  /backend-e2e       # End-to-end tests for backend
/libs
  /shared
    /types           # Shared data models/types (@ftry/shared/types)
    /utils           # Common utilities (@ftry/shared/utils)
  /features          # Feature libraries (to be created)
    /appointments    # Appointment-related code (future)
    /clients         # Client management (future)
    /billing         # POS and billing (future)
```

## Available Commands

**IMPORTANT**: This project exclusively uses **bun** as both the package manager and runtime. Never use npm, yarn, pnpm, or node.

Nx automatically detects and uses bun based on the `packageManager` field in package.json and the bun.lock file. Simply run `nx` commands directly.

```bash
# Package Management
bun install            # Install dependencies (never use npm/yarn/pnpm)
bun add <package>      # Add a new package
bun remove <package>   # Remove a package
bun update             # Update dependencies

# Development
nx serve frontend      # Start React frontend dev server (Nx uses bun internally)
nx serve backend       # Start NestJS backend dev server

# Build
nx build frontend      # Build frontend for production
nx build backend       # Build backend for production
nx run-many -t build   # Build all projects

# Testing
nx test frontend       # Run frontend tests with Vitest
nx test backend        # Run backend tests with Jest
nx test types          # Run shared types tests
nx test utils          # Run shared utils tests

# Linting
nx lint frontend       # Lint frontend code
nx lint backend        # Lint backend code

# Generate
nx g @nx/react:component --project=frontend    # Generate React component
nx g @nx/nest:resource --project=backend       # Generate NestJS resource
nx g @nx/js:lib --directory=libs/features      # Generate shared library

# Run scripts (alternative syntax)
bun run <script>       # Run package.json scripts directly with bun
```

## Reference Documents

The `knowlege-base/` directory contains three comprehensive planning documents:

1. **Blueprint for Building Your Salon SaaS as a Solo Developer.txt**: Step-by-step guide covering validation, planning, tech stack, MVP development, testing, AI features, marketing, and scaling.

2. **Roadmap for Launching a Salon SaaS Startup as a Solo Developer (Pune, India).txt**: Phased timeline (Months 0-24+) with market research, legal setup, development milestones, pilot testing, launch strategy, and growth plans specific to the Indian market.

3. **Salon & Spa Management App\_ Core Features and AI Innovations (2025).txt**: Detailed feature specifications including core functionality (booking, CRM, POS, loyalty) and AI-powered capabilities (24/7 automation, predictive analytics, personalized recommendations).

These documents should be consulted for product decisions, feature priorities, and strategic direction.
