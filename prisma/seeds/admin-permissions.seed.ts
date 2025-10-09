import { PrismaClient } from '@prisma/client';

/**
 * Admin Permissions Seed
 *
 * Seeds all administrative permissions for the unified admin system.
 * Permissions follow the format: resource:action:scope
 *
 * @see docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md
 */

// Admin permissions as defined in the implementation plan
export const ADMIN_PERMISSIONS = {
  // ==================== TENANT MANAGEMENT ====================
  'tenants:create': 'Create new tenants',
  'tenants:read:all': 'View all tenants (Super admin)',
  'tenants:read:own': 'View own tenant (Tenant admin)',
  'tenants:update:all': 'Update any tenant',
  'tenants:update:own': 'Update own tenant',
  'tenants:delete': 'Delete tenants',
  'tenants:suspend': 'Suspend tenants',

  // ==================== USER MANAGEMENT ====================
  'users:create:all': 'Create users in any tenant',
  'users:create:own': 'Create users in own tenant',
  'users:read:all': 'View all users across tenants',
  'users:read:own': 'View users in own tenant',
  'users:update:all': 'Update any user',
  'users:update:own': 'Update users in own tenant',
  'users:delete:all': 'Delete any user',
  'users:delete:own': 'Delete users in own tenant',

  // ==================== ROLE MANAGEMENT ====================
  'roles:create:system': 'Create system-wide roles',
  'roles:create:tenant': 'Create tenant-specific roles',
  'roles:read:all': 'View all roles',
  'roles:read:own': 'View tenant roles',
  'roles:update:system': 'Update system roles',
  'roles:update:tenant': 'Update tenant roles',
  'roles:delete': 'Delete roles',

  // ==================== PERMISSION MANAGEMENT ====================
  'permissions:manage': 'Manage system permissions',
  'permissions:assign': 'Assign permissions to roles',
  'permissions:read': 'View available permissions',

  // ==================== SYSTEM OPERATIONS ====================
  'system:config': 'System configuration',
  'system:maintenance': 'Maintenance mode',
  'audit:read:all': 'View all audit logs',
  'audit:read:own': 'View own tenant audit logs',
  'impersonate:any': 'Impersonate any user',
  'impersonate:own': 'Impersonate users in own tenant',
};

/**
 * Seed admin permissions to database
 * @param prisma - PrismaClient instance
 */
export async function seedAdminPermissions(prisma: PrismaClient): Promise<void> {
  console.log('📝 Seeding admin permissions...');

  const permissionEntries = Object.entries(ADMIN_PERMISSIONS).map(([name, description]) => {
    // Parse permission structure: resource:action:scope
    const parts = name.split(':');
    const resource = parts[0];
    const action = parts.slice(1).join(':'); // Handle multi-part actions like "read:all"

    return {
      name,
      description,
      resource,
      action,
      category: 'admin', // All admin permissions belong to 'admin' category
      isSystem: true, // System-defined, cannot be deleted
    };
  });

  // Use createMany with skipDuplicates for idempotency
  const result = await prisma.permission.createMany({
    data: permissionEntries,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${result.count} admin permissions (skipped duplicates)`);
}
