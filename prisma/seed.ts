import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * FULLY CONSOLIDATED SEED FILE - Single Source of Truth
 *
 * This file creates a consistent, non-duplicative data structure:
 * 1. ALL permissions (admin + tenant) in one place
 * 2. System roles with consistent naming
 * 3. Demo tenants and users (development only)
 *
 * Single password configuration: DEMO_PASSWORD env var
 */

// ==================== ALL PERMISSIONS (UNIFIED) ====================
const ALL_PERMISSIONS = [
  // ========== ADMIN PERMISSIONS (Cross-tenant administration) ==========
  // Tenant Management
  {
    name: 'tenants:create',
    resource: 'tenants',
    action: 'create',
    category: 'admin',
    description: 'Create new tenants',
    isSystem: true,
  },
  {
    name: 'tenants:read:all',
    resource: 'tenants',
    action: 'read:all',
    category: 'admin',
    description: 'View all tenants (Super admin)',
    isSystem: true,
  },
  {
    name: 'tenants:read:own',
    resource: 'tenants',
    action: 'read:own',
    category: 'admin',
    description: 'View own tenant',
    isSystem: true,
  },
  {
    name: 'tenants:update:all',
    resource: 'tenants',
    action: 'update:all',
    category: 'admin',
    description: 'Update any tenant',
    isSystem: true,
  },
  {
    name: 'tenants:update:own',
    resource: 'tenants',
    action: 'update:own',
    category: 'admin',
    description: 'Update own tenant',
    isSystem: true,
  },
  {
    name: 'tenants:delete',
    resource: 'tenants',
    action: 'delete',
    category: 'admin',
    description: 'Delete tenants',
    isSystem: true,
  },

  // User Management (Admin)
  {
    name: 'users:create:all',
    resource: 'users',
    action: 'create:all',
    category: 'admin',
    description: 'Create users in any tenant',
    isSystem: true,
  },
  {
    name: 'users:create:own',
    resource: 'users',
    action: 'create:own',
    category: 'admin',
    description: 'Create users in own tenant',
    isSystem: true,
  },
  {
    name: 'users:read:all',
    resource: 'users',
    action: 'read:all',
    category: 'admin',
    description: 'View all users across tenants',
    isSystem: true,
  },
  {
    name: 'users:read:own',
    resource: 'users',
    action: 'read:own',
    category: 'admin',
    description: 'View users in own tenant',
    isSystem: true,
  },
  {
    name: 'users:update:all',
    resource: 'users',
    action: 'update:all',
    category: 'admin',
    description: 'Update any user',
    isSystem: true,
  },
  {
    name: 'users:update:own',
    resource: 'users',
    action: 'update:own',
    category: 'admin',
    description: 'Update users in own tenant',
    isSystem: true,
  },
  {
    name: 'users:delete:all',
    resource: 'users',
    action: 'delete:all',
    category: 'admin',
    description: 'Delete any user',
    isSystem: true,
  },
  {
    name: 'users:delete:own',
    resource: 'users',
    action: 'delete:own',
    category: 'admin',
    description: 'Delete users in own tenant',
    isSystem: true,
  },

  // Role Management (Admin)
  {
    name: 'roles:create:system',
    resource: 'roles',
    action: 'create:system',
    category: 'admin',
    description: 'Create system-wide roles',
    isSystem: true,
  },
  {
    name: 'roles:create:tenant',
    resource: 'roles',
    action: 'create:tenant',
    category: 'admin',
    description: 'Create tenant-specific roles',
    isSystem: true,
  },
  {
    name: 'roles:read:all',
    resource: 'roles',
    action: 'read:all',
    category: 'admin',
    description: 'View all roles',
    isSystem: true,
  },
  {
    name: 'roles:read:own',
    resource: 'roles',
    action: 'read:own',
    category: 'admin',
    description: 'View tenant roles',
    isSystem: true,
  },
  {
    name: 'roles:update:system',
    resource: 'roles',
    action: 'update:system',
    category: 'admin',
    description: 'Update system roles',
    isSystem: true,
  },
  {
    name: 'roles:update:tenant',
    resource: 'roles',
    action: 'update:tenant',
    category: 'admin',
    description: 'Update tenant roles',
    isSystem: true,
  },
  {
    name: 'roles:delete',
    resource: 'roles',
    action: 'delete',
    category: 'admin',
    description: 'Delete roles',
    isSystem: true,
  },

  // Permission Management (Admin)
  {
    name: 'permissions:manage',
    resource: 'permissions',
    action: 'manage',
    category: 'admin',
    description: 'Manage system permissions',
    isSystem: true,
  },
  {
    name: 'permissions:assign',
    resource: 'permissions',
    action: 'assign',
    category: 'admin',
    description: 'Assign permissions to roles',
    isSystem: true,
  },
  {
    name: 'permissions:read',
    resource: 'permissions',
    action: 'read',
    category: 'admin',
    description: 'View available permissions',
    isSystem: true,
  },

  // System Operations (Admin)
  {
    name: 'system:config',
    resource: 'system',
    action: 'config',
    category: 'admin',
    description: 'System configuration',
    isSystem: true,
  },
  {
    name: 'system:maintenance',
    resource: 'system',
    action: 'maintenance',
    category: 'admin',
    description: 'Maintenance mode',
    isSystem: true,
  },
  {
    name: 'audit:read:all',
    resource: 'audit',
    action: 'read:all',
    category: 'admin',
    description: 'View all audit logs',
    isSystem: true,
  },
  {
    name: 'audit:read:own',
    resource: 'audit',
    action: 'read:own',
    category: 'admin',
    description: 'View own tenant audit logs',
    isSystem: true,
  },
  {
    name: 'impersonate:any',
    resource: 'impersonate',
    action: 'any',
    category: 'admin',
    description: 'Impersonate any user',
    isSystem: true,
  },
  {
    name: 'impersonate:own',
    resource: 'impersonate',
    action: 'own',
    category: 'admin',
    description: 'Impersonate users in own tenant',
    isSystem: true,
  },

  // ========== TENANT PERMISSIONS (Within-tenant operations) ==========
  // Appointments
  {
    name: 'appointments:create',
    resource: 'appointments',
    action: 'create',
    category: 'appointments',
    description: 'Create new appointments',
  },
  {
    name: 'appointments:read',
    resource: 'appointments',
    action: 'read',
    category: 'appointments',
    description: 'View appointments',
  },
  {
    name: 'appointments:update',
    resource: 'appointments',
    action: 'update',
    category: 'appointments',
    description: 'Update appointments',
  },
  {
    name: 'appointments:delete',
    resource: 'appointments',
    action: 'delete',
    category: 'appointments',
    description: 'Delete appointments',
  },

  // Clients
  {
    name: 'clients:create',
    resource: 'clients',
    action: 'create',
    category: 'clients',
    description: 'Create new clients',
  },
  {
    name: 'clients:read',
    resource: 'clients',
    action: 'read',
    category: 'clients',
    description: 'View client information',
  },
  {
    name: 'clients:update',
    resource: 'clients',
    action: 'update',
    category: 'clients',
    description: 'Update client information',
  },
  {
    name: 'clients:delete',
    resource: 'clients',
    action: 'delete',
    category: 'clients',
    description: 'Delete clients',
  },

  // Billing
  {
    name: 'billing:create',
    resource: 'billing',
    action: 'create',
    category: 'billing',
    description: 'Create invoices and bills',
  },
  {
    name: 'billing:read',
    resource: 'billing',
    action: 'read',
    category: 'billing',
    description: 'View billing information',
  },
  {
    name: 'billing:update',
    resource: 'billing',
    action: 'update',
    category: 'billing',
    description: 'Update billing information',
  },
  {
    name: 'billing:delete',
    resource: 'billing',
    action: 'delete',
    category: 'billing',
    description: 'Delete invoices',
  },

  // Staff
  {
    name: 'staff:create',
    resource: 'staff',
    action: 'create',
    category: 'staff',
    description: 'Create new staff members',
  },
  {
    name: 'staff:read',
    resource: 'staff',
    action: 'read',
    category: 'staff',
    description: 'View staff information',
  },
  {
    name: 'staff:update',
    resource: 'staff',
    action: 'update',
    category: 'staff',
    description: 'Update staff information',
  },
  {
    name: 'staff:delete',
    resource: 'staff',
    action: 'delete',
    category: 'staff',
    description: 'Delete staff members',
  },

  // Reports
  {
    name: 'reports:read',
    resource: 'reports',
    action: 'read',
    category: 'reports',
    description: 'View reports and analytics',
  },
  {
    name: 'reports:export',
    resource: 'reports',
    action: 'export',
    category: 'reports',
    description: 'Export reports',
  },

  // Settings
  {
    name: 'settings:read',
    resource: 'settings',
    action: 'read',
    category: 'settings',
    description: 'View salon settings',
  },
  {
    name: 'settings:update',
    resource: 'settings',
    action: 'update',
    category: 'settings',
    description: 'Update salon settings',
  },
];

// Get permission names by category for role assignment
const getPermissionsByCategory = (category: string) =>
  ALL_PERMISSIONS.filter((p) => p.category === category).map((p) => p.name);

const getPermissionsByPattern = (pattern: string) =>
  ALL_PERMISSIONS.filter((p) => p.name.includes(pattern)).map((p) => p.name);

const allPermissionNames = ALL_PERMISSIONS.map((p) => p.name);
const allAdminPermissions = getPermissionsByCategory('admin');
const allTenantPermissions = ALL_PERMISSIONS.filter((p) => p.category !== 'admin').map(
  (p) => p.name,
);

// ==================== SYSTEM ROLES (UNIFIED) ====================
const SYSTEM_ROLES = [
  {
    name: 'Super Admin',
    description: 'Full system access across all tenants',
    type: 'system',
    level: 100,
    isSystem: true,
    isDefault: false,
    permissions: allPermissionNames, // ALL permissions
  },
  {
    name: 'Tenant Owner',
    description: 'Full access within tenant (salon owner)',
    type: 'tenant',
    level: 90,
    isSystem: true,
    isDefault: false,
    permissions: [
      // Admin permissions (scoped to own tenant)
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
      // All tenant permissions
      ...allTenantPermissions,
    ],
  },
  {
    name: 'Tenant Admin',
    description: 'Salon manager with administrative access',
    type: 'tenant',
    level: 80,
    isSystem: true,
    isDefault: false,
    permissions: [
      // Admin permissions (limited)
      'users:create:own',
      'users:read:own',
      'users:update:own',
      'roles:read:own',
      'permissions:read',
      'audit:read:own',
      // Tenant permissions (all except settings)
      ...allTenantPermissions.filter((p) => !p.startsWith('settings:')),
    ],
  },
  {
    name: 'Staff',
    description: 'Salon staff member with operational access',
    type: 'tenant',
    level: 50,
    isSystem: true,
    isDefault: true, // Default role for new users
    permissions: [
      'appointments:create',
      'appointments:read',
      'appointments:update',
      'clients:create',
      'clients:read',
      'clients:update',
      'billing:create',
      'billing:read',
      'staff:read',
    ],
  },
  {
    name: 'Receptionist',
    description: 'Front desk staff with limited access',
    type: 'tenant',
    level: 30,
    isSystem: true,
    isDefault: false,
    permissions: [
      'appointments:create',
      'appointments:read',
      'appointments:update',
      'clients:read',
      'billing:read',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database with consistent data...');

  // Clear existing data (development only)
  if (process.env['NODE_ENV'] === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.tenant.deleteMany();
  }

  // ==================== CREATE ALL PERMISSIONS ====================
  console.log('📝 Creating permissions...');
  for (const permission of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log(`✅ Created ${ALL_PERMISSIONS.length} permissions (admin + tenant)`);

  // ==================== CREATE SYSTEM ROLES ====================
  console.log('👥 Creating system roles...');
  const createdRoles: Record<string, any> = {};

  for (const roleData of SYSTEM_ROLES) {
    let role = await prisma.role.findFirst({
      where: {
        name: roleData.name,
        tenantId: null,
      },
    });

    if (role) {
      role = await prisma.role.update({
        where: { id: role.id },
        data: {
          description: roleData.description,
          type: roleData.type,
          level: roleData.level,
          permissions: roleData.permissions,
          isSystem: roleData.isSystem,
          isDefault: roleData.isDefault,
        },
      });
      console.log(
        `   ✅ Updated: ${roleData.name} (level ${roleData.level}, ${roleData.permissions.length} permissions)`,
      );
    } else {
      role = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          type: roleData.type,
          level: roleData.level,
          tenantId: null,
          isSystem: roleData.isSystem,
          isDefault: roleData.isDefault,
          permissions: roleData.permissions,
        },
      });
      console.log(
        `   ✅ Created: ${roleData.name} (level ${roleData.level}, ${roleData.permissions.length} permissions)`,
      );
    }

    createdRoles[roleData.name] = role;
  }

  // ==================== CREATE SUPER ADMIN ====================
  console.log('👤 Creating super admin user...');
  const demoPassword = process.env['DEMO_PASSWORD'] || 'DevPassword123!@#';

  if (process.env['NODE_ENV'] === 'production' && demoPassword === 'DevPassword123!@#') {
    throw new Error(
      'SECURITY ERROR: DEMO_PASSWORD environment variable must be set in production!',
    );
  }

  const hashedPassword = await bcrypt.hash(demoPassword, 12);

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: 'super@ftry.com' },
  });

  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        email: 'super@ftry.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        tenantId: null,
        roleId: createdRoles['Super Admin'].id,
        emailVerified: true,
        status: 'active',
      },
    });
    console.log('   ✅ Created: super@ftry.com');
  } else {
    console.log('   ⚠️  Already exists: super@ftry.com');
  }

  // ==================== CREATE DEMO DATA ====================
  if (process.env['NODE_ENV'] === 'development') {
    console.log('🏢 Creating demo tenants...');

    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Glamour Salon & Spa',
        slug: 'glamour-salon',
        description: 'Premium beauty salon in Koregaon Park, Pune',
        subscriptionPlan: 'premium',
        maxUsers: 50,
        settings: {
          businessHours: {
            monday: { open: '09:00', close: '20:00' },
            tuesday: { open: '09:00', close: '20:00' },
            wednesday: { open: '09:00', close: '20:00' },
            thursday: { open: '09:00', close: '20:00' },
            friday: { open: '09:00', close: '20:00' },
            saturday: { open: '09:00', close: '18:00' },
            sunday: { open: '10:00', close: '17:00' },
          },
          currency: 'INR',
          timeZone: 'Asia/Kolkata',
        },
      },
    });

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Elegance Beauty Studio',
        slug: 'elegance-beauty',
        description: 'Modern beauty studio in Viman Nagar, Pune',
        subscriptionPlan: 'basic',
        maxUsers: 20,
        settings: {
          businessHours: {
            monday: { open: '10:00', close: '19:00' },
            tuesday: { open: '10:00', close: '19:00' },
            wednesday: { open: '10:00', close: '19:00' },
            thursday: { open: '10:00', close: '19:00' },
            friday: { open: '10:00', close: '19:00' },
            saturday: { open: '10:00', close: '20:00' },
            sunday: { closed: true },
          },
          currency: 'INR',
          timeZone: 'Asia/Kolkata',
        },
      },
    });

    console.log('👤 Creating demo users...');

    // Tenant 1 - Glamour Salon
    const tenant1Owner = await prisma.user.create({
      data: {
        email: 'admin@glamour.com',
        password: hashedPassword,
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+919876543210',
        tenantId: tenant1.id,
        roleId: createdRoles['Tenant Owner'].id,
        emailVerified: true,
        status: 'active',
      },
    });

    await prisma.user.create({
      data: {
        email: 'manager@glamour.com',
        password: hashedPassword,
        firstName: 'Rahul',
        lastName: 'Verma',
        phone: '+919876543211',
        tenantId: tenant1.id,
        roleId: createdRoles['Tenant Admin'].id,
        emailVerified: true,
        status: 'active',
        createdBy: tenant1Owner.id,
      },
    });

    await prisma.user.create({
      data: {
        email: 'staff@glamour.com',
        password: hashedPassword,
        firstName: 'Sneha',
        lastName: 'Desai',
        phone: '+919876543212',
        tenantId: tenant1.id,
        roleId: createdRoles['Staff'].id,
        emailVerified: true,
        status: 'active',
        createdBy: tenant1Owner.id,
      },
    });

    // Tenant 2 - Elegance Beauty
    const tenant2Owner = await prisma.user.create({
      data: {
        email: 'admin@elegance.com',
        password: hashedPassword,
        firstName: 'Anita',
        lastName: 'Patel',
        phone: '+919876543220',
        tenantId: tenant2.id,
        roleId: createdRoles['Tenant Owner'].id,
        emailVerified: true,
        status: 'active',
      },
    });

    await prisma.user.create({
      data: {
        email: 'manager@elegance.com',
        password: hashedPassword,
        firstName: 'Vikram',
        lastName: 'Singh',
        phone: '+919876543221',
        tenantId: tenant2.id,
        roleId: createdRoles['Tenant Admin'].id,
        emailVerified: true,
        status: 'active',
        createdBy: tenant2Owner.id,
      },
    });

    await prisma.user.create({
      data: {
        email: 'reception@elegance.com',
        password: hashedPassword,
        firstName: 'Meera',
        lastName: 'Kumar',
        phone: '+919876543222',
        tenantId: tenant2.id,
        roleId: createdRoles['Receptionist'].id,
        emailVerified: true,
        status: 'active',
        createdBy: tenant2Owner.id,
      },
    });

    console.log('\n✅ Demo data created!');
    console.log('\n🔐 Login Credentials (all use same password):');
    console.log('='.repeat(70));
    console.log('\n🦸 SUPER ADMIN (Access ALL tenants):');
    console.log(`   📧 super@ftry.com`);
    console.log('\n💅 TENANT 1 - Glamour Salon & Spa:');
    console.log(`   👑 Owner: admin@glamour.com`);
    console.log(`   👔 Manager: manager@glamour.com`);
    console.log(`   💼 Staff: staff@glamour.com`);
    console.log('\n✨ TENANT 2 - Elegance Beauty Studio:');
    console.log(`   👑 Owner: admin@elegance.com`);
    console.log(`   👔 Manager: manager@elegance.com`);
    console.log(`   📞 Receptionist: reception@elegance.com`);
    console.log(`\n🔑 Password for ALL accounts: ${demoPassword}`);
    console.log('\n📝 Notes:');
    console.log('   • Users can only access their own tenant data');
    console.log('   • Super admin sees all tenants');
    console.log('   • Set DEMO_PASSWORD env var to customize');
    console.log('='.repeat(70));
  }

  console.log('\n✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
