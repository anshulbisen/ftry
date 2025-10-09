/**
 * Admin Permission Constants
 *
 * Defines all available admin permissions in the system.
 * Permission format: resource:action:scope
 *
 * Scopes:
 * - :all = Super admin access across all tenants
 * - :own = Tenant-scoped access (own tenant only)
 * - No scope = General permission (context-dependent)
 */

export const ADMIN_PERMISSIONS = {
  // Tenant Management
  'tenants:create': 'Create new tenants',
  'tenants:read:all': 'View all tenants',
  'tenants:read:own': 'View own tenant',
  'tenants:update:all': 'Update any tenant',
  'tenants:update:own': 'Update own tenant',
  'tenants:delete': 'Delete tenants',
  'tenants:suspend': 'Suspend tenants',

  // User Management
  'users:create:all': 'Create users in any tenant',
  'users:create:own': 'Create users in own tenant',
  'users:read:all': 'View all users across tenants',
  'users:read:own': 'View users in own tenant',
  'users:update:all': 'Update any user',
  'users:update:own': 'Update users in own tenant',
  'users:delete:all': 'Delete any user',
  'users:delete:own': 'Delete users in own tenant',

  // Role Management
  'roles:create:system': 'Create system-wide roles',
  'roles:create:tenant': 'Create tenant-specific roles',
  'roles:read:all': 'View all roles',
  'roles:read:own': 'View tenant roles',
  'roles:update:system': 'Update system roles',
  'roles:update:tenant': 'Update tenant roles',
  'roles:delete': 'Delete roles',

  // Permission Management
  'permissions:manage': 'Manage system permissions',
  'permissions:assign': 'Assign permissions to roles',
  'permissions:read': 'View available permissions',

  // System Operations
  'system:config': 'System configuration',
  'system:maintenance': 'Maintenance mode',
  'audit:read:all': 'View all audit logs',
  'audit:read:own': 'View own tenant audit logs',
  'impersonate:any': 'Impersonate any user',
  'impersonate:own': 'Impersonate users in own tenant',
} as const;

export type AdminPermission = keyof typeof ADMIN_PERMISSIONS;

/**
 * Predefined System Roles
 *
 * These roles are seeded in the database during initial setup.
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access',
    type: 'system' as const,
    tenantId: null,
    permissions: Object.keys(ADMIN_PERMISSIONS) as AdminPermission[],
  },

  TENANT_OWNER: {
    name: 'Tenant Owner',
    description: 'Full access within tenant',
    type: 'tenant' as const,
    permissions: [
      'tenants:read:own',
      'tenants:update:own',
      'users:create:own',
      'users:read:own',
      'users:update:own',
      'users:delete:own',
      'roles:create:tenant',
      'roles:read:own',
      'roles:update:tenant',
      'permissions:read',
      'audit:read:own',
      'impersonate:own',
    ] as AdminPermission[],
  },

  TENANT_ADMIN: {
    name: 'Tenant Admin',
    description: 'User and role management within tenant',
    type: 'tenant' as const,
    permissions: [
      'users:create:own',
      'users:read:own',
      'users:update:own',
      'roles:read:own',
      'permissions:read',
      'audit:read:own',
    ] as AdminPermission[],
  },

  TENANT_MANAGER: {
    name: 'Tenant Manager',
    description: 'Read-only access to tenant administration',
    type: 'tenant' as const,
    permissions: [
      'users:read:own',
      'roles:read:own',
      'permissions:read',
      'audit:read:own',
    ] as AdminPermission[],
  },
} as const;

export type SystemRoleName = keyof typeof SYSTEM_ROLES;
