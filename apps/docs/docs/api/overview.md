# API Reference Overview

ftry provides a RESTful API built with NestJS, featuring JWT authentication, versioning, and comprehensive error handling.

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.ftry.com/api/v1
```

## Authentication

All protected endpoints require a valid JWT access token in an HTTP-only cookie.

### Obtaining Tokens

```bash
# Login to get tokens
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response sets HTTP-only cookies:
# - accessToken (15 minutes)
# - refreshToken (7 days)
```

### Using Authenticated Endpoints

Tokens are automatically sent via cookies. No manual `Authorization` header required.

```bash
# Example authenticated request
GET /api/v1/auth/me
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Versioning

ftry uses URI versioning for backward compatibility:

```
/api/v1/auth/login    # Version 1 (current)
/api/v2/auth/login    # Version 2 (future)
```

## Response Format

All responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2025-10-11T10:00:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error type",
  "statusCode": 400,
  "validationErrors": [
    // Optional, for validation failures
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2025-10-11T10:00:00Z"
}
```

## Status Codes

| Code | Meaning               | Usage                                   |
| ---- | --------------------- | --------------------------------------- |
| 200  | OK                    | Successful GET, PATCH, DELETE           |
| 201  | Created               | Successful POST (resource created)      |
| 400  | Bad Request           | Validation errors, malformed request    |
| 401  | Unauthorized          | Missing or invalid authentication       |
| 403  | Forbidden             | Insufficient permissions                |
| 404  | Not Found             | Resource doesn't exist                  |
| 409  | Conflict              | Duplicate resource (e.g., email exists) |
| 429  | Too Many Requests     | Rate limit exceeded                     |
| 500  | Internal Server Error | Server error                            |

## Rate Limiting

Different endpoints have different rate limits:

| Endpoint            | Limit        | Window   |
| ------------------- | ------------ | -------- |
| POST /auth/register | 3 requests   | 1 hour   |
| POST /auth/login    | 5 requests   | 1 minute |
| POST /auth/refresh  | 10 requests  | 1 minute |
| GET /admin/\*       | 100 requests | 1 minute |

**429 Response**:

```json
{
  "success": false,
  "message": "Too many requests",
  "statusCode": 429,
  "retryAfter": 60
}
```

## Pagination

List endpoints support pagination via query parameters:

```bash
GET /api/v1/admin/users?page=1&limit=50

# Response
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

## Filtering and Sorting

```bash
# Filter by status
GET /api/v1/admin/users?status=active

# Sort by email (ascending)
GET /api/v1/admin/users?sortBy=email&sortOrder=asc

# Combine
GET /api/v1/admin/users?status=active&sortBy=createdAt&sortOrder=desc
```

## CORS

CORS is configured for local development:

```
Allowed Origins:
- http://localhost:3000 (frontend dev server)

Allowed Methods: GET, POST, PATCH, DELETE, OPTIONS
Allowed Headers: Content-Type, Authorization
Credentials: true (allows cookies)
```

**Production**: Update `FRONTEND_URL` environment variable.

## CSRF Protection

State-changing operations (POST, PATCH, DELETE) require CSRF token:

```bash
# 1. Get CSRF token
GET /api/v1/auth/csrf

# Response header:
X-CSRF-Token: abc123...

# 2. Include token in subsequent requests
POST /api/v1/auth/login
X-CSRF-Token: abc123...
```

**Note**: Frontend handles CSRF automatically.

## Error Handling

### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400,
  "validationErrors": [
    {
      "field": "email",
      "message": "email must be an email"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 8 characters"
    }
  ]
}
```

### Authentication Errors (401)

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Permission Errors (403)

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "Forbidden",
  "statusCode": 403,
  "requiredPermissions": ["users:create:all"]
}
```

## API Endpoints

### Authentication

- [Authentication API](./authentication.md) - Login, register, token refresh

### Admin

- [Admin API](./admin.md) - User, role, permission, tenant CRUD

### Health

- [Health API](./health.md) - Service health checks

## Client Libraries

### JavaScript/TypeScript (TanStack Query)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch users
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/v1/admin/users').then((res) => res.json()),
});

// Create user
const { mutate } = useMutation({
  mutationFn: (data) =>
    fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
});
```

## Testing the API

### Using curl

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ftry.com","password":"Admin123!"}' \
  -c cookies.txt

# Use authenticated endpoint
curl http://localhost:3001/api/v1/auth/me \
  -b cookies.txt
```

### Using Postman

1. Create request to `/api/v1/auth/login`
2. Enable "Send cookies automatically" in settings
3. Login to get tokens in cookies
4. Subsequent requests use cookies automatically

## Next Steps

- [Authentication API](./authentication.md) - Detailed auth endpoints
- [Admin API](./admin.md) - CRUD endpoints
- [Architecture Overview](../architecture/overview.md) - System design

---

**API Version**: v1
**Last Updated**: 2025-10-11
**Base URL**: http://localhost:3001/api/v1 (dev)
