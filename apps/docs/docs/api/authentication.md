# Authentication API

JWT-based authentication with refresh token rotation.

## Endpoints

### POST /api/v1/auth/register

Create new user account.

**Request Body**:

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

**Response (201)**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "cm2abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active",
    "createdAt": "2025-10-11T10:00:00Z"
  }
}
```

**Rate Limit**: 3 per hour per IP

---

### POST /api/v1/auth/login

Authenticate with email/password.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cm2abc123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "expiresIn": 900
  }
}
```

**Cookies Set**:

- `accessToken` (HTTP-only, 15 minutes)
- `refreshToken` (HTTP-only, 7 days)

**Rate Limit**: 5 per minute per IP

**Errors**:

- 401: Invalid credentials or account locked

---

### POST /api/v1/auth/refresh

Refresh access token using refresh token cookie.

**Request**: No body required (uses cookie)

**Response (200)**:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "expiresIn": 900
  }
}
```

**Cookies Set**: New `accessToken` and `refreshToken` (token rotation)

**Rate Limit**: 10 per minute per user

**Errors**:

- 401: Invalid or expired refresh token

---

### GET /api/v1/auth/me

Get current authenticated user.

**Auth**: Required

**Response (200)**:

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "cm2abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91-9876543210",
    "roleId": "role-123",
    "tenantId": "tenant-123",
    "status": "active",
    "isDeleted": false,
    "lastLogin": "2025-10-11T09:00:00Z",
    "createdAt": "2025-10-10T10:00:00Z",
    "updatedAt": "2025-10-11T09:00:00Z",
    "role": {
      "id": "role-123",
      "name": "Staff",
      "permissions": ["appointments:read", "appointments:create"]
    },
    "tenant": {
      "id": "tenant-123",
      "name": "Salon XYZ"
    },
    "permissions": ["appointments:read", "appointments:create"]
  }
}
```

---

### POST /api/v1/auth/logout

Logout and revoke refresh token.

**Auth**: Required

**Response (200)**:

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Cookies**: Cleared (`accessToken`, `refreshToken`)

---

### POST /api/v1/auth/revoke-all

Revoke all refresh tokens (logout from all devices).

**Auth**: Required

**Response (200)**:

```json
{
  "success": true,
  "message": "All tokens revoked successfully",
  "data": {
    "revokedCount": 3
  }
}
```

---

### GET /api/v1/auth/csrf

Get CSRF token for state-changing operations.

**Response (200)**:

```json
{
  "success": true,
  "message": "CSRF token generated",
  "data": null
}
```

**Header**: `X-CSRF-Token: abc123...`

**Cookie**: `XSRF-TOKEN` (readable by JavaScript)

---

## Security Notes

- Passwords must be 8+ characters with uppercase, lowercase, number, special char
- Account locks after 5 failed login attempts for 15 minutes
- Tokens rotate on refresh (old token revoked)
- All tokens are HTTP-only cookies (not accessible to JavaScript)
- CSRF protection required for login/logout

---

**See Also**: [Authentication Architecture](../architecture/authentication.md)
