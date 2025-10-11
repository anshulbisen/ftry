# Contributing to ftry

Thank you for your interest in contributing to ftry! This guide will help you get started.

## Development Setup

### Prerequisites

- **Bun**: 1.3.0+ (NOT npm/yarn)
- **PostgreSQL**: 18+
- **Git**: Latest version
- **VS Code**: Recommended (with extensions)

### Getting Started

```bash
# Clone repository
git clone https://github.com/ftry/ftry.git
cd ftry

# Install dependencies (use Bun exclusively)
bun install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Set up database
bunx prisma migrate dev
bunx prisma generate
bunx prisma db seed

# Start development servers
bun run dev  # Starts both frontend and backend
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-new-feature
```

**Branch Naming**:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/fixes

### 2. Make Changes (TDD Approach)

**Always follow Test-Driven Development**:

```bash
# 1. Write failing test
nx test [project] --watch

# 2. Implement minimal code to pass test

# 3. Refactor while keeping tests green

# 4. Ensure all tests pass
nx affected --target=test
```

### 3. Run Quality Checks

```bash
# Run all checks before committing
bun run check-all

# Individual checks
bun run format      # Prettier
bun run lint        # ESLint (with auto-fix)
bun run typecheck   # TypeScript
bun run test        # Vitest/Jest
```

### 4. Commit Changes

**Use Conventional Commits**:

```bash
git add .
git commit -m "feat(auth): implement JWT refresh token rotation"
```

**Format**: `type(scope): subject`

**Types**:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `style` - Code style (formatting)
- `chore` - Maintenance tasks

**Examples**:

```bash
feat(admin): add user impersonation feature
fix(auth): correct CSRF cookie configuration
docs(api): update authentication endpoints
test(users): add integration tests for user CRUD
refactor(frontend): consolidate admin components
```

**Enforcement**: commitlint pre-commit hook validates format.

### 5. Push and Create PR

```bash
git push origin feature/my-new-feature
```

Then create Pull Request on GitHub.

## Code Standards

### TypeScript

- **Strict Mode**: Always enabled
- **No `any`**: Use proper types or `unknown`
- **Type Imports**: Use `import { type Foo }`
- **Interfaces**: Prefer interfaces over type aliases for objects

### React

- **Functional Components**: Always use hooks
- **Props**: Always define interface for props
- **Hooks**: Extract complex logic to custom hooks
- **Testing**: Test user behavior, not implementation

### NestJS

- **Dependency Injection**: Always use constructor injection
- **Guards**: Use for authentication/authorization
- **DTOs**: Validate all input with class-validator
- **Services**: Keep controllers thin, logic in services

### Database

- **Migrations**: Always create descriptive migrations
- **Indexes**: Index all foreign keys and common queries
- **RLS**: Never bypass Row-Level Security
- **Transactions**: Use for related operations

## Testing Requirements

### Coverage Requirements

- **Minimum**: 80% overall coverage
- **New Features**: 90% coverage required
- **Critical Code**: 100% coverage (auth, payments)

### Test Types

**Unit Tests**:

```typescript
// Component unit test
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
});
```

**Integration Tests**:

```typescript
// Service integration test
describe('AuthService', () => {
  it('should create user and audit log atomically', async () => {
    const user = await authService.register(dto);
    const auditLog = await prisma.auditLog.findFirst({
      where: { userId: user.id, action: 'USER_CREATED' },
    });
    expect(auditLog).toBeDefined();
  });
});
```

**E2E Tests**:

```typescript
// Full request lifecycle
describe('POST /api/v1/auth/login', () => {
  it('should login and set cookies', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Pass123!' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
```

## Documentation Requirements

### Code Documentation

```typescript
/**
 * Authenticates user with email and password.
 *
 * @param dto - Login credentials
 * @returns User object with tokens
 * @throws UnauthorizedException if credentials invalid
 * @throws ForbiddenException if account locked
 */
async login(dto: LoginDto): Promise<AuthResponse> {
  // Implementation
}
```

### Docusaurus Updates

**CRITICAL**: All features MUST be documented in Docusaurus.

```bash
# Update documentation
apps/docs/docs/[section]/[page].md

# Update sidebar navigation
apps/docs/sidebars.ts

# Validate documentation
nx build docs  # Fails on broken links

# Preview changes
nx serve docs  # http://localhost:3002
```

## Pull Request Process

### PR Checklist

Before submitting PR:

- [ ] All tests passing (`nx affected --target=test`)
- [ ] Code coverage ≥ 80%
- [ ] No TypeScript errors (`nx affected --target=typecheck`)
- [ ] Linting passes (`nx affected --target=lint`)
- [ ] Conventional commit messages
- [ ] Documentation updated in Docusaurus
- [ ] Manual testing completed
- [ ] Database migrations created (if schema changed)
- [ ] README updated (if needed)

### PR Template

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass (80%+ coverage)
- [ ] Documentation updated
- [ ] No console errors/warnings
```

### Review Process

1. **Automated Checks**: GitHub Actions runs tests, linting, build
2. **Code Review**: At least 1 approval required
3. **Documentation Review**: Ensure Docusaurus updated
4. **Manual Testing**: Reviewer tests changes locally
5. **Merge**: Squash and merge to main

## Common Tasks

### Adding New Admin Resource

See [Admin CRUD Quick Start](./admin-crud-quick-start.md) for 30-minute guide.

### Creating New Library

```bash
nx g @nx/react:library feature-name \
  --directory=libs/frontend/feature-name \
  --tags=scope:frontend,type:feature \
  --bundler=none
```

See [Nx Monorepo Architecture](../architecture/nx-monorepo.md) for library creation details.

### Database Migrations

```bash
# Create migration
bunx prisma migrate dev --name add_email_verification

# Apply to production
bunx prisma migrate deploy
```

## Getting Help

- **Documentation**: http://localhost:3002 (Docusaurus)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Code Review**: Tag maintainers in PR

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or discrimination

---

**Happy Contributing!** 🎉
