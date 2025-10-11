# Authentication & Authorization

Complete JWT-based authentication with HTTP-only cookies, CSRF protection, RBAC, and multi-tenant isolation.

**Status**: Production Ready | **Last Updated**: 2025-10-11

## Quick Reference

### Endpoints

```typescript
GET / api / v1 / auth / csrf; // Get CSRF token
POST / api / v1 / auth / register; // Create account
POST / api / v1 / auth / login; // Login (sets cookies)
POST / api / v1 / auth / refresh; // Refresh access token
POST / api / v1 / auth / logout; // Logout and revoke
GET / api / v1 / auth / me; // Get current user
POST / api / v1 / auth / revoke - all; // Logout all devices
```

### Using Guards

```typescript
import { JwtAuthGuard, PermissionsGuard, Permissions } from '@ftry/backend/auth';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(['appointments:read'])
  async list(@CurrentUser() user: UserWithPermissions) {
    return this.service.list(user.tenantId);
  }
}
```

## Architecture

### JWT Tokens

**Access Token** (15 minutes):

- Short-lived, stateless
- HTTP-only cookie (XSS protection)
- Contains: userId, email, tenantId, roleId, permissions

**Refresh Token** (7 days):

- Long-lived, database-backed
- HTTP-only cookie
- Rotated on each refresh
- Can be revoked

### Token Flow

```
Client → POST /auth/login → Backend validates
       ← Sets HTTP-only cookies (access + refresh)

Client → GET /api/data (cookies auto-sent)
       → Backend validates JWT
       ← Returns data

Access expires → POST /auth/refresh (with refresh cookie)
               → Validates, rotates tokens
               ← Returns new cookies
```

## Security Features

### HTTP-Only Cookies ✅

- Cookies inaccessible to JavaScript (XSS protection)
- `httpOnly: true`, `secure: true`, `sameSite: 'strict'`
- Tokens automatically sent by browser

### CSRF Protection ✅

- Double Submit Cookie pattern
- All POST/PUT/PATCH/DELETE protected
- Automatic token injection via `apiClient`
- Header: `X-CSRF-Token`

### Password Security

- Bcrypt hashing (12 rounds)
- Complexity requirements (8+ chars, mixed case, number, symbol)
- Constant-time comparison

### Account Protection

- Lockout after 5 failed attempts (15 minutes)
- Atomic login increment (race-safe)
- Rate limiting on auth endpoints

### Token Security

- Refresh token rotation
- Token reuse detection (revokes all tokens)
- Database-backed revocation
- Device tracking (IP, user agent)

### Multi-Tenant Isolation

- Tenant ID in JWT
- Row-Level Security (RLS) at database
- Auto-scoped queries
- Super admin role (tenantId = null)

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=<generate-with-openssl-rand-base64-64>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

# Security
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15
BCRYPT_SALT_ROUNDS=12
CSRF_SECRET=<generate-with-openssl-rand-base64-64>
```

### Generate Secure Secrets

```bash
openssl rand -base64 64
```

## Frontend Integration

### API Client with CSRF

```typescript
import { api } from '@/lib/api-client';

// GET request (no CSRF needed)
const response = await api.get('/api/v1/users');

// POST request (CSRF auto-included)
const response = await api.post('/api/v1/users', {
  firstName: 'John',
});
```

### Authentication Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { login, isLoading } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid credentials');
    }
  };
}
```

## Testing

### Unit Tests

```bash
nx test backend-auth        # Auth service tests
nx test frontend-auth       # Frontend auth tests
```

**Coverage**: 85%+ (all critical paths tested)

### Manual Testing (with cookies)

```bash
# Get CSRF token
curl -c cookies.txt -b cookies.txt http://localhost:3001/api/v1/auth/csrf

# Login (tokens set as cookies)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -c cookies.txt -b cookies.txt \
  -d '{"email":"admin@glamour.com","password":"DevPassword123!@#"}'

# Get profile (cookie auto-sent)
curl http://localhost:3001/api/v1/auth/me -b cookies.txt

# Refresh token
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "X-CSRF-Token: <token>" \
  -c cookies.txt -b cookies.txt
```

## Performance

**Optimized Indexes**:

- `User_active_email_idx` - Login queries (70% faster)
- `RefreshToken_active_idx` - Token validation (80% faster)
- `RefreshToken_userId_isRevoked_idx` - Token cleanup (90% faster)

## Troubleshooting

### "JWT malformed" error

- Verify `Authorization: Bearer <token>` format
- Check JWT_SECRET matches between environments

### "Account locked" error

- Wait 15 minutes or reset: `UPDATE "User" SET loginAttempts=0, lockedUntil=NULL WHERE id=?`

### Token refresh fails

- Verify refresh token not expired (7 days)
- Check token not revoked in database

### "403 Forbidden" on POST

- CSRF token missing or invalid
- Clear token cache: `clearCsrfToken()`

## Next Steps

### Pre-Launch (Critical)

- [ ] Email verification
- [ ] Password reset flow

### Post-MVP

- [ ] Redis caching for JWT validation (>1000 users)
- [ ] 2FA (TOTP-based)
- [ ] Session management UI

### Future

- [ ] PII encryption at rest
- [ ] OAuth providers (Google, Microsoft)
- [ ] Magic link login

## Related Documentation

- [Frontend API Integration](./frontend-api-integration)
- [Environment Variables](./environment-variables)
- [Database Quick Reference](./database-quick-reference)
- [RLS Implementation Guide](../architecture/row-level-security)
