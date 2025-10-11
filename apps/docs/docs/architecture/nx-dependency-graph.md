# Nx Dependency Graph

Visual representation of library dependencies and module boundaries.

**Generated**: 2025-10-11 | **Status**: ✅ Clean - No violations

## Dependency Structure

```
┌─────────────────────────────────┐
│         APPLICATIONS            │
│  frontend  backend  docs        │
└───────┬──────────┬──────────────┘
        │          │
┌───────▼──────┐ ┌▼──────────────┐
│   SHARED     │ │   BACKEND     │
│  LIBRARIES   │ │  LIBRARIES    │
└──────────────┘ └───────────────┘
  │  │  │  │       │  │  │  │
types utils      auth admin
constants        cache queue
formatters       prisma redis
```

## Type Hierarchy

```
              ┌──────┐
              │ APP  │ (Can depend on everything)
              └───┬──┘
          ┌───────┼───────┐
     ┌────▼────┐     ┌────▼────┐
     │ FEATURE │     │   UI    │
     └────┬────┘     └────┬────┘
          │               │
     ┌────▼──────┐        │
     │DATA-ACCESS│        │
     └────┬──────┘        │
          └───────┬───────┘
             ┌────▼────┐
             │  UTIL   │ (Foundation)
             └─────────┘
```

## Platform Isolation

```
┌──────────────┐        ┌──────────────┐
│   Client     │        │   Server     │
│  (Frontend)  │        │  (Backend)   │
└───────┬──────┘        └──────┬───────┘
        │                      │
        └──────┐    ┌──────────┘
          ┌────▼────▼────┐
          │    Shared    │
          │ types, utils │
          └──────────────┘
```

## Dependency Matrix

| From ↓ / To →    | types | constants | utils | prisma | redis | cache | backend-auth | admin |
| ---------------- | ----- | --------- | ----- | ------ | ----- | ----- | ------------ | ----- |
| **Frontend**     | ✅    | ✅        | ✅    | ❌     | ❌    | ❌    | ❌           | ❌    |
| **Backend**      | ❌    | ❌        | ❌    | ✅     | ✅    | ✅    | ✅           | ✅    |
| **backend-auth** | ✅    | ✅        | ✅    | ✅     | ❌    | ✅    | -            | ❌    |
| **admin**        | ✅    | ❌        | ✅    | ✅     | ❌    | ❌    | ✅           | -     |

✅ = Allowed | ❌ = Not allowed | - = Self

## Valid Import Examples

### Frontend

```typescript
// ✅ Shared utilities
import { SafeUser } from '@ftry/shared/types';
import { ROLE_NAMES } from '@ftry/shared/constants';
import { formatDate } from '@ftry/shared/utils';

// ❌ Backend library
import { AuthService } from '@ftry/backend/auth'; // ERROR!
```

### Backend

```typescript
// ✅ Backend libraries
import { PrismaModule } from '@ftry/shared/prisma';
import { JwtAuthGuard } from '@ftry/backend/auth';

// ✅ Shared utilities
import { toSafeUser } from '@ftry/shared/utils';
```

### Library Dependencies

```typescript
// ✅ Util importing util
import { AuthError } from '@ftry/shared/types';

// ✅ Data-access importing util
import { toSafeUser } from '@ftry/shared/utils';

// ❌ Util importing feature
import { HealthController } from '@ftry/backend/health'; // ERROR!
```

## Complexity Metrics

| Metric                | Value | Status          |
| --------------------- | ----- | --------------- |
| Total Libraries       | 15    | ✅ Manageable   |
| Total Apps            | 3     | ✅ Good         |
| Avg Dependencies      | 1.9   | ✅ Low coupling |
| Max Dependencies      | 7     | ✅ Reasonable   |
| Circular Dependencies | 0     | ✅ Excellent    |
| Max Depth             | 3     | ✅ Shallow      |

## Commands

```bash
# Visualize full graph
nx graph

# Focus on specific project
nx graph --focus=backend-auth

# View affected projects
nx affected:graph

# Lint for boundary violations
nx run-many -t lint

# Check circular dependencies
nx dep-graph --file=graph.json
```

## Boundary Rules

### Enforced via ESLint

```typescript
// .eslintrc.json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          {
            "sourceTag": "type:feature",
            "onlyDependOnLibsWithTags": [
              "type:feature",
              "type:ui",
              "type:data-access",
              "type:util"
            ]
          },
          {
            "sourceTag": "type:ui",
            "onlyDependOnLibsWithTags": ["type:ui", "type:util"]
          },
          {
            "sourceTag": "platform:client",
            "notDependOnLibsWithTags": ["platform:server"]
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Circular Dependency Detected

```bash
# Find circular dependencies
nx dep-graph --file=graph.json

# Fix by:
# 1. Extract shared code to util library
# 2. Use dependency injection
# 3. Refactor to remove circular reference
```

### Boundary Violation

```bash
# Run boundary checks
/fix-boundaries

# Manual fix:
# 1. Identify violation in ESLint error
# 2. Move import to allowed library
# 3. Update tags if needed
# 4. Re-run lint
```

### Can't Find Module

```bash
# Regenerate path mappings
nx reset

# Check tsconfig.base.json has correct paths
# Restart IDE/TypeScript server
```

## Related Documentation

- [Nx Monorepo Architecture](./nx-monorepo)
- [Project Structure](../getting-started/project-structure)
