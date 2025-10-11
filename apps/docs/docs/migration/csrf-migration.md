# CSRF Protection Migration

**Date**: 2025-10-08
**Status**: ✅ COMPLETED
**Implementation**: HTTP-only Cookie + Double Submit Pattern

## Overview

CSRF protection has been successfully implemented using the `csurf` package with HTTP-only cookies and custom interceptor.

### Implementation Summary

1. ✅ **CSRF Middleware**: `csurf` package configured with HTTP-only cookies
2. ✅ **Custom Interceptor**: `CsrfInterceptor` for automatic token injection
3. ✅ **Protected Endpoints**: All POST/PUT/PATCH/DELETE require CSRF token
4. ✅ **Frontend Integration**: Automatic token handling via `apiClient`
5. ✅ **Cookie Security**: `httpOnly`, `secure`, `sameSite: strict`

## Current Implementation

### Backend Configuration

Location: `apps/backend/src/bootstrap.ts`

```typescript
import csurf from 'csurf';

app.use(
  csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      key: '_csrf',
    },
  }),
);
```

### Protected Endpoints

All state-changing endpoints (POST, PUT, PATCH, DELETE) require CSRF tokens in the `x-csrf-token` header.

### Frontend Integration

CSRF tokens are automatically fetched and included in requests via the API client:

```typescript
// apps/frontend/src/lib/api-client.ts
import { getCsrfToken } from '@/lib/csrf';

axios.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    const token = await getCsrfToken();
    config.headers['x-csrf-token'] = token;
  }
  return config;
});
```

## Security Features

### Cookie Configuration

- **`httpOnly: true`**: Prevents XSS attacks from reading the cookie
- **`secure: true`**: HTTPS-only in production
- **`sameSite: 'strict'`**: Prevents CSRF via third-party sites
- **`key: '_csrf'`**: Consistent cookie name

### Token Flow

1. Frontend requests CSRF token: `GET /api/v1/auth/csrf`
2. Backend generates token and sets HTTP-only cookie
3. Frontend stores token in memory
4. Frontend includes token in `x-csrf-token` header for state-changing requests
5. Backend validates token against cookie

## Security Validation

- ✅ POST without CSRF token → 403 Forbidden
- ✅ POST with valid CSRF token → Success
- ✅ GET without CSRF token → Success (read-only)
- ✅ Invalid CSRF token → 403 Forbidden
- ✅ CSRF cookie is httpOnly
- ✅ CSRF cookie is secure (production)
- ✅ CSRF cookie has sameSite=strict

## Testing

### Manual Testing

```bash
# Should fail without CSRF token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Get CSRF token
curl http://localhost:3001/api/v1/auth/csrf --cookie-jar cookies.txt

# Should succeed with CSRF token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: <token>" \
  -d '{"email":"test@example.com","password":"test"}' \
  --cookie cookies.txt
```

### Integration Tests

```typescript
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test' })
      .expect(403);
  });

  it('should accept requests with valid CSRF token', async () => {
    const tokenResponse = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);

    const { csrfToken } = tokenResponse.body;

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-csrf-token', csrfToken)
      .send({ email: 'test@example.com', password: 'test' })
      .expect(200);
  });
});
```

## Known Limitations

### 1. csurf Deprecation

The `csurf` package is deprecated but still functional.

- **Risk**: Low (package is stable, no active vulnerabilities)
- **Mitigation**: Monitor for security advisories
- **Future**: Consider migrating to `csrf-csrf` if issues arise

### 2. Token Refresh

CSRF token is session-based, not explicitly rotated.

- **Risk**: Low (token tied to session, regenerated on new session)
- **Mitigation**: Session timeout enforces token rotation

## Alternative: csrf-csrf Package

If migration from `csurf` becomes necessary:

### Install

```bash
bun add csrf-csrf
bun remove csurf @types/csurf
```

### Configure

```typescript
import { doubleCsrf } from 'csrf-csrf';

const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: '__Host-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.body?.csrfToken,
});

app.use(doubleCsrfProtection);
```

## Threat Model

### Protected Against

- Cross-Site Request Forgery (CSRF)
- Session riding attacks
- Clickjacking (when combined with X-Frame-Options)

### NOT Protected Against

- XSS (use CSP, input validation, output encoding)
- Man-in-the-Middle (use HTTPS)
- Brute force (use rate limiting)

## Best Practices

1. **Strong CSRF Secret**: Generate with `openssl rand -base64 64`
2. **Rotate Periodically**: Quarterly secret rotation
3. **HTTPS Only**: Enable `secure: true` in production
4. **Token from Header**: Prefer `x-csrf-token` header over body
5. **Monitor Failures**: Log CSRF failures for security analysis

## See Also

- [Authentication Guide](../guides/authentication) - Complete auth setup
- [Frontend API Integration](../guides/frontend-api-integration) - API client patterns
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

**Last Updated**: 2025-10-11
**Status**: Production-ready, monitoring for csurf deprecation
