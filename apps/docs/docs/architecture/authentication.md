# Authentication Architecture

ftry implements a secure, JWT-based authentication system with refresh token rotation, account lockout protection, and Row-Level Security (RLS) integration.

## Overview

**Strategy**: JWT access tokens + database-backed refresh tokens
**Security Features**: CSRF protection, token rotation, account lockout, RLS integration
**Implementation**: NestJS with Passport.js strategies

## Authentication Flow

### Login Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  POST /api/v1/auth/login  │                           │
     │  { email, password }      │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │  1. Find user by email    │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  2. User record           │
     │                           │<──────────────────────────┤
     │                           │                           │
     │  3. Verify password       │                           │
     │     (bcrypt.compare)      │                           │
     │                           │                           │
     │  4. Check account status  │                           │
     │     - Active?             │                           │
     │     - Locked?             │                           │
     │                           │                           │
     │                           │  5. Generate JWT tokens   │
     │                           │     - Access (15 min)     │
     │                           │     - Refresh (7 days)    │
     │                           │                           │
     │                           │  6. Store refresh token   │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  7. Update last login     │
     │                           ├──────────────────────────>│
     │                           │                           │
     │  8. Response with tokens  │                           │
     │     (HTTP-only cookies)   │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

### Authenticated Request Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  GET /api/v1/resource     │                           │
     │  Cookie: accessToken=...  │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │  1. Extract JWT from      │                           │
     │     cookie                │                           │
     │                           │                           │
     │  2. Verify JWT signature  │                           │
     │     (JWT_SECRET)          │                           │
     │                           │                           │
     │                           │  3. Set RLS tenant context│
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  4. Load user + perms     │
     │                           ├──────────────────────────>│
     │                           │                           │
     │  5. Attach user to req    │                           │
     │     (req.user)            │                           │
     │                           │                           │
     │  6. Check permissions     │                           │
     │     (if @Permissions)     │                           │
     │                           │                           │
     │  7. Execute controller    │                           │
     │     (tenant-scoped)       │                           │
     │                           │                           │
     │  8. Response              │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

### Token Refresh Flow

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Client  │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └────┬─────┘
     │                           │                           │
     │  POST /api/v1/auth/refresh│                           │
     │  Cookie: refreshToken=... │                           │
     ├──────────────────────────>│                           │
     │                           │                           │
     │                           │  1. Find refresh token    │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  2. Validate token        │
     │                           │     - Not expired?        │
     │                           │     - Not revoked?        │
     │                           │                           │
     │                           │  3. Generate NEW tokens   │
     │                           │     (rotation)            │
     │                           │                           │
     │                           │  4. Revoke OLD token      │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │  5. Store NEW token       │
     │                           ├──────────────────────────>│
     │                           │                           │
     │  6. Response with tokens  │                           │
     │     (HTTP-only cookies)   │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

## Security Features

### JWT Tokens

#### Access Token

**Purpose**: Authenticate API requests
**Lifetime**: 15 minutes (short-lived)
**Storage**: HTTP-only cookie
**Contains**:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "tenantId": "tenant-id",
  "roleId": "role-id",
  "permissions": ["users:read", "appointments:create"],
  "iat": 1696000000,
  "exp": 1696000900
}
```

**Why Short-Lived?**

- Limits damage if token is stolen
- Reduced need for revocation (expires quickly)
- Forces periodic re-authentication

#### Refresh Token

**Purpose**: Obtain new access tokens
**Lifetime**: 7 days (long-lived)
**Storage**: HTTP-only cookie + database
**Contains**:

```json
{
  "jti": "token-unique-id",
  "sub": "user-id",
  "iat": 1696000000,
  "exp": 1696604800
}
```

**Database Record**:

```typescript
{
  id: 'refresh-token-id',
  token: 'hashed-token',
  userId: 'user-id',
  deviceInfo: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
  expiresAt: new Date('2025-10-18'),
  isRevoked: false,
  revokedAt: null,
  revokedReason: null,
}
```

**Why Database-Backed?**

- Enables revocation (logout, security breach)
- Tracks active sessions
- Device/location tracking

### Token Rotation

**Security Best Practice**: Generate new refresh token on every refresh.

**Flow**:

1. Client sends refresh token
2. Backend validates token
3. Backend generates NEW token pair
4. Backend revokes OLD refresh token
5. Backend returns NEW tokens

**Benefits**:

- Prevents token reuse attacks
- Limits impact of token theft
- Easier to detect compromised tokens

**Implementation**:

```typescript
// auth.service.ts
async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  // 1. Validate old token
  const storedToken = await this.validateRefreshToken(refreshToken);

  // 2. Generate new tokens
  const tokens = await this.generateTokens(storedToken.user);

  // 3. Revoke old token (rotation)
  await this.revokeRefreshToken(refreshToken, 'Token rotated');

  // 4. Return new tokens
  return tokens;
}
```

### Account Lockout Protection

Prevents brute-force password attacks.

**Configuration**:

- **Max Attempts**: 5 failed logins
- **Lockout Duration**: 15 minutes
- **Reset On**: Successful login

**Implementation**:

```typescript
// auth.service.ts
async handleFailedLogin(user: User) {
  const newAttempts = user.loginAttempts + 1;

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock account for 15 minutes
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: newAttempts,
        lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
      },
    });

    throw new UnauthorizedException('Account locked due to too many failed attempts');
  }

  // Increment attempt counter
  await this.prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: newAttempts },
  });
}
```

**Database Schema**:

```prisma
model User {
  loginAttempts   Int       @default(0)
  lockedUntil     DateTime?
}
```

### CSRF Protection

Prevents Cross-Site Request Forgery attacks on state-changing operations.

**How It Works**:

1. Client requests CSRF token: `GET /api/v1/auth/csrf`
2. Server generates token and stores in session
3. Server returns token in `X-CSRF-Token` header
4. Client includes token in state-changing requests
5. Server validates token matches session

**Protected Endpoints**:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- All `POST`, `PUT`, `PATCH`, `DELETE` endpoints

**Implementation**:

```typescript
// csrf.interceptor.ts
@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Generate and set CSRF token in cookie
    const csrfToken = this.generateToken();
    response.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return next.handle();
  }
}
```

### Row-Level Security (RLS) Integration

Every authenticated request automatically sets tenant context for database-level isolation.

**Implementation**:

```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload): Promise<UserWithPermissions> {
  // CRITICAL: Set RLS tenant context BEFORE any queries
  await this.prisma.setTenantContext(payload.tenantId);

  // All subsequent queries are now tenant-scoped
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      role: { select: { permissions: true } },
      tenant: true,
    },
  });

  // ... rest of validation
}
```

**Benefits**:

- Defense against SQL injection
- Automatic tenant filtering
- Prevents cross-tenant data leaks
- Zero-trust security model

**See Also**: [Database Architecture - RLS](./database.md#row-level-security-rls)

### Password Security

**Hashing Algorithm**: bcrypt with 12 salt rounds

**Registration**:

```typescript
// auth.service.ts
async register(dto: RegisterDto): Promise<SafeUser> {
  // Hash password with bcrypt (12 rounds)
  const hashedPassword = await bcrypt.hash(dto.password, 12);

  const user = await this.prisma.user.create({
    data: {
      ...dto,
      password: hashedPassword,  // Store hash, never plaintext
    },
  });

  // Never return password hash
  return toSafeUser(user);
}
```

**Login**:

```typescript
// local.strategy.ts
async validate(email: string, password: string): Promise<UserWithPermissions> {
  const user = await this.findUserByEmail(email);

  // Constant-time comparison (prevents timing attacks)
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    await this.handleFailedLogin(user);
    throw new UnauthorizedException('Invalid credentials');
  }

  // ... rest of validation
}
```

**Password Requirements** (enforced by DTO validation):

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

## API Endpoints

### Public Endpoints

#### `POST /api/v1/auth/register`

Create new user account.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9876543210",
  "roleId": "role-id"
}
```

**Response**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91-9876543210",
    "roleId": "role-id",
    "status": "active",
    "createdAt": "2025-10-11T10:00:00Z"
  }
}
```

**Rate Limit**: 3 registrations per hour per IP

#### `POST /api/v1/auth/login`

Authenticate with email and password.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "expiresIn": 900 // seconds
  }
}
```

**Set-Cookie**: `accessToken`, `refreshToken` (HTTP-only)

**Rate Limit**: 5 attempts per minute per IP

#### `POST /api/v1/auth/refresh`

Obtain new access token using refresh token.

**Request**: No body (uses refresh token from cookie)

**Response**:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "expiresIn": 900
  }
}
```

**Set-Cookie**: New `accessToken`, new `refreshToken` (rotation)

**Rate Limit**: 10 requests per minute per user

### Protected Endpoints

Require valid access token in cookie.

#### `GET /api/v1/auth/me`

Get current user profile.

**Response**:

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91-9876543210",
    "roleId": "role-id",
    "tenantId": "tenant-id",
    "status": "active",
    "lastLogin": "2025-10-11T10:00:00Z",
    "role": {
      "id": "role-id",
      "name": "Staff",
      "permissions": ["appointments:read", "appointments:create"]
    },
    "tenant": {
      "id": "tenant-id",
      "name": "Salon XYZ"
    },
    "permissions": ["appointments:read", "appointments:create"]
  }
}
```

#### `POST /api/v1/auth/logout`

Logout and revoke refresh token.

**Response**:

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Clears Cookies**: `accessToken`, `refreshToken`

#### `POST /api/v1/auth/revoke-all`

Revoke all refresh tokens (logout from all devices).

**Response**:

```json
{
  "success": true,
  "message": "All tokens revoked successfully",
  "data": {
    "revokedCount": 3
  }
}
```

**Use Case**: User suspects account compromise

## Guards and Decorators

### JwtAuthGuard

Protect routes that require authentication.

**Usage**:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@ftry/backend/auth';

@Controller('appointments')
@UseGuards(JwtAuthGuard) // All routes require auth
export class AppointmentsController {
  @Get()
  async getAppointments() {
    // User is authenticated
  }
}
```

### PermissionsGuard

Enforce role-based access control (RBAC).

**Usage**:

```typescript
import { JwtAuthGuard, PermissionsGuard, Permissions } from '@ftry/backend/auth';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  @Get()
  @Permissions(['users:read']) // OR logic: any permission
  async getUsers() {
    // User has users:read permission
  }

  @Post()
  @Permissions(['users:create', 'billing:create'], true) // AND logic
  async createUserWithBilling() {
    // User has BOTH permissions
  }
}
```

### @CurrentUser Decorator

Extract authenticated user from request.

**Usage**:

```typescript
import { CurrentUser } from '@ftry/backend/auth';
import { UserWithPermissions } from '@ftry/shared/types';

@Controller('profile')
export class ProfileController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UserWithPermissions) {
    // user.id, user.tenantId, user.permissions available
    return { profile: user };
  }
}
```

## Configuration

### Environment Variables

```bash
# JWT Secret (CRITICAL: Change in production)
JWT_SECRET=your-super-secret-key-minimum-64-characters-long

# Token Expiry
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

# Account Lockout
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15

# Password Hashing
BCRYPT_SALT_ROUNDS=12
```

:::danger Production Security
**Never use default `JWT_SECRET` in production.** Generate with:

```bash
openssl rand -base64 64
```

:::

### Module Configuration

```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
      },
    }),
    PassportModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, JwtAuthGuard, PermissionsGuard],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
```

## Performance Considerations

### Critical Issue: JWT Strategy Caching

**Current**: Database queried on EVERY authenticated request

**Impact**: Will not scale beyond ~50 concurrent users

**Solution**: Redis caching for user data

**Implementation** (future):

```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload): Promise<UserWithPermissions> {
  // Set RLS context first
  await this.prisma.setTenantContext(payload.tenantId);

  // Check Redis cache
  const cacheKey = `user:${payload.sub}`;
  let user = await this.redis.get(cacheKey);

  if (!user) {
    // Cache miss: query database
    user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true, tenant: true },
    });

    // Cache for 10 minutes (shorter than token expiry)
    await this.redis.set(cacheKey, user, 'EX', 600);
  }

  return user;
}
```

**Cache Invalidation**:

- On user update: clear cache
- On role update: clear all user caches
- TTL: 10 minutes (shorter than access token expiry)

## Security Best Practices

### DO ✅

- Always use HTTPS in production
- Rotate JWT secret periodically
- Set strong password requirements
- Monitor failed login attempts
- Log security events
- Use HTTP-only cookies for tokens
- Implement rate limiting on auth endpoints
- Clear tokens on logout
- Revoke tokens on password change

### DON'T ❌

- Store JWT secret in code
- Return password hashes in responses
- Use long-lived access tokens
- Skip CSRF protection
- Allow unlimited login attempts
- Log sensitive data (passwords, tokens)
- Trust client-provided user IDs
- Reuse refresh tokens after refresh

## Testing

### Unit Tests

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  it('should hash password on registration', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    const user = await authService.register(dto);

    expect(user.password).not.toBe(dto.password);
    expect(await bcrypt.compare(dto.password, user.password)).toBe(true);
  });

  it('should lock account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow();
    }

    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    expect(user.lockedUntil).not.toBeNull();
  });
});
```

### Integration Tests

```typescript
// auth.controller.integration.spec.ts
describe('AuthController', () => {
  it('should login and set cookies', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Pass123!' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('accessToken');
    expect(response.headers['set-cookie'][1]).toContain('refreshToken');
  });
});
```

## Troubleshooting

### "JWT malformed" Error

**Cause**: Token not in correct format or expired

**Solution**:

- Check token in `Authorization: Bearer <token>` header
- Verify token hasn't expired
- Ensure JWT_SECRET matches

### "Unauthorized" on Valid Token

**Cause**: User deleted or deactivated

**Solution**:

- Check user status in database
- Verify user hasn't been soft-deleted
- Ensure tenantId still valid

### Account Locked

**Cause**: Too many failed login attempts

**Solution**:

- Wait 15 minutes for automatic unlock
- OR manually reset: `UPDATE "User" SET loginAttempts = 0, lockedUntil = NULL WHERE id = 'user-id'`

## Next Steps

- [API Reference - Authentication](../api/authentication.md) - Detailed endpoint docs
- [Backend Architecture](./backend.md) - NestJS module structure
- [Database Architecture](./database.md) - User and token schema

---

**Last Security Audit**: 2025-10-11
**Auth Module Location**: `libs/backend/auth/`
**Critical Issues**: JWT caching pending (P0)
