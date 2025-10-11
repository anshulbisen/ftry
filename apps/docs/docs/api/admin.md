# Admin API

CRUD operations for users, roles, permissions, and tenants with automatic tenant scoping.

## Users

Base path: `/api/v1/admin/users`

### GET /admin/users

List users (tenant-scoped).

**Auth**: Required
**Permissions**: `users:read:all` OR `users:read:own`

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)
- `status` (string): Filter by status (`active`, `inactive`, `suspended`)
- `search` (string): Search by email or name

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cm2abc123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "active",
        "role": {
          "id": "role-123",
          "name": "Staff"
        },
        "tenant": {
          "id": "tenant-123",
          "name": "Salon XYZ"
        },
        "createdAt": "2025-10-10T10:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

---

### GET /admin/users/:id

Get single user by ID.

**Auth**: Required
**Permissions**: `users:read:all` OR `users:read:own`

**Response (200)**: Same as list item

**Errors**:

- 404: User not found or not in your tenant

---

### POST /admin/users

Create new user.

**Auth**: Required
**Permissions**: `users:create:all` OR `users:create:own`

**Request Body**:

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+91-9876543210",
  "roleId": "role-123",
  "tenantId": "tenant-123" // Optional, defaults to current user's tenant
}
```

**Response (201)**: User object

---

### PATCH /admin/users/:id

Update user.

**Auth**: Required
**Permissions**: `users:update:all` OR `users:update:own`

**Request Body** (all fields optional):

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+91-1234567890",
  "roleId": "role-456",
  "status": "active"
}
```

**Response (200)**: Updated user object

---

### DELETE /admin/users/:id

Soft delete user.

**Auth**: Required
**Permissions**: `users:delete:all` OR `users:delete:own`

**Response (200)**:

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

---

## Roles

Base path: `/api/v1/admin/roles`

### GET /admin/roles

List roles (tenant-scoped).

**Auth**: Required
**Permissions**: `roles:read:all` OR `roles:read:own`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "role-123",
        "name": "Staff",
        "description": "Staff members",
        "type": "custom",
        "permissions": ["appointments:read", "appointments:create"],
        "tenantId": "tenant-123",
        "isSystem": false,
        "status": "active"
      }
    ]
  }
}
```

### POST /admin/roles

Create new role.

**Auth**: Required
**Permissions**: `roles:create:all` OR `roles:create:own`

**Request Body**:

```json
{
  "name": "Receptionist",
  "description": "Front desk staff",
  "permissions": ["appointments:read", "clients:read"],
  "tenantId": "tenant-123" // Optional
}
```

---

## Permissions

Base path: `/api/v1/admin/permissions`

### GET /admin/permissions

List all available permissions.

**Auth**: Required
**Permissions**: `permissions:read`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "perm-123",
        "name": "users:read:all",
        "description": "Read all users across all tenants",
        "resource": "users",
        "action": "read",
        "category": "User Management",
        "isSystem": true
      }
    ]
  }
}
```

**Note**: Permissions are read-only (seeded from database).

---

## Tenants

Base path: `/api/v1/admin/tenants`

### GET /admin/tenants

List tenants (super admin only).

**Auth**: Required
**Permissions**: `tenants:read:all`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "tenant-123",
        "name": "Salon XYZ",
        "slug": "salon-xyz",
        "description": "Premier salon in Pune",
        "logo": "https://cdn.example.com/logo.png",
        "website": "https://salon-xyz.com",
        "subscriptionPlan": "premium",
        "subscriptionStatus": "active",
        "subscriptionExpiry": "2026-01-01T00:00:00Z",
        "maxUsers": 50,
        "settings": {
          "timezone": "Asia/Kolkata",
          "currency": "INR"
        },
        "metadata": {
          "onboardedAt": "2025-01-01T00:00:00Z"
        },
        "status": "active",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### POST /admin/tenants

Create new tenant (super admin only).

**Auth**: Required
**Permissions**: `tenants:create:all`

**Request Body**:

```json
{
  "name": "Spa ABC",
  "slug": "spa-abc",
  "description": "Luxury spa in Pune",
  "website": "https://spa-abc.com",
  "subscriptionPlan": "basic",
  "subscriptionStatus": "active",
  "maxUsers": 10,
  "settings": {
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "language": "en"
  },
  "metadata": {
    "industry": "spa",
    "location": "Pune"
  }
}
```

---

## Permission Scoping

### Super Admin (tenantId = null)

- Sees all users, roles, tenants across all tenants
- Has `*:*:all` permissions

### Tenant Admin

- Sees only users/roles in their tenant
- Has `*:*:own` permissions

### Regular User

- Limited read permissions
- Cannot create/update/delete

---

**See Also**: [Admin CRUD Architecture](../architecture/admin-crud.md)
