# Architecture Decision: No Frontend-Specific Libraries

**Date**: 2025-10-11
**Status**: Accepted
**Decision Makers**: Solo Founder

## Context

Initially, the project attempted to follow Nx best practices by creating frontend-specific libraries (`libs/frontend/`) following the type-based organization pattern (feature, ui, data-access, util). This approach was consolidated on 2025-10-11, moving all code to `apps/frontend/src/`.

## Decision

**We will NEVER create frontend-specific libraries in this monorepo.**

All frontend code will remain in `apps/frontend/src/` and will not be extracted to shared libraries.

## Rationale

### 1. Different Tech Stacks for Future Applications

The monorepo will eventually contain multiple frontend applications with different tech stacks:

| Application          | Tech Stack      | Purpose                         |
| -------------------- | --------------- | ------------------------------- |
| Web App (current)    | React 19        | Salon owner dashboard           |
| Mobile App (future)  | React Native    | On-the-go salon management      |
| Admin Panel (future) | Next.js         | Super admin operations          |
| Customer Portal      | Vue.js or other | Customer booking and management |

**Key Insight**: React components cannot be reused in React Native, Next.js, or Vue applications. Framework-specific code has zero reuse value across different tech stacks.

### 2. No Reuse Benefit

Examples of what CANNOT be shared:

- ❌ React components (JSX, hooks)
- ❌ React-specific state management (Zustand stores)
- ❌ TanStack Query hooks (framework-specific)
- ❌ React Router configuration
- ❌ shadcn/ui components (React-specific)

Examples of what CAN be shared (already in `libs/shared/`):

- ✅ TypeScript types and interfaces
- ✅ API response types
- ✅ Validation utilities (pure functions)
- ✅ Date/currency formatting (pure functions)
- ✅ Constants (HTTP codes, error messages)

### 3. Simpler Architecture

**Benefits of keeping code in app**:

- **Less Abstraction**: No need to decide "should this be a library?"
- **Faster Development**: Direct imports, no library boundaries to configure
- **Better Colocation**: Related code stays together
- **Easier Refactoring**: Move files without updating library configurations
- **Reduced Nx Complexity**: Fewer projects, simpler dependency graph

**Drawbacks of library extraction** (avoided):

- Deciding library boundaries
- Managing library dependencies
- Updating Nx project.json files
- Managing library tags
- ESLint module boundary configuration
- Path mapping maintenance

### 4. Backend Reuse vs Frontend Reuse

**Backend microservices benefit from shared libraries**:

```
libs/backend/
├── auth/          # Shared by API, Admin, Customer services
├── tenants/       # Multi-tenancy across all services
├── monitoring/    # Observability for all services
└── common/        # Guards, decorators, interceptors
```

All backend services use NestJS, so sharing modules makes sense.

**Frontend applications do NOT benefit**:

```
apps/
├── frontend/      # React 19
├── mobile/        # React Native (cannot import React components)
├── admin-panel/   # Next.js (different framework)
└── customer-app/  # Vue.js (completely different)
```

No code reuse possible across different frontend tech stacks.

## Alternatives Considered

### Alternative 1: Type-Based Frontend Libraries

**Approach**: Extract to `libs/frontend/feature-*`, `libs/frontend/ui-*`, etc.

**Rejected Because**:

- Future applications use different tech stacks
- Zero reuse value
- Added complexity without benefit

### Alternative 2: Monorepo Per Frontend App

**Approach**: Separate monorepos for each frontend application.

**Rejected Because**:

- Still need to share backend and shared libraries
- More infrastructure overhead
- Complicates CI/CD

### Alternative 3: Package-Based Sharing (npm)

**Approach**: Publish frontend components as npm packages.

**Rejected Because**:

- Cannot share React components to React Native or Vue
- Publishing overhead
- Versioning complexity

## Implementation

### What Changed (2025-10-11)

**Before**:

```
libs/
├── frontend/
│   ├── feature-auth/
│   ├── feature-admin/
│   ├── ui-components/
│   └── data-access-api/
├── backend/
└── shared/
```

**After**:

```
libs/
├── backend/           # ✅ Shared across NestJS microservices
└── shared/            # ✅ Cross-platform code (frontend + backend)

apps/
└── frontend/src/      # ✅ All React code here (permanent)
```

### Current Structure

```
apps/frontend/src/
├── components/        # UI components (formerly libs/frontend/ui-*)
│   ├── ui/           # shadcn/ui components
│   ├── layouts/      # Layout components
│   ├── admin/        # Admin CRUD components
│   └── features/     # Feature-specific components
│
├── pages/            # Route components
├── hooks/            # Custom React hooks
├── config/           # Configuration files
├── lib/              # Utilities
├── routes/           # React Router configuration
└── stores/           # Zustand state management
```

## Consequences

### Positive

- ✅ **Simpler Mental Model**: All frontend code in one place
- ✅ **Faster Development**: No library boundary decisions
- ✅ **Easier Onboarding**: New developers find code more easily
- ✅ **Less Configuration**: Fewer Nx projects to manage
- ✅ **Better Colocation**: Related code stays together
- ✅ **Flexible Tech Choices**: Each app can use different framework

### Negative

- ❌ **No Frontend Reuse**: Cannot share React code (but we wouldn't anyway)
- ❌ **Larger App Bundle**: All code in one app (mitigated by code splitting)

### Neutral

- Frontend code organization follows standard React patterns
- Backend libraries continue to provide reuse value

## Decision Rules

### When to Create a Library

**Create a library in `libs/backend/` if**:

- ✅ It's a NestJS module
- ✅ Used by multiple backend services
- ✅ Has clear domain boundaries
- ✅ Benefits from separation

**Create a library in `libs/shared/` if**:

- ✅ Pure TypeScript (no framework dependencies)
- ✅ Used by BOTH frontend AND backend
- ✅ Examples: types, constants, formatting utilities

**DO NOT create a library if**:

- ❌ Framework-specific code (React, Vue, etc.)
- ❌ Only used by one application
- ❌ Tightly coupled to app logic

### What Goes Where

| Code Type                | Location                   | Reason                              |
| ------------------------ | -------------------------- | ----------------------------------- |
| React components         | `apps/frontend/src/`       | Framework-specific, no reuse        |
| React hooks              | `apps/frontend/src/hooks/` | Framework-specific, no reuse        |
| TanStack Query hooks     | `apps/frontend/src/hooks/` | Framework-specific, no reuse        |
| NestJS modules           | `libs/backend/[name]`      | Shared across backend microservices |
| TypeScript types         | `libs/shared/types`        | Used by both frontend and backend   |
| Validation functions     | `libs/shared/utils`        | Pure functions, cross-platform      |
| Date/currency formatting | `libs/shared/utils`        | Pure functions, cross-platform      |
| HTTP constants           | `libs/shared/constants`    | Used by both frontend and backend   |

## Monitoring and Review

This decision will be reviewed:

1. **When adding a new frontend application** (e.g., mobile app)
   - Confirm different tech stack
   - Verify no code can be shared

2. **If considering component library extraction**
   - Ask: "Will other apps use this?"
   - Ask: "Do other apps use the same framework?"
   - If no to either, keep in app

3. **Annual Architecture Review** (next: 2026-10-11)
   - Evaluate if decision still makes sense
   - Check for new sharing patterns

## References

- [Nx Monorepo Architecture](../nx-monorepo.md)
- [Frontend Architecture](../frontend.md)
- [Project Structure](../../getting-started/project-structure.md)

## Related Decisions

- Non-Buildable Libraries (future decision to document)
- Backend Module Organization (future decision to document)

---

**Last Updated**: 2025-10-11
**Next Review**: 2026-10-11
**Decision Status**: ✅ Accepted and Implemented
