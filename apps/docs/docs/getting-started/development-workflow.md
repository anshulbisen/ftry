# Development Workflow

ftry follows a **Test-Driven Development (TDD)** approach with strict quality standards and automated workflows.

## Core Principles

### 1. Test-Driven Development (TDD)

**Always write tests BEFORE implementation.**

```bash
# Use the /test-first command for guided TDD
/test-first "BookingForm" unit
```

**TDD Cycle:**

1. Write failing test
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Commit with passing tests

### 2. Incremental Development

Make small, atomic changes that can be independently validated:

- One feature at a time
- Small, focused commits
- Each change fully tested

### 3. Zero-Tolerance for Errors

Before any commit:

- ✅ No TypeScript errors
- ✅ No build failures
- ✅ All tests passing
- ✅ No linting errors

## Daily Workflow

### Starting Work

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start dev servers
bun run dev
```

### During Development

```bash
# 1. Write tests first
/test-first "ComponentName" unit

# 2. Implement feature
# ... code ...

# 3. Run quality checks frequently
bun run check-all

# 4. Commit when tests pass
/commit "feat(scope): description"
```

### Before Pushing

```bash
# Run full quality gate
bun run check-all

# If all pass, push
git push origin feature/your-feature-name
```

## Using Claude Code

### Feature Implementation

```bash
# Full TDD feature implementation
/implement-feature "appointment-booking" fullstack

# Quick targeted fixes
/quick-fix performance
```

### Code Review

```bash
# Comprehensive review after implementation
/full-review

# Specific review types
/use-agent senior-architect "review auth implementation"
/use-agent frontend-expert "optimize component rendering"
```

### Repository Sync

```bash
# After feature completion - sync everything
/sync-repo

# Update documentation only
/update-docs authentication

# Update agent configurations
/update-agents
```

## Quality Checks

### Manual Commands

```bash
# Format code
bun run format

# Lint affected files
bun run lint

# Type check
bun run typecheck

# Run tests
bun run test

# All checks at once
bun run check-all
```

### Automated Checks

**Pre-commit Hook (Husky):**

- Auto-format with Prettier
- Run ESLint with auto-fix
- Type check affected files
- Validate commit message format

**CI/CD (GitHub Actions):**

- Lint, format check, type check
- Run affected tests with coverage
- Build affected projects

## Git Workflow

### Branch Naming

```bash
feature/feature-name      # New feature
fix/bug-description       # Bug fix
refactor/what-changed     # Refactoring
docs/what-documented      # Documentation
test/what-tested          # Test improvements
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

feat(auth): implement JWT refresh token rotation
fix(billing): correct GST calculation for multi-item invoices
docs(api): add authentication endpoint documentation
test(appointments): add integration tests for booking flow
refactor(admin): extract resource config to separate files
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test additions/changes
- `build` - Build system changes
- `ci` - CI/CD changes
- `chore` - Maintenance tasks

### Creating Pull Requests

```bash
# Use Claude Code's PR command
/create-pr

# Or manually
gh pr create --title "feat(scope): description" --body "..."
```

**PR includes:**

- Summary of changes
- Test plan
- Screenshots (if UI changes)
- Breaking changes (if any)

## Testing Strategy

### Test Levels

| Level       | Purpose              | Tools       | Location                |
| ----------- | -------------------- | ----------- | ----------------------- |
| Unit        | Individual functions | Vitest/Jest | `*.spec.ts`             |
| Integration | Module interactions  | Vitest/Jest | `*.integration.spec.ts` |
| E2E         | Full user workflows  | Playwright  | `apps/*/e2e/`           |

### Writing Tests

```typescript
// Unit test example
describe('calculateTotal', () => {
  it('should calculate total with GST', () => {
    const result = calculateTotal(100, 0.18);
    expect(result).toBe(118);
  });
});

// Integration test example
describe('AuthService', () => {
  it('should authenticate user and return tokens', async () => {
    const result = await authService.login(credentials);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
```

## Database Migrations

### Creating Migrations

```bash
# 1. Modify schema in prisma/schema.prisma

# 2. Create migration
bunx prisma migrate dev --name description-of-change

# 3. Review generated SQL in prisma/migrations/

# 4. Test migration
bunx prisma migrate reset  # Reset and re-apply all

# 5. Commit schema and migration
git add prisma/
git commit -m "feat(db): add appointment status field"
```

### Migration Best Practices

- ✅ Always review generated SQL
- ✅ Test migrations on local database first
- ✅ Make backwards-compatible changes when possible
- ✅ Add indexes for new query patterns
- ❌ Never edit migration files after creation
- ❌ Never delete migrations that have been deployed

## Documentation Updates

**CRITICAL**: All documentation must be maintained in Docusaurus.

```bash
# Update documentation after implementation
/update-docs feature-name

# Create new feature documentation
/update-docs new feature-name

# Validate all documentation
/update-docs validate
```

### Documentation Requirements

When implementing a feature, update:

- ✅ API documentation (if backend changes)
- ✅ Architecture docs (if design changes)
- ✅ Usage guides (for new features)
- ✅ CLAUDE.md files (if patterns change)

## Troubleshooting

### Tests Failing

```bash
# Run specific test file
nx test frontend --testFile=component.spec.ts

# Run tests in watch mode
nx test frontend --watch

# Clear test cache
nx reset
```

### Type Errors

```bash
# Regenerate Prisma Client
bunx prisma generate

# Clear TypeScript cache
rm -rf node_modules/.cache
bun install
```

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset

# Clear all caches
rm -rf node_modules/.cache
rm -rf .nx/cache
bun install
```

## Best Practices

### Do's ✅

- Write tests before implementation
- Run `bun run check-all` before commits
- Keep commits small and focused
- Update documentation with code changes
- Use Claude Code slash commands
- Follow conventional commit format

### Don'ts ❌

- Don't commit without tests
- Don't use npm/yarn/pnpm (use Bun)
- Don't skip quality checks
- Don't create new markdown files outside Docusaurus
- Don't commit failing tests
- Don't push directly to main

## Next Steps

- [Nx Monorepo Architecture](../architecture/nx-monorepo) - Library creation details
- [Claude Code Setup](../guides/claude-code) - AI-powered development
- [Contributing Guide](../guides/contributing) - Full contribution workflow
