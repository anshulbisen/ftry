---
description: Fix module boundary violations and circular dependencies
---

Identify and fix ESLint module boundary violations, circular dependencies, and improper import patterns.

## Usage

```bash
# Analyze and fix all boundary issues
/fix-boundaries

# Check only (no fixes)
/fix-boundaries --check

# Fix specific project
/fix-boundaries frontend

# Focus on circular dependencies
/fix-boundaries --circular

# Interactive mode (ask before each fix)
/fix-boundaries --interactive
```

## What It Does

Uses the **module-boundaries** specialist to:

1. **Detect violations**
   - Improper dependencies between library types
   - Circular dependencies
   - Tag rule violations
   - Scope boundary violations

2. **Analyze impact**
   - Downstream effects
   - Breaking changes
   - Refactoring scope

3. **Generate fixes**
   - Move code to correct libraries
   - Extract shared utilities
   - Break circular dependencies
   - Update import statements

4. **Validate fixes**
   - Run linting
   - Type checking
   - Test affected projects

## Nx Module Boundary Rules

### Valid Dependencies

| From Type   | Can Import From                |
| ----------- | ------------------------------ |
| feature     | feature, ui, data-access, util |
| ui          | ui, util                       |
| data-access | data-access, util              |
| util        | util                           |

### Invalid Dependencies (Will be Fixed)

- ❌ `ui` → `feature`
- ❌ `ui` → `data-access`
- ❌ `data-access` → `feature`
- ❌ `util` → `data-access`
- ❌ `util` → `feature`

### Scope Rules

- ✅ `frontend` → `shared`
- ✅ `backend` → `shared`
- ❌ `frontend` → `backend`
- ❌ `backend` → `frontend`

## Common Violations

### Type 1: Wrong Direction

```typescript
// ❌ BAD: UI importing from feature
// libs/frontend/ui-components/src/UserCard.tsx
import { useAuth } from '@ftry/frontend/feature-auth';

// ✅ GOOD: Extract to shared util
// libs/shared/util-auth/src/useAuthToken.ts
export const useAuthToken = () => { ... };

// libs/frontend/ui-components/src/UserCard.tsx
import { useAuthToken } from '@ftry/shared/util-auth';
```

**Fix:** Extract shared logic to util library

### Type 2: Circular Dependency

```typescript
// ❌ BAD: Circular dependency
// libs/backend/feature-users/src/user.service.ts
import { AppointmentService } from '@ftry/backend/feature-appointments';

// libs/backend/feature-appointments/src/appointment.service.ts
import { UserService } from '@ftry/backend/feature-users';

// ✅ GOOD: Extract to data-access
// libs/backend/data-access/src/user-repository.ts
export class UserRepository { ... }

// libs/backend/data-access/src/appointment-repository.ts
export class AppointmentRepository { ... }
```

**Fix:** Extract to shared data-access layer

### Type 3: Cross-Scope Import

```typescript
// ❌ BAD: Frontend importing backend
// libs/frontend/data-access/src/api-client.ts
import { UserDto } from '@ftry/backend/feature-users';

// ✅ GOOD: Use shared types
// libs/shared/types/src/user.types.ts
export interface UserDto { ... }

// libs/frontend/data-access/src/api-client.ts
import { UserDto } from '@ftry/shared/types';
```

**Fix:** Move types to shared library

## Fix Strategies

### Strategy 1: Extract to Util

**When:**

- Pure functions
- Helper utilities
- Type definitions
- Constants

**How:**

```bash
# Create util library
/add-library util shared validation

# Move code
# Update imports across codebase
# Remove old code
```

### Strategy 2: Extract to Data-Access

**When:**

- API calls
- Repository patterns
- Data fetching
- State management

**How:**

```bash
# Create data-access library
/add-library data-access appointments

# Move data layer
# Update feature libraries to use it
```

### Strategy 3: Invert Dependency

**When:**

- Feature needs UI component
- Can use dependency injection
- Event-based communication

**How:**

```typescript
// Instead of feature → ui
// Use callback props or events

// libs/frontend/ui-components/src/Modal.tsx
export const Modal = ({ onClose }: { onClose: () => void }) => { ... };

// libs/frontend/feature-auth/src/LoginForm.tsx
<Modal onClose={handleClose} />
```

### Strategy 4: Break Circular via Interface

**When:**

- Two features need each other
- Can define interface
- Dependency injection possible

**How:**

```typescript
// libs/shared/interfaces/src/user-provider.interface.ts
export interface IUserProvider {
  getUser(id: string): Promise<User>;
}

// libs/backend/feature-users/src/user.service.ts
export class UserService implements IUserProvider { ... }

// libs/backend/feature-appointments/src/appointment.service.ts
constructor(private userProvider: IUserProvider) { ... }
```

## Automated Fixes

### Level 1: Import Updates

```typescript
// Auto-fix: Update import paths
// Before
import { Button } from '../../ui-components/Button';

// After
import { Button } from '@ftry/frontend/ui-components';
```

### Level 2: Code Movement

```bash
# Auto-fix: Move code to correct library
# Detects: Function used by multiple features
# Action: Extract to shared util
# Updates: All import statements
```

### Level 3: Dependency Injection

```typescript
// Auto-fix: Break circular via DI
// Before: Direct import causing cycle
// After: Constructor injection with interface
```

## Validation

After fixing, the command validates:

1. **ESLint passes** - No boundary violations
2. **TypeScript compiles** - No type errors
3. **Tests pass** - No broken functionality
4. **Nx graph clean** - No circular dependencies

## Integration with Nx Graph

```bash
# 1. Visualize current violations
/nx-graph circular

# 2. Fix issues
/fix-boundaries

# 3. Verify fix
/nx-graph circular
# Should show "No circular dependencies"
```

## Workflow Integration

### During Development

```bash
# Get boundary error from ESLint
# Run fix command
/fix-boundaries --interactive

# Review proposed changes
# Accept or modify

# Validate
/check-all
```

### Before Commit

```bash
# Proactive check
/fix-boundaries --check

# If violations found:
/fix-boundaries

# Commit clean code
/commit "refactor(deps): fix module boundaries"
```

### CI/CD Pipeline

```yaml
# Enforce clean boundaries
- name: Check boundaries
  run: /fix-boundaries --check --fail-on-error
```

## Configuration

**eslint.config.mjs:**

```javascript
{
  '@nx/enforce-module-boundaries': [
    'error',
    {
      enforceBuildableLibDependency: true,
      allow: [],
      depConstraints: [
        {
          sourceTag: 'type:feature',
          onlyDependOnLibsWithTags: [
            'type:feature',
            'type:ui',
            'type:data-access',
            'type:util',
          ],
        },
        {
          sourceTag: 'scope:frontend',
          onlyDependOnLibsWithTags: ['scope:frontend', 'scope:shared'],
        },
      ],
    },
  ],
}
```

## Reporting

### Summary Report

```
Module Boundary Analysis
========================

Violations Found: 12

By Type:
  - Wrong dependency direction: 5
  - Circular dependencies: 3
  - Cross-scope imports: 4

By Severity:
  - Error: 8
  - Warning: 4

Affected Projects:
  - libs/frontend/ui-components (3)
  - libs/backend/feature-users (2)
  - libs/frontend/feature-auth (7)

Fixes Applied: 12
Remaining Issues: 0
```

### Detailed Report

```
1. Wrong Direction: UI → Feature
   File: libs/frontend/ui-components/src/UserCard.tsx:5
   Import: @ftry/frontend/feature-auth
   Fix: Extracted useAuthToken to @ftry/shared/util-auth
   Status: ✅ Fixed

2. Circular Dependency: Users ↔ Appointments
   Files:
     - libs/backend/feature-users/src/user.service.ts
     - libs/backend/feature-appointments/src/appointment.service.ts
   Fix: Extracted repositories to @ftry/backend/data-access
   Status: ✅ Fixed
```

## Best Practices

1. **Fix early** - Don't let violations accumulate
2. **Understand why** - Learn the rules, don't just auto-fix
3. **Plan libraries** - Design before implementing
4. **Review graph** - Visualize dependencies regularly
5. **Test after fix** - Ensure functionality preserved

## Technology Stack

- **ESLint**: 9.8.0
- **@nx/eslint-plugin**: 21.6.3
- **Nx**: 21.6.3
- **TypeScript**: 5.9.2

## See Also

- `/nx-graph` - Visualize dependencies
- `/use-agent module-boundaries` - Deep analysis
- `/use-agent nx-specialist` - Architecture guidance
- `.nx/NX_ARCHITECTURE.md` - Module boundary rules
- `eslint.config.mjs` - ESLint configuration
