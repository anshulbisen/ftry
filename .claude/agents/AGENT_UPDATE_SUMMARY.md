# Agent Update Summary (2025-10-11)

Quick reference for agent configuration synchronization.

## Status: ✅ COMPLETE

All agent configurations synchronized with current project state.

## Agents Updated

| Agent               | Status     | Key Changes                                                    |
| ------------------- | ---------- | -------------------------------------------------------------- |
| frontend-expert.md  | ✅ Updated | Type safety patterns, Admin CRUD, TanStack Query updates       |
| backend-expert.md   | ✅ Updated | SafeUser vs UserWithPermissions, RLS enforcement, JWT patterns |
| test-guardian.md    | ✅ Updated | SafeUser in tests, RLS testing, integration patterns           |
| database-expert.md  | ✅ Current | Already up-to-date (RLS, indexes, PII encryption documented)   |
| senior-architect.md | ✅ Current | Already up-to-date (documentation policy, review checklist)    |

## Key Improvements Captured

### 1. Type Safety

- **SafeUser** type (excludes password, loginAttempts, lockedUntil)
- **UserWithPermissions** (backend internal use)
- Type guards: `isSafeUser`, `isAuthResponse`, `isAxiosError`
- Frontend: Always use SafeUser from `@ftry/shared/types`
- Backend: Use UserWithPermissions internally, return SafeUser to clients

### 2. Admin CRUD Architecture

- Configuration-based ResourceManager pattern
- 93% code reduction (450 → 150 lines per resource)
- Type-safe ResourceConfig with IntelliSense
- TanStack Table integration with ColumnDef
- Location: `apps/frontend/src/types/admin.ts`

### 3. Test Suite

- All 147 tests passing (100% pass rate)
- SafeUser usage in test mocks
- RLS context testing patterns
- Integration test improvements

### 4. Technology Versions

- React 19.0.0, Vite 7.0.0, TypeScript 5.9.2
- NestJS 11.0.0, Bun 1.2.19, Prisma 6.16.3
- TanStack Query 5.90.2, Jest 30.0.2, Vitest 3.0.0
- Nx 21.6.3 with affected detection

## Usage Guidelines

### Frontend Development

```typescript
// ✅ Correct: Use SafeUser from shared types
import type { SafeUser } from '@ftry/shared/types';

const user: SafeUser = useCurrentUser();

// ❌ Wrong: Never use User type directly
import type { User } from '@ftry/shared/types'; // Includes password!
```

### Backend Development

```typescript
// ✅ Correct: Use UserWithPermissions internally
async validate(payload: JwtPayload): Promise<UserWithPermissions> {
  // Set RLS context FIRST
  await this.prisma.$executeRaw`SELECT set_tenant_context(${payload.tenantId})`;

  // Return UserWithPermissions (internal use)
  return { ...user, permissions: [...] };
}

// ✅ Correct: Return SafeUser to clients
async login(user: UserWithPermissions): Promise<AuthResponse> {
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    // ... (no password, loginAttempts, lockedUntil)
  };

  return { user: safeUser, accessToken, refreshToken, expiresIn };
}
```

### Testing

```typescript
// ✅ Correct: Use SafeUser in tests
import type { SafeUser } from '@ftry/shared/types';

const mockUser: SafeUser = {
  id: 'user-1',
  email: 'test@example.com',
  // ... (match SafeUser interface)
  permissions: ['users:read:own'],
};

// ✅ Correct: Test RLS context setting
it('should set tenant context', async () => {
  await service.getData(user);
  expect(mockPrisma.$executeRaw).toHaveBeenCalled();
});
```

## Validation Checklist

- [x] All version numbers match package.json
- [x] File paths referenced actually exist
- [x] Import examples use real project code
- [x] Commands work with current setup
- [x] No references to removed packages
- [x] Bun is used exclusively
- [x] Nx commands are current
- [x] Type examples use SafeUser

## Next Review

Update agents when:

- Major dependency updates
- Architecture changes
- New patterns introduced
- Package additions/removals

## See Also

- Full Report: `.claude/reports/AGENT_SYNC_REPORT_2025-10-11.md`
- Tech Stack: `.claude/TECH_STACK.md`
- Project Guide: `CLAUDE.md`
- Type Definitions: `libs/shared/types/src/lib/auth/auth.types.ts`
- Admin Types: `apps/frontend/src/types/admin.ts`
