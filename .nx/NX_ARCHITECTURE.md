# Nx Monorepo Architecture Guide

> **Purpose**: This document defines the architectural standards and best practices for organizing code in the ftry Nx monorepo to maximize build efficiency and maintainability.

## Table of Contents

- [Core Principles](#core-principles)
- [Library Types](#library-types)
- [Folder Structure](#folder-structure)
- [Dependency Rules](#dependency-rules)
- [Library Creation Guidelines](#library-creation-guidelines)
- [Tagging Strategy](#tagging-strategy)
- [Build Configuration](#build-configuration)
- [Nx Affected Optimization](#nx-affected-optimization)

## Core Principles

### 1. **Non-Buildable Libraries by Default**

- **All libraries are NON-BUILDABLE** unless there's a specific reason
- Libraries are directly referenced and bundled with applications
- **Only applications have build targets**
- This maximizes incremental build performance

### 2. **Small, Focused Libraries**

- Each library should have a single, well-defined purpose
- Smaller libraries = more granular affected detection
- Avoid large "shared" libraries that cause everything to rebuild

### 3. **Clear Dependency Direction**

- Applications depend on libraries
- Libraries can depend on other libraries (following rules)
- No circular dependencies
- Module boundaries enforced via ESLint

### 4. **Type-Based Organization**

- Every library must have a type tag: `type:feature`, `type:ui`, `type:data-access`, `type:util`
- Type determines allowed dependencies
- Enforced automatically via ESLint rules

## Library Types

Nx recommends four main library types, each with specific purposes and dependency rules:

### 1. **Feature Libraries** (`type:feature`)

**Purpose**: Smart components implementing business use cases or pages

**Contains**:

- Container/smart components
- Page-level routing
- State management orchestration
- Business logic integration

**Naming**: `feature-[name]` or `feature`

**Location**: `libs/[scope]/feature-[name]`

**Can Depend On**: Any library type (feature, ui, data-access, util)

**Example**: `libs/appointments/feature-booking`, `libs/clients/feature-profile`

**When to Create**:

- New user-facing feature or page
- Distinct business workflow
- Self-contained functional area

### 2. **UI Libraries** (`type:ui`)

**Purpose**: Presentational (dumb) components with no business logic

**Contains**:

- Pure presentational components
- Reusable UI elements
- Design system components
- No state management or data fetching

**Naming**: `ui-[name]` or `ui`

**Location**: `libs/shared/ui-[name]` or `libs/[scope]/ui-[name]`

**Can Depend On**: Only UI and util libraries

**Example**: `libs/shared/ui-components`, `libs/shared/ui-forms`

**When to Create**:

- Reusable presentational components
- Design system elements
- Generic UI patterns

### 3. **Data-Access Libraries** (`type:data-access`)

**Purpose**: Backend communication and state management

**Contains**:

- API services
- HTTP clients
- State management (stores, reducers, effects)
- Data transformation logic
- WebSocket clients

**Naming**: `data-access-[name]` or `data-access`

**Location**: `libs/[scope]/data-access` or `libs/shared/data-access-[name]`

**Can Depend On**: Only data-access and util libraries

**Example**: `libs/appointments/data-access`, `libs/clients/data-access`

**When to Create**:

- New API endpoint group
- New state management domain
- New external service integration

### 4. **Utility Libraries** (`type:util`)

**Purpose**: Framework-agnostic, reusable utilities

**Contains**:

- Pure functions
- Helper utilities
- Constants
- Types/interfaces
- Validators
- No framework-specific code

**Naming**: `util-[name]`

**Location**: `libs/shared/util-[name]`

**Can Depend On**: Only other util libraries

**Example**: `libs/shared/util-formatters`, `libs/shared/util-validators`

**When to Create**:

- Reusable pure functions
- Shared constants or types
- Cross-cutting utilities

## Folder Structure

```
ftry/
├── apps/
│   ├── frontend/              # React app (has build target)
│   ├── backend/               # NestJS app (has build target)
│   └── backend-e2e/           # E2E tests
│
├── libs/
│   ├── shared/                # Shared across frontend and backend
│   │   ├── types/             # type:util - Shared TypeScript types
│   │   ├── utils/             # type:util - Shared utilities
│   │   ├── ui-components/     # type:ui - Design system components
│   │   ├── ui-forms/          # type:ui - Form components
│   │   └── data-access-auth/  # type:data-access - Auth service
│   │
│   ├── appointments/          # Domain: Appointment management
│   │   ├── feature-booking/   # type:feature - Booking workflow
│   │   ├── feature-calendar/  # type:feature - Calendar view
│   │   ├── ui/                # type:ui - Appointment UI components
│   │   └── data-access/       # type:data-access - Appointments API
│   │
│   ├── clients/               # Domain: Client management
│   │   ├── feature-profile/   # type:feature - Client profile
│   │   ├── feature-list/      # type:feature - Client list
│   │   ├── ui/                # type:ui - Client UI components
│   │   └── data-access/       # type:data-access - Clients API
│   │
│   ├── billing/               # Domain: Billing and invoicing
│   │   ├── feature-invoice/   # type:feature - Invoice creation
│   │   ├── ui/                # type:ui - Billing UI components
│   │   └── data-access/       # type:data-access - Billing API
│   │
│   └── staff/                 # Domain: Staff management
│       ├── feature-schedule/  # type:feature - Staff scheduling
│       ├── ui/                # type:ui - Staff UI components
│       └── data-access/       # type:data-access - Staff API
│
└── .nx/
    └── NX_ARCHITECTURE.md     # This document
```

## Dependency Rules

### Dependency Matrix

| From ↓ / To →   | feature | ui  | data-access | util |
| --------------- | ------- | --- | ----------- | ---- |
| **feature**     | ✅      | ✅  | ✅          | ✅   |
| **ui**          | ❌      | ✅  | ❌          | ✅   |
| **data-access** | ❌      | ❌  | ✅          | ✅   |
| **util**        | ❌      | ❌  | ❌          | ✅   |

### Rules Summary

1. **Feature** libraries can depend on anything
2. **UI** libraries can only depend on UI and util libraries
3. **Data-access** libraries can only depend on data-access and util libraries
4. **Util** libraries can only depend on other util libraries

### Scope Rules

- `scope:shared` libraries can be used by any scope
- Domain-specific libraries (e.g., `scope:appointments`) should only be used within that domain or by applications
- Applications can use any library

## Library Creation Guidelines

### Before Creating a Library

**Ask these questions:**

1. **Is this code reused in multiple places?**
   - If NO: Keep it in the application
   - If YES: Consider a library

2. **Does this represent a distinct concern?**
   - Clear separation of concerns = good candidate for library

3. **Will this help with affected builds?**
   - If this changes frequently and is widely used, making it a library might cause many rebuilds

4. **What type of library is this?**
   - Feature, UI, data-access, or util?

5. **What dependencies will it have?**
   - Check if dependencies follow the rules

### Creating a New Library

**Step 1: Determine Type and Scope**

```bash
# Decide on:
# - Type: feature, ui, data-access, util
# - Scope: shared, appointments, clients, billing, staff, etc.
# - Name: descriptive name for the library
```

**Step 2: Generate Library (NON-BUILDABLE)**

```bash
# For feature libraries
nx g @nx/react:library feature-[name] \
  --directory=libs/[scope]/feature-[name] \
  --tags=type:feature,scope:[scope] \
  --no-component \
  --bundler=none \
  --unitTestRunner=vitest

# For UI libraries
nx g @nx/react:library ui-[name] \
  --directory=libs/[scope]/ui-[name] \
  --tags=type:ui,scope:[scope] \
  --bundler=none \
  --unitTestRunner=vitest

# For data-access libraries (React)
nx g @nx/react:library data-access-[name] \
  --directory=libs/[scope]/data-access-[name] \
  --tags=type:data-access,scope:[scope] \
  --no-component \
  --bundler=none \
  --unitTestRunner=vitest

# For data-access libraries (NestJS backend)
nx g @nx/nest:library data-access-[name] \
  --directory=libs/[scope]/data-access-[name] \
  --tags=type:data-access,scope:[scope],platform:server \
  --buildable=false \
  --testEnvironment=node

# For util libraries
nx g @nx/js:library util-[name] \
  --directory=libs/shared/util-[name] \
  --tags=type:util,scope:shared \
  --bundler=none \
  --unitTestRunner=vitest
```

**Step 3: Verify Configuration**

Check `libs/[scope]/[type-name]/project.json`:

```json
{
  "name": "scope-type-name",
  "sourceRoot": "libs/scope/type-name/src",
  "projectType": "library",
  "tags": ["type:feature", "scope:appointments"],
  "targets": {
    "lint": {
      /* ... */
    },
    "test": {
      /* ... */
    }
    // NO build target!
  }
}
```

**Step 4: Update Tags if Needed**

Add additional tags to `project.json`:

```json
{
  "tags": [
    "type:feature", // Required: library type
    "scope:appointments", // Required: domain scope
    "platform:client" // Optional: client or server
  ]
}
```

## Tagging Strategy

### Required Tags

Every library MUST have these tags in `project.json`:

1. **Type tag**: `type:feature`, `type:ui`, `type:data-access`, or `type:util`
2. **Scope tag**: `scope:shared`, `scope:appointments`, `scope:clients`, etc.

### Optional Tags

- `platform:client` - Frontend only
- `platform:server` - Backend only
- `platform:shared` - Can be used by both

### Tag Examples

```json
// Feature library for appointments
{
  "tags": ["type:feature", "scope:appointments", "platform:client"]
}

// Shared UI library
{
  "tags": ["type:ui", "scope:shared", "platform:client"]
}

// Backend data-access library
{
  "tags": ["type:data-access", "scope:clients", "platform:server"]
}

// Shared utility library
{
  "tags": ["type:util", "scope:shared", "platform:shared"]
}
```

## Build Configuration

### Applications Only

**ONLY applications should have build targets:**

```json
// apps/frontend/project.json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vite build"
      }
    }
  }
}
```

### Libraries Never Built

**Libraries should NOT have build targets:**

```json
// libs/appointments/feature-booking/project.json
{
  "targets": {
    "lint": {
      /* ... */
    },
    "test": {
      /* ... */
    }
    // NO build target
  }
}
```

### Why?

- Libraries are **bundled directly** into applications
- No intermediate build step = faster builds
- Better tree-shaking and optimization
- Nx affected works more efficiently

## Nx Affected Optimization

### How It Works

1. **Git diff**: Nx compares current branch to base
2. **File changes**: Identifies changed files
3. **Project graph**: Determines which projects are affected
4. **Dependency graph**: Follows dependencies to find all affected projects

### Optimization Strategies

#### 1. **Small Libraries**

**Bad**: One large shared library

```
libs/shared/everything/
```

→ Any change affects EVERYTHING that uses it

**Good**: Small, focused libraries

```
libs/shared/util-formatters/
libs/shared/util-validators/
libs/shared/types/
```

→ Only affected code rebuilds

#### 2. **Clear Boundaries**

Avoid circular dependencies:

```
❌ appointments ↔ clients (circular)
✅ appointments → shared-types ← clients
```

#### 3. **Proper Named Inputs**

Configure in `nx.json`:

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*"],
    "production": ["!{projectRoot}/**/*.spec.ts"]
  }
}
```

### Using Nx Affected

```bash
# See what's affected
nx affected:graph

# Run tests on affected projects
nx affected --target=test

# Lint affected projects
nx affected --target=lint

# Type check affected projects
nx affected --target=typecheck

# Build affected apps (not libraries!)
nx affected --target=build
```

## Common Patterns

### Pattern 1: Feature Module

```
libs/appointments/
├── feature-booking/        # Smart components
├── ui/                     # Dumb components
└── data-access/            # API and state

feature-booking depends on ui and data-access
```

### Pattern 2: Shared Design System

```
libs/shared/
├── ui-components/          # Button, Input, etc.
├── ui-forms/               # Form components
└── ui-layout/              # Layout components

All are type:ui, scope:shared
```

### Pattern 3: Shared Utilities

```
libs/shared/
├── types/                  # TypeScript types
├── util-formatters/        # Date, currency formatters
├── util-validators/        # Validation functions
└── util-constants/         # App constants

All are type:util, scope:shared
```

## Anti-Patterns to Avoid

### ❌ Don't: Large "Shared" Library

```
libs/shared/everything/
  ├── components/
  ├── utils/
  ├── types/
  ├── services/
  └── ... (hundreds of files)
```

**Why**: Any change causes everything to rebuild

### ❌ Don't: Buildable Libraries (Unless Necessary)

```bash
nx g @nx/react:library my-lib --buildable
```

**Why**: Adds unnecessary build steps, slows down development

### ❌ Don't: Circular Dependencies

```
appointments/ → clients/ → appointments/
```

**Why**: Breaks affected detection, hard to maintain

### ❌ Don't: Wrong Library Type

```
// UI library accessing API directly ❌
export function UserCard() {
  const data = fetchUser(); // NO!
}
```

**Why**: Violates separation of concerns

## Validation Checklist

Before committing a new library, verify:

- [ ] Library has correct type tag
- [ ] Library has correct scope tag
- [ ] Library follows naming convention
- [ ] Library is in correct directory
- [ ] Library is NON-buildable (no build target in project.json)
- [ ] Dependencies follow the dependency rules
- [ ] Tests are configured correctly
- [ ] Library has a clear, single purpose
- [ ] README documents the library's purpose

## References

- [Nx Library Types](https://nx.dev/concepts/more-concepts/library-types)
- [Buildable and Publishable Libraries](https://nx.dev/docs/concepts/buildable-and-publishable-libraries)
- [Enforce Module Boundaries](https://nx.dev/features/enforce-module-boundaries)
- [Run Affected Tasks](https://nx.dev/ci/features/affected)

---

**Last Updated**: 2025-10-07
**Maintainer**: ftry Development Team
