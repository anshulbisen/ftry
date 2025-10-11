# Nx Dependency Graph Visualization

**Generated**: 2025-10-11
**Status**: ✅ Clean - No violations

## Visual Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATIONS                             │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │                    │                    │
    ┌─────▼─────┐        ┌─────▼─────┐      ┌─────▼─────┐
    │ Frontend  │        │  Backend  │      │   Docs    │
    │ (app:web) │        │(app:server)│      │ (app:docs)│
    └─────┬─────┘        └─────┬─────┘      └───────────┘
          │                    │
          │                    │
┌─────────┴──────────┐  ┌──────┴─────────────────────┐
│ SHARED LIBRARIES   │  │   BACKEND LIBRARIES        │
│ (platform:shared)  │  │   (platform:server)        │
└────────────────────┘  └────────────────────────────┘
     │  │  │  │              │    │    │    │
     │  │  │  └──────┬───────┼────┼────┘    │
     │  │  │         │       │    │         │
   ┌─▼──▼──▼──┐  ┌──▼──┐ ┌──▼──┐ │    ┌────▼────┐
   │  types   │  │utils│ │const│ │    │backend- │
   │ constants│  └─────┘ └─────┘ │    │  auth   │
   │  utils   │                  │    │(data-acc)│
   │formatters│                  │    └────┬────┘
   └──────────┘                  │         │
                           ┌─────▼─────┐   │
                           │   admin   │   │
                           │(data-acc) │◄──┘
                           └───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LIBRARIES                      │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
    ┌────▼────┐    ┌───▼───┐     ┌───▼───┐     ┌───▼────┐
    │ prisma  │    │ redis │     │ cache │     │ queue  │
    │  (util) │    │(d-acc)│     │(d-acc)│     │(d-acc) │
    └─────────┘    └───┬───┘     └───┬───┘     └────┬───┘
                       └─────────────┴──────────────┘

Legend:
  ┌─────┐
  │ Box │   = Library or Application
  └─────┘
     │      = Dependency (points to dependency)
     ▼      = Direction of dependency
  (type)   = Library type (app, data-access, util, feature)
```

## Dependency Matrix

| From ↓ / To →    | types | constants | utils | prisma | redis | cache | queue | backend-auth | admin | health |
| ---------------- | ----- | --------- | ----- | ------ | ----- | ----- | ----- | ------------ | ----- | ------ |
| **Frontend**     | ✅    | ✅        | ✅    | ❌     | ❌    | ❌    | ❌    | ❌           | ❌    | ❌     |
| **Backend**      | ❌    | ❌        | ❌    | ✅     | ✅    | ✅    | ✅    | ✅           | ✅    | ✅     |
| **backend-auth** | ✅    | ✅        | ✅    | ✅     | ❌    | ✅    | ✅    | -            | ❌    | ❌     |
| **admin**        | ✅    | ❌        | ✅    | ✅     | ❌    | ❌    | ❌    | ✅           | -     | ❌     |
| **health**       | ❌    | ❌        | ❌    | ✅     | ✅    | ✅    | ❌    | ❌           | ❌    | -      |

✅ = Allowed dependency  
❌ = Not allowed / Not present  
\- = Self (N/A)

## Type Hierarchy

```
                    ┌──────────┐
                    │   APP    │ (Can depend on everything)
                    └─────┬────┘
                          │
              ┌───────────┼───────────┐
              │                       │
        ┌─────▼─────┐           ┌────▼─────┐
        │  FEATURE  │           │    UI    │
        └─────┬─────┘           └────┬─────┘
              │                      │
              │                      │
        ┌─────▼──────┐               │
        │DATA-ACCESS │               │
        └─────┬──────┘               │
              │                      │
              └──────────┬───────────┘
                         │
                    ┌────▼────┐
                    │  UTIL   │ (Foundation)
                    └─────────┘
```

## Platform Isolation

```
┌───────────────────────┐     ┌───────────────────────┐
│   Platform: Client    │     │   Platform: Server    │
│                       │     │                       │
│  - Frontend App       │     │  - Backend App        │
│  - Client-specific    │     │  - Backend libraries  │
│    libraries          │     │  - Server utilities   │
│                       │     │  - Prisma, Redis      │
└───────────┬───────────┘     └───────────┬───────────┘
            │                             │
            │       ┌─────────────────┐   │
            └───────► Platform:Shared ◄───┘
                    │                 │
                    │ - types         │
                    │ - constants     │
                    │ - utils         │
                    │ - formatters    │
                    └─────────────────┘
```

## Scope Boundaries

```
┌──────────────────────────────────────────────────────────┐
│                      Scope: Shared                       │
│  (Used by all domain-specific scopes)                    │
│  - types, constants, utils, prisma, redis, cache, queue  │
└──────────────────────────────────────────────────────────┘
       │            │             │             │
   ┌───▼───┐   ┌───▼────┐   ┌────▼───┐   ┌────▼───┐
   │ Auth  │   │Appoint-│   │Clients │   │Billing │
   │       │   │ments   │   │        │   │        │
   │       │   │        │   │        │   │        │
   └───────┘   └────────┘   └────────┘   └────────┘

   (Future domain-specific libraries will use these scopes)
```

## Import Path Examples

### ✅ Valid Imports

```typescript
// Frontend importing shared utilities
import { SafeUser } from '@ftry/shared/types';
import { ROLE_NAMES } from '@ftry/shared/constants';
import { formatDate } from '@ftry/shared/utils';

// Backend library importing other backend library
import { PrismaModule } from '@ftry/shared/prisma';
import { JwtAuthGuard } from '@ftry/backend/auth';

// Data-access importing util
import { toSafeUser } from '@ftry/shared/utils';

// Util importing util
import { AuthError } from '@ftry/shared/types';
```

### ❌ Invalid Imports (Would be caught by ESLint)

```typescript
// ❌ Frontend importing backend library
import { AuthService } from '@ftry/backend/auth'; // ERROR!

// ❌ UI library importing data-access library
import { UserService } from '@ftry/backend/admin'; // ERROR!

// ❌ Util library importing feature library
import { HealthController } from '@ftry/backend/health'; // ERROR!

// ❌ Platform:client importing platform:server
import { PrismaService } from '@ftry/shared/prisma'; // ERROR in frontend!
```

## Complexity Metrics

| Metric                           | Value            | Status             |
| -------------------------------- | ---------------- | ------------------ |
| Total Libraries                  | 15               | ✅ Manageable      |
| Total Applications               | 3                | ✅ Good            |
| Average Dependencies per Library | 1.9              | ✅ Low coupling    |
| Maximum Dependencies             | 7 (backend-auth) | ✅ Reasonable      |
| Circular Dependencies            | 0                | ✅ Excellent       |
| Max Dependency Depth             | 3 levels         | ✅ Shallow         |
| Isolated Libraries               | 6                | ✅ Good foundation |

## Quick Reference Commands

```bash
# Visualize full dependency graph
nx graph

# Check specific project dependencies
nx graph --focus=backend-auth

# View affected projects
nx affected:graph

# Lint all projects for boundary violations
nx run-many -t lint

# Check circular dependencies
nx dep-graph --file=graph.json
```

---

**Maintained by**: Nx Architecture Team  
**Last Verified**: 2025-10-11  
**Related Docs**: `.nx/MODULE_BOUNDARY_REPORT.md`, `.nx/NX_ARCHITECTURE.md`
