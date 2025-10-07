---
description: Create a new Nx library with proper configuration and tags
argument-hint: [type] [scope] [name]
allowed-tools: Bash, Write, Edit, Task
---

# Create Nx Library: $1 library for $2 scope named $3

## Context

- Current libraries: !`nx list 2>/dev/null | head -20`
- Project graph: !`ls -la libs/`

## Instructions

Create a new **$1** library in the **$2** scope with name **$3**.

### Library Configuration

Use the nx-architect subagent to create the library with these specifications:

**Type**: $1 (must be one of: feature, ui, data-access, util)
**Scope**: $2 (e.g., appointments, billing, clients, staff, shared)
**Name**: $3

### Required Actions:

1. **Validate library type and dependencies**:
   - feature → can depend on ALL types
   - ui → can depend on ui, util ONLY
   - data-access → can depend on data-access, util ONLY
   - util → can depend on util ONLY

2. **Generate the library** using the correct Nx generator:
   - Ensure bundler=none (non-buildable)
   - Add proper tags: type:$1,scope:$2
   - Configure correct test runner (Vitest for frontend, Jest for backend)

3. **Create initial structure**:
   - Set up proper index.ts exports
   - Add README.md with library purpose
   - Create initial test file

4. **Verify module boundaries**:
   Run `nx run-many --target=lint` to ensure no boundary violations

5. **Update project references** if needed

### Example commands based on type:

For feature library:

```bash
nx g @nx/react:library feature-$3 --directory=libs/$2/feature-$3 --tags=type:feature,scope:$2 --bundler=none --unitTestRunner=vitest
```

For ui library:

```bash
nx g @nx/react:library ui-$3 --directory=libs/$2/ui-$3 --tags=type:ui,scope:$2 --bundler=none --unitTestRunner=vitest
```

For data-access library:

```bash
nx g @nx/js:library data-access-$3 --directory=libs/$2/data-access-$3 --tags=type:data-access,scope:$2 --bundler=none --unitTestRunner=vitest
```

For util library:

```bash
nx g @nx/js:library util-$3 --directory=libs/shared/util-$3 --tags=type:util,scope:shared --bundler=none --unitTestRunner=vitest
```

Remember:

- Libraries are NEVER buildable (no build targets)
- Use bun for all operations
- Follow the established naming conventions
- Ensure proper tag configuration for boundary enforcement
