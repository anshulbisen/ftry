# CLAUDE.md - Backend Auth Module

This file provides guidance for AI agents when working with the authentication module.

## Module Overview

**Location**: `libs/backend/auth`  
**Purpose**: JWT-based authentication and authorization with multi-tenancy support  
**Type**: Data-access library (NestJS)

## Architecture

```
libs/backend/auth/
├── src/
│   ├── lib/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts       # REST endpoints
│   │   ├── services/
│   │   │   ├── auth.service.ts          # Core auth logic
│   │   │   └── user-validation.service.ts # User status validation
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts          # JWT validation
│   │   │   └── local.strategy.ts        # Email/password validation
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts        # Protect routes
│   │   │   ├── local-auth.guard.ts      # Login endpoint
│   │   │   └── permissions.guard.ts     # RBAC enforcement
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts # Extract user from request
│   │   │   └── permissions.decorator.ts  # Required permissions
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── auth.module.ts
│   └── index.ts
└── CLAUDE.md (this file)
```

## Key Features

1. **JWT Authentication**
   - Access token: 15 minutes (short-lived)
   - Refresh token: 7 days (stored in database)
   - Token rotation on refresh (security best practice)
   - Automatic token cleanup

2. **Security Features**
   - Password hashing with bcrypt (12 salt rounds)
   - Account lockout after 5 failed attempts (15 minutes)
   - Atomic login attempt increment (prevents race conditions)
   - Soft delete for user accounts
   - Device tracking (IP address, user agent)

3. **Multi-Tenancy**
   - Tenant isolation at database level
   - Super admin role (tenantId = null)
   - Tenant-specific roles and permissions

4. **Role-Based Access Control (RBAC)**
   - Permissions stored in JWT payload
   - Permission guard for fine-grained access control
   - Additional user-specific permissions

## API Endpoints

### Public Endpoints

- `POST /api/v1/auth/register` - Create new user account
- `POST /api/v1/auth/login` - Authenticate with email/password
- `POST /api/v1/auth/refresh` - Get new access token

### Protected Endpoints (Require JWT)

- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/logout` - Revoke refresh token
- `POST /api/v1/auth/revoke-all` - Logout from all devices

## Usage Examples

### Protecting a Route

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, Permissions, PermissionsGuard } from '@ftry/backend/auth';
import { UserWithPermissions } from '@ftry/shared/types';

@Controller('appointments')
@UseGuards(JwtAuthGuard) // Require authentication
export class AppointmentsController {
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(['appointments:read']) // Require specific permission (OR logic by default)
  async getAppointments(@CurrentUser() user: UserWithPermissions) {
    // user.tenantId, user.id, user.permissions available
    return this.service.getAppointments(user.tenantId);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions(['appointments:create', 'billing:create'], true) // AND logic - both required
  async createInvoicedAppointment(@CurrentUser() user: UserWithPermissions) {
    // User must have BOTH permissions
    return this.service.createWithInvoice(user.tenantId);
  }
}
```

### Optional Authentication

```typescript
import { Get, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard, CurrentUser } from '@ftry/backend/auth';

@Get('public-resource')
@UseGuards(OptionalAuthGuard)
async getResource(@CurrentUser() user?: UserWithPermissions) {
  if (user) {
    // Return personalized content
  } else {
    // Return public content
  }
}
```

## Configuration

Required environment variables:

```bash
# CRITICAL: Never use default in production
JWT_SECRET=your-super-secret-key-change-in-production

# Optional: Defaults shown
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15
BCRYPT_SALT_ROUNDS=12
```

Generate secure secret:

```bash
openssl rand -base64 64
```

## Database Schema

### User Model

```prisma
model User {
  id                      String          @id @default(cuid())
  email                   String          @unique
  password                String          // Bcrypt hashed
  firstName               String
  lastName                String
  phone                   String?
  tenantId                String?
  roleId                  String
  status                  String          @default("active")
  emailVerified           Boolean         @default(false)
  emailVerificationToken  String?
  passwordResetToken      String?
  passwordResetExpiry     DateTime?
  lastLogin               DateTime?
  loginAttempts           Int             @default(0)
  lockedUntil             DateTime?
  isDeleted               Boolean         @default(false)
  additionalPermissions   String[]        @default([])

  // Relations
  role                    Role            @relation(...)
  tenant                  Tenant?         @relation(...)
  refreshTokens           RefreshToken[]
}
```

### Refresh Token Model

```prisma
model RefreshToken {
  id              String    @id @default(cuid())
  token           String    @unique
  userId          String
  deviceInfo      String?
  ipAddress       String?
  expiresAt       DateTime
  isRevoked       Boolean   @default(false)
  revokedAt       DateTime?
  revokedReason   String?
  createdAt       DateTime  @default(now())

  user            User      @relation(...)
}
```

## Security Best Practices

### DO ✅

- Always use `JwtAuthGuard` for protected routes
- Use `PermissionsGuard` for RBAC enforcement
- Validate user input with DTOs
- Log security events (failed logins, lockouts)
- Implement rate limiting on auth endpoints
- Use HTTPS in production
- Rotate JWT secrets periodically
- Monitor for suspicious login patterns

### DON'T ❌

- Never expose password hashes in responses
- Don't skip validation on DTOs
- Don't hardcode JWT secrets
- Don't allow long-lived access tokens
- Don't ignore failed login attempts
- Don't log sensitive data (passwords, tokens)
- Don't trust client-provided user IDs

## Row-Level Security (RLS) Integration

**Status**: ✅ ACTIVE
**Implementation Date**: 2025-10-08
**Security Level**: CRITICAL

### Overview

Row-Level Security (RLS) is now **ACTIVE** and enforces tenant isolation at the database level. Every authenticated request automatically sets the tenant context, ensuring users can only access their tenant's data.

### How It Works

```typescript
// JwtStrategy.validate() automatically called on every authenticated request
async validate(payload: JwtPayload): Promise<UserWithPermissions> {
  // CRITICAL: Set RLS tenant context BEFORE any database queries
  await this.prisma.setTenantContext(payload.tenantId);

  // All subsequent database queries are now tenant-scoped
  const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

  return userWithPermissions;
}
```

### Security Benefits

1. **Defense in Depth**: Even if application code has bugs (missing WHERE clauses), database blocks cross-tenant access
2. **Zero Trust**: Database enforces tenant isolation, not just application code
3. **Audit Trail**: All queries logged with tenant context
4. **Super Admin Support**: Null tenantId allows global access for system administrators

### Performance Impact

- **Overhead per request**: ~2-5ms (negligible)
- **Cache efficiency**: Unaffected (context set for both cache hits and misses)
- **Scalability**: No additional database connections required

### Usage in Custom Queries

```typescript
// In any service that uses PrismaService
import { PrismaService } from '@ftry/shared/prisma';

@Injectable()
export class CustomService {
  constructor(private prisma: PrismaService) {}

  async getUserData(user: UserWithPermissions) {
    // NO NEED to manually set context - JwtStrategy already did it!
    // RLS automatically filters by tenant

    const data = await this.prisma.user.findMany();
    // Returns ONLY the current tenant's users (RLS enforced)

    // Even if you forget WHERE clause:
    const allUsers = await this.prisma.user.findMany();
    // STILL returns only current tenant's users (RLS protects you!)
  }

  // For admin operations (migrations, seeds), clear context:
  async adminOperation() {
    await this.prisma.setTenantContext(null); // Super admin mode
    const allTenantData = await this.prisma.user.findMany();
    // Now returns ALL users from all tenants
  }
}
```

### Testing RLS

```typescript
// Unit tests mock setTenantContext
const mockPrisma = {
  setTenantContext: jest.fn().mockResolvedValue(undefined),
  user: { findUnique: jest.fn() },
};

// Integration tests verify actual tenant isolation
it('should isolate tenant data', async () => {
  await prisma.setTenantContext('tenant-1');
  const users = await prisma.user.findMany();
  expect(users.every((u) => u.tenantId === 'tenant-1')).toBe(true);
});
```

### Debugging RLS Issues

```typescript
// Check current tenant context
const context = await prisma.getTenantContext();
console.log('Current tenant:', context); // 'tenant-123' or '' (super admin)

// Enable debug logging
// Set NODE_ENV=development to see RLS context logs:
// "RLS tenant context set: tenantId=tenant-123"
// "RLS tenant context cleared (super admin access)"
```

### Important Notes

- **Automatic**: RLS context is set automatically on every authenticated request
- **Transparent**: Developers don't need to manually set context in most cases
- **Fail Fast**: If context cannot be set, request fails with UnauthorizedException
- **Cached Users**: Context is set even for cache hits (ensures every request is protected)

### See Also

- **Full Implementation Report**: `/docs/RLS_INTEGRATION_REPORT.md`
- **Database Documentation**: `prisma/CLAUDE.md` (Row-Level Security section)
- **Integration Tests**: `libs/backend/auth/src/lib/strategies/jwt.strategy.integration.spec.ts`

---

## Known Issues & TODOs

### ✅ Completed Security Fixes

1. **✅ Row-Level Security** - Database-level tenant isolation active (2025-10-08)
2. **✅ JWT secret validation** - Fails fast if not set

### Critical Security Fixes Needed

1. **Add token reuse detection** - Detect compromised tokens
2. **Fix timing attack** - Constant-time password comparison
3. **Add rate limiting** - Refresh endpoint missing throttle

### Performance Improvements

1. **Cache user data** - JWT strategy queries DB on every request
2. **Add database indexes** - RefreshToken queries need optimization
3. **Scheduled cleanup** - Token cleanup should run on cron

### Feature Additions

1. **Session management** - View/revoke active sessions
2. **Email verification** - Verify email after registration
3. **Password reset** - Forgot password flow
4. **2FA support** - TOTP-based two-factor auth

## Testing

### Running Tests

```bash
# Unit tests
nx test backend-auth

# With coverage
nx test backend-auth --coverage

# Watch mode
nx test backend-auth --watch
```

### Test Structure

- **Unit tests**: `*.spec.ts` - Test individual services/controllers
- **Integration tests**: `*.integration.spec.ts` - Test module interactions
- **E2E tests**: In `apps/backend-e2e` - Test full request lifecycle

### Current Coverage

- AuthService: ~95% (excellent)
- AuthController: ~90% (good)
- Guards: 100% (complete)
- Strategies: 80% (needs improvement)

## Common Patterns

### Error Handling

```typescript
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AUTH_ERRORS } from '@ftry/shared/constants';

// Use standardized error messages
throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
throw new ConflictException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
```

### Response Formatting

```typescript
import { successResponse } from '@ftry/shared/utils';

// Standardized success response
return successResponse(AUTH_MESSAGES.LOGIN_SUCCESS, {
  user: safeUser,
  accessToken,
  refreshToken,
  expiresIn,
});
```

### Logging

```typescript
private readonly logger = new Logger(AuthService.name);

// Info logs
this.logger.log(`User registered successfully: ${user.id}`);

// Warning logs
this.logger.warn(`Failed login attempt ${newAttempts} for: ${user.email}`);

// Error logs (with stack trace)
this.logger.error(`Critical error occurred`, exception.stack);
```

## Related Modules

- `@ftry/shared/types` - TypeScript types
- `@ftry/shared/constants` - Auth constants
- `@ftry/shared/utils` - Utility functions
- `@ftry/shared/prisma` - Database client

## Troubleshooting

### "JWT malformed" error

- Check that token is being sent in `Authorization: Bearer <token>` header
- Verify token hasn't expired
- Ensure JWT_SECRET matches between generation and validation

### "User not found" during JWT validation

- Token might be valid but user was deleted
- Check that user status is "active"
- Verify user hasn't been soft-deleted

### Account lockout not working

- Ensure atomic increment is used (not manual count)
- Check that `loginAttempts` field is being updated
- Verify `lockedUntil` is being set correctly

### Refresh token reuse not detected

- Feature is TODO (see Known Issues)
- Currently validation happens but no reuse detection

## Performance Considerations

1. **JWT Strategy Performance**:
   - Currently queries database on EVERY authenticated request
   - Consider implementing Redis cache for user data
   - Cache TTL should be < access token expiry (15 minutes)

2. **Token Cleanup**:
   - Currently runs on-demand
   - Should implement scheduled job (daily at 3 AM)
   - Consider batch deletion for large datasets

3. **Login Attempts**:
   - Uses atomic increment to prevent race conditions
   - Scales well for high-concurrency scenarios

## Code Review Checklist

When reviewing auth-related code, check:

- [ ] JWT guards applied to protected routes
- [ ] Permission checks for sensitive operations
- [ ] Input validation with DTOs
- [ ] Password never returned in responses
- [ ] Security events logged appropriately
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info
- [ ] Tests cover security scenarios

## Support & Questions

For questions or issues with this module:

1. Review this CLAUDE.md file
2. Check the comprehensive backend review: `/BACKEND_AUTH_REVIEW.md`
3. Review NestJS auth documentation
4. Check related GitHub issues

---

**Last Updated**: 2025-10-08  
**Module Version**: 1.0.0  
**Maintainer**: Backend Team
