import { PrismaClient } from '@prisma/client';
import { ADMIN_PERMISSIONS } from './admin-permissions.seed';

/**
 * Admin Roles Seed
 *
 * Creates predefined system roles for the unified admin system:
 * - Super Admin (level 100) - Full system access
 * - Tenant Owner (level 90) - Full access within tenant
 * - Tenant Admin (level 80) - User and role management within tenant
 * - Tenant Manager (level 70) - Read-only tenant administration
 *
 * @see docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md
 */

// All admin permission names
const ALL_ADMIN_PERMISSIONS = Object.keys(ADMIN_PERMISSIONS);

// System role definitions
export const SYSTEM_ADMIN_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access across all tenants',
    type: 'system',
    level: 100,
    tenantId: null,
    permissions: ALL_ADMIN_PERMISSIONS, // All permissions
    isSystem: true,
    isDefault: false,
  },

  TENANT_OWNER: {
    name: 'Tenant Owner',
    description: 'Full access within tenant',
    type: 'tenant',
    level: 90,
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
    ],
    isSystem: true,
    isDefault: false,
  },

  TENANT_ADMIN: {
    name: 'Tenant Admin',
    description: 'User and role management within tenant',
    type: 'tenant',
    level: 80,
    permissions: [
      'users:create:own',
      'users:read:own',
      'users:update:own',
      'roles:read:own',
      'permissions:read',
      'audit:read:own',
    ],
    isSystem: true,
    isDefault: false,
  },

  TENANT_MANAGER: {
    name: 'Tenant Manager',
    description: 'Read-only access to tenant administration',
    type: 'tenant',
    level: 70,
    permissions: ['users:read:own', 'roles:read:own', 'permissions:read', 'audit:read:own'],
    isSystem: true,
    isDefault: false,
  },
};

/**
 * Seed admin roles to database
 * @param prisma - PrismaClient instance
 */
export async function seedAdminRoles(prisma: PrismaClient): Promise<void> {
  console.log('👥 Seeding admin roles...');

  for (const [key, roleData] of Object.entries(SYSTEM_ADMIN_ROLES)) {
    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        name: roleData.name,
        tenantId: roleData.tenantId,
      },
    });

    if (existingRole) {
      // Update existing role (keep permissions in sync)
      await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          description: roleData.description,
          type: roleData.type,
          level: roleData.level,
          permissions: roleData.permissions,
          isSystem: roleData.isSystem,
          isDefault: roleData.isDefault,
        },
      });
      console.log(`   ✅ Updated role: ${roleData.name} (level ${roleData.level})`);
    } else {
      // Create new role
      await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          type: roleData.type,
          level: roleData.level,
          tenantId: roleData.tenantId,
          permissions: roleData.permissions,
          isSystem: roleData.isSystem,
          isDefault: roleData.isDefault,
        },
      });
      console.log(`   ✅ Created role: ${roleData.name} (level ${roleData.level})`);
    }
  }

  const roleCount = Object.keys(SYSTEM_ADMIN_ROLES).length;
  console.log(`✅ Seeded ${roleCount} admin roles`);
}
