---
description: Run all quality gates - format, lint, typecheck, test
---

Execute comprehensive quality checks before committing. Enforces project standards and catches issues early.

## Usage

```bash
# Run all checks (recommended before commit)
/check-all

# Run specific check
/check-all format
/check-all lint
/check-all typecheck
/check-all test

# Skip certain checks
/check-all --skip-tests

# Fix issues automatically
/check-all --fix
```

## What It Does

Runs quality gates in sequence:

### 1. Format Check (Prettier)

```bash
bun run format  # Auto-fixes formatting
```

**Checks:**

- Code formatting (2 spaces, single quotes)
- Import sorting
- Line length (100 chars)
- Trailing whitespace
- End of file newlines

**Files:**

- `**/*.{ts,tsx,js,jsx,json,md,yml,yaml}`
- Respects `.prettierignore`

### 2. Lint (ESLint)

```bash
bun run lint  # Affected projects only
```

**Checks:**

- TypeScript rules (@typescript-eslint)
- React rules (React 19 patterns)
- Nx module boundaries
- Import/export rules
- Unused variables
- Best practices

**Auto-fixes:**

- Most formatting issues
- Import organization
- Simple rule violations

### 3. Type Check (TypeScript)

```bash
bun run typecheck  # Affected projects only
```

**Checks:**

- Type errors across monorepo
- Strict mode violations
- Missing types
- Type compatibility
- Generic constraints

**Zero tolerance:** All type errors must be fixed

### 4. Test (Vitest + Jest)

```bash
bun run test  # Affected projects only
```

**Runs:**

- Unit tests (Vitest for frontend, Jest for backend)
- Integration tests (where applicable)
- Coverage threshold enforcement

**Requirements:**

- All tests must pass
- No skipped tests without reason
- Coverage meets minimum thresholds

## Execution Flow

```bash
# Sequential execution with fail-fast
format → lint → typecheck → test
   ↓       ↓         ↓         ↓
 PASS    PASS      PASS      PASS
   ↓       ↓         ↓         ↓
           If any fails, stops immediately
```

**Parallel execution** where safe:

```bash
concurrently --kill-others-on-fail \
  --names "lint,types,test" \
  "bun run lint" \
  "bun run typecheck" \
  "bun run test"
```

## Quality Standards

### Format

- **Prettier 3.6.2**
- Enforced via pre-commit hook
- Zero formatting violations allowed

### Lint

- **ESLint 9.8.0** + **typescript-eslint 8.40.0**
- Custom rules for Nx boundaries
- Auto-fix when possible

### TypeScript

- **Version**: 5.9.2
- **Strict mode**: Enabled
- **Target**: ES2022
- **Affected-only**: Uses Nx caching

### Tests

- **Frontend**: Vitest 3.0.0
- **Backend**: Jest 30.0.2
- **Coverage**: Tracked but not enforced yet
- **Affected-only**: Only changed code tested

## Nx Affected Optimization

**Smart testing:**

```bash
# Only lints/tests/types affected by changes
nx affected --target=lint
nx affected --target=typecheck
nx affected --target=test
```

**Computation caching:**

- Results cached across runs
- Only re-runs when files change
- Speeds up CI/CD pipelines

## Pre-commit Integration

**Husky hooks automatically run:**

1. `bun run format` - Auto-format staged files
2. `bun run lint:fix` - Auto-fix linting issues
3. Type check affected files
4. Validate commit message format

**Manual override** (not recommended):

```bash
git commit --no-verify  # Skips hooks
```

## CI/CD Integration

**GitHub Actions workflow:**

```yaml
- name: Quality Checks
  run: bun run check-all

- name: Build
  run: bun run build
```

**All checks must pass** before merge.

## Error Examples

### Format Error

```
[warn] apps/frontend/src/app.tsx
[warn] Code style issues found. Run `bun run format` to fix.
```

**Fix:** `bun run format`

### Lint Error

```
apps/frontend/src/app.tsx
  12:5  error  'unusedVar' is defined but never used  @typescript-eslint/no-unused-vars
```

**Fix:** Remove unused variable or prefix with `_`

### Type Error

```
apps/backend/src/app.service.ts:15:10 - error TS2322:
Type 'string' is not assignable to type 'number'.
```

**Fix:** Correct the type mismatch

### Test Failure

```
FAIL  apps/frontend/src/app.spec.tsx
  ● renders correctly
    expect(received).toBe(expected)
```

**Fix:** Update test or fix implementation

## Performance

**Initial run:** ~30-60 seconds (full monorepo)

**Cached run:** ~5-10 seconds (no changes)

**Affected only:** ~10-20 seconds (typical changes)

## Best Practices

### Before Every Commit

```bash
/check-all  # Ensure all quality gates pass
/commit "type(scope): description"
```

### During Development

```bash
# Format on save (VS Code setting)
"editor.formatOnSave": true

# Run checks periodically
/check-all --skip-tests  # Quick validation
```

### Before Push

```bash
/check-all  # Full check
bun run build  # Verify build works
```

### CI/CD Pipeline

```bash
# Run on all branches
/check-all
bun run build:all
```

## Common Issues

### "Lint failed on files not changed"

- Run `nx reset` to clear cache
- Check for global config changes

### "Tests fail but pass locally"

- Check environment variables
- Verify database state
- Clear node_modules and reinstall

### "Typecheck takes too long"

- Only affected projects run
- Check for circular dependencies
- Review tsconfig composite setup

## Configuration Files

- `.prettierrc` - Format rules
- `eslint.config.mjs` - Lint rules
- `tsconfig.base.json` - TypeScript config
- `jest.config.js` / `vitest.config.ts` - Test config

## Technology Stack

- **Prettier**: 3.6.2
- **ESLint**: 9.8.0 + typescript-eslint 8.40.0
- **TypeScript**: 5.9.2
- **Vitest**: 3.0.0 (frontend)
- **Jest**: 30.0.2 (backend)
- **Nx**: 21.6.3 (affected detection)

## See Also

- `/commit` - Automated commit with checks
- `/test-first` - TDD workflow
- `CLAUDE.md` - Project standards
- `.husky/` - Pre-commit hooks
