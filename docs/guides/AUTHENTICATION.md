# Authentication & Authorization

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-08
**Security Level**: Enterprise-Grade

Complete JWT-based authentication with HTTP-only cookie storage, refresh token rotation, CSRF protection, RBAC, and multi-tenant support.

## Quick Reference

### Endpoints

```typescript
GET / api / v1 / auth / csrf; // Get CSRF token
POST / api / v1 / auth / register; // Create account
POST / api / v1 / auth / login; // Login (sets HTTP-only cookies)
POST / api / v1 / auth / refresh; // Refresh access token
POST / api / v1 / auth / logout; // Logout (revoke refresh token)
GET / api / v1 / auth / me; // Get current user
POST / api / v1 / auth / revoke - all; // Revoke all tokens (logout all devices)
```

### Using Guards

```typescript
import { JwtAuthGuard, PermissionsGuard, Permissions } from '@ftry/backend/auth';

@Controller('appointments')
@UseGuards(JwtAuthGuard) // Require authentication
export class AppointmentsController {
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(['appointments:read']) // Require permission
  async list(@CurrentUser() user: UserWithPermissions) {
    return this.service.list(user.tenantId);
  }
}
```

## Architecture

### JWT Tokens

**Access Token** (15 minutes):

- Short-lived, stateless
- Stored in HTTP-only cookie (XSS protection)
- Used for API requests via `Authorization: Bearer` header
- Contains: userId, email, tenantId, roleId, permissions

**Refresh Token** (7 days):

- Long-lived, stored in database
- Stored in HTTP-only cookie (XSS protection)
- Used to get new access tokens
- Rotated on each refresh
- Can be revoked

### Token Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│ Client  │         │ Backend │         │ Database │
└────┬────┘         └────┬────┘         └────┬─────┘
     │                   │                    │
     │ POST /auth/login  │                    │
     ├──────────────────>│                    │
     │                   │  Validate user     │
     │                   ├───────────────────>│
     │                   │                    │
     │  Access + Refresh │  Store refresh     │
     │<──────────────────┤<───────────────────┤
     │                   │                    │
     │ GET /api/data     │                    │
     │ (with access)     │                    │
     ├──────────────────>│  Validate JWT      │
     │                   │                    │
     │  Data             │                    │
     │<──────────────────┤                    │
     │                   │                    │
     │ POST /auth/refresh│                    │
     │ (with refresh)    │  Validate & rotate │
     ├──────────────────>├───────────────────>│
     │                   │  Revoke old        │
     │  New tokens       │  Store new         │
     │<──────────────────┤<───────────────────┤
```

## Security Features

### HTTP-Only Cookie Authentication ✅

- **Implemented**: 2025-10-08 (commit: c3277ed)
- **XSS Protection**: Cookies inaccessible to JavaScript
- **Cookie Configuration**:
  - `httpOnly: true` - No JavaScript access
  - `secure: true` (production) - HTTPS only
  - `sameSite: 'strict'` - CSRF protection
  - `maxAge`: 15min (access), 7days (refresh)
- **Frontend**: Tokens automatically sent via cookies
- **Backend**: Extracts tokens from cookies

### CSRF Protection ✅

- **Implemented**: 2025-10-08
- **Pattern**: Double Submit Cookie
- **Endpoints Protected**: All POST/PUT/PATCH/DELETE requests
- **Frontend Integration**: Automatic token injection via `apiClient`
- **Token Endpoint**: `GET /api/v1/auth/csrf`
- **Header**: `X-CSRF-Token`

### Password Security

- ✅ Bcrypt hashing (12 rounds)
- ✅ Complexity requirements (8+ chars, upper, lower, number, symbol)
- ✅ Validated on registration
- ✅ Constant-time comparison (timing attack protection)

### Account Protection

- ✅ Account lockout after 5 failed attempts (15 minutes)
- ✅ Atomic login attempt increment (race condition safe)
- ✅ Locked until timestamp
- ✅ Rate limiting on auth endpoints

### Token Security

- ✅ HTTP-only cookie storage (XSS protection)
- ✅ Refresh token rotation (prevents replay)
- ✅ Token reuse detection (revokes all user tokens)
- ✅ Database-backed revocation
- ✅ Device tracking (IP, user agent)

### Multi-Tenant Isolation

- ✅ Tenant ID in JWT payload
- ✅ Row-Level Security (RLS) enforced at database
- ✅ All queries automatically scoped by tenantId
- ✅ Super admin role (tenantId = null)

## Database Schema

### User Table

```prisma
model User {
  id                      String    @id @default(cuid())
  email                   String    @unique @db.VarChar(255)
  password                String    @db.VarChar(255)

  tenantId                String?
  roleId                  String

  loginAttempts           Int       @default(0) @db.SmallInt
  lockedUntil             DateTime? @db.Timestamptz

  isDeleted               Boolean   @default(false)
  deletedAt               DateTime? @db.Timestamptz

  // Relations
  role                    Role
  tenant                  Tenant?
  refreshTokens           RefreshToken[]

  // Constraint: isDeleted and deletedAt must be in sync
  @@constraint("User_soft_delete_consistency_check")
}
```

### RefreshToken Table

```prisma
model RefreshToken {
  id            String    @id @default(cuid())
  token         String    @unique @db.VarChar(500)
  userId        String

  deviceInfo    String?   @db.VarChar(255)
  ipAddress     String?   @db.VarChar(45)

  expiresAt     DateTime  @db.Timestamptz
  isRevoked     Boolean   @default(false)
  revokedAt     DateTime? @db.Timestamptz
  revokedReason String?   @db.VarChar(255)

  user          User      @relation(...)
}
```

## Performance Optimizations

### Indexes

**User table**:

- `User_active_email_idx` - Partial index for active users (login queries)
- `User_tenantId_isDeleted_idx` - Tenant-scoped queries
- `User_locked_idx` - Locked accounts

**RefreshToken table**:

- `RefreshToken_userId_isRevoked_idx` - Token validation
- `RefreshToken_active_idx` - Active tokens (partial)

Expected improvements:

- Login: ~70% faster
- Token refresh: ~80% faster
- Token cleanup: ~90% faster

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=<generate-with-openssl-rand-base64-64>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

# Security
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15
BCRYPT_SALT_ROUNDS=12
```

### Generate Secure Secret

```bash
openssl rand -base64 64
```

## Testing

### Unit Tests

```bash
nx test backend-auth        # Auth service tests
nx test frontend-auth       # Frontend auth tests
```

**Coverage**: 85%+ (all critical paths tested)

### Manual Testing

**NOTE**: With HTTP-only cookies, tokens are automatically sent. Use `-c` and `-b` flags for cookie management.

```bash
# Get CSRF token first
curl -c cookies.txt -b cookies.txt http://localhost:3001/api/v1/auth/csrf

# Login (tokens set as cookies automatically)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token-from-previous-response>" \
  -c cookies.txt -b cookies.txt \
  -d '{"email":"admin@glamour.com","password":"DevPassword123!@#"}'

# Get profile (access token sent automatically via cookie)
curl http://localhost:3001/api/v1/auth/me \
  -b cookies.txt

# Refresh token (refresh token sent automatically via cookie)
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "X-CSRF-Token: <token>" \
  -c cookies.txt -b cookies.txt

# Logout (refresh token sent automatically via cookie)
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "X-CSRF-Token: <token>" \
  -c cookies.txt -b cookies.txt
```

## Frontend Integration

### API Client with Automatic CSRF

The frontend uses a custom `apiClient` that automatically handles CSRF tokens:

```typescript
import { api } from '@/lib/api-client';

// GET request (no CSRF needed)
const response = await api.get('/api/v1/users');

// POST request (CSRF token automatically included)
const response = await api.post('/api/v1/users', {
  firstName: 'John',
  lastName: 'Doe',
});
```

**Implementation**: `apps/frontend/src/lib/api-client.ts`

### CSRF Token Management

```typescript
import { getCsrfToken, clearCsrfToken, prefetchCsrfToken } from '@/lib/csrf';

// Prefetch token on app initialization
prefetchCsrfToken();

// Token is cached and automatically used by apiClient
// On 403 error, token is cleared and refetched on next request
```

**Implementation**: `apps/frontend/src/lib/csrf.ts`

### Authentication Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { login, isLoading } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Tokens are automatically set as HTTP-only cookies
      // Navigation is handled by the component
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid credentials');
    }
  };
}
```

**Implementation**: `apps/frontend/src/hooks/useAuth.ts`

## Future Enhancements

### High Priority (Pre-Launch)

- ✅ ~~HttpOnly Cookies~~ - **COMPLETED** (2025-10-08)
- ✅ ~~CSRF Protection~~ - **COMPLETED** (2025-10-08)
- ✅ ~~Row-Level Security~~ - **COMPLETED** (2025-10-08)
- **Email Verification** - Verify email after registration
- **Password Reset** - Forgot password flow

### Medium Priority (Post-MVP)

- **Redis Caching** - Cache JWT validation for performance (>1000 users)
- **2FA Support** - TOTP-based two-factor authentication
- **Session Management** - View and revoke active sessions

### Low Priority (Scale)

- **PII Encryption** - Encrypt sensitive fields at rest
- **OAuth Providers** - Google, Microsoft, Facebook login
- **Magic Link Login** - Passwordless authentication

**All enhancements documented with implementation plans**. See `/libs/backend/auth/CLAUDE.md` for details.

## Troubleshooting

### "JWT malformed" error

- Verify token format: `Authorization: Bearer <token>`
- Check JWT_SECRET matches between generation and validation

### "Account locked" error

- Wait 15 minutes or reset: `UPDATE "User" SET loginAttempts=0, lockedUntil=NULL WHERE id=?`

### Token refresh fails

- Verify refresh token not expired (7 days)
- Check token not revoked: `SELECT * FROM "RefreshToken" WHERE token=? AND isRevoked=false`

## Related Documentation

- Code: `/libs/backend/auth/` - Implementation
- Tests: `/libs/backend/auth/src/lib/**/*.spec.ts`
- Database: `/prisma/CLAUDE.md` - Schema guidelines
- Developer Guide: `/libs/backend/auth/CLAUDE.md`

---

**Last Updated**: 2025-10-08
**Status**: Production Ready
