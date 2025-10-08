import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// System permissions - these are all available permissions in the system
const SYSTEM_PERMISSIONS = [
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

// System roles with their permissions
const SYSTEM_ROLES = [
  {
    name: 'super_admin',
    description: 'Super administrator with full system access',
    type: 'system',
    level: 100,
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map((p) => p.name), // All permissions
  },
  {
    name: 'tenant_owner',
    description: 'Salon owner with full access to their tenant',
    type: 'system',
    level: 90,
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map((p) => p.name), // All permissions within tenant
  },
  {
    name: 'tenant_admin',
    description: 'Salon manager with administrative access',
    type: 'system',
    level: 80,
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter((p) => !p.name.startsWith('settings:')).map(
      (p) => p.name,
    ), // All except settings
  },
  {
    name: 'staff',
    description: 'Salon staff member with operational access',
    type: 'system',
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
    name: 'receptionist',
    description: 'Front desk staff with limited access',
    type: 'system',
    level: 30,
    isSystem: true,
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
  console.log('🌱 Seeding database...');

  // Clear existing data (for development only)
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

  // Create permissions
  console.log('📝 Creating permissions...');
  for (const permission of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create system roles
  console.log('👥 Creating system roles...');
  const roles: Record<string, any> = {};
  for (const roleData of SYSTEM_ROLES) {
    // Check if role already exists
    let role = await prisma.role.findFirst({
      where: {
        name: roleData.name,
        tenantId: null,
      },
    });

    if (role) {
      // Update existing role
      role = await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: roleData.permissions,
          description: roleData.description,
        },
      });
    } else {
      // Create new role
      role = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          type: roleData.type,
          level: roleData.level,
          isSystem: roleData.isSystem,
          isDefault: roleData.isDefault || false,
          permissions: roleData.permissions,
        },
      });
    }
    roles[roleData.name] = role;
  }

  // Create demo tenants and users (for development)
  if (process.env['NODE_ENV'] === 'development') {
    console.log('🏢 Creating demo tenants...');

    // Create Tenant 1 - Glamour Salon
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Glamour Salon & Spa',
        slug: 'glamour-salon',
        description: 'Premium beauty salon in Koregaon Park',
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

    // Create Tenant 2 - Elegance Beauty
    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Elegance Beauty Studio',
        slug: 'elegance-beauty',
        description: 'Modern beauty studio in Viman Nagar',
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
    // Use environment variable for demo password, fallback to secure default
    const demoPassword = process.env['DEMO_PASSWORD'] || 'DevPassword123!@#';
    const hashedPassword = await bcrypt.hash(demoPassword, 12);

    // Super Admin (no tenant) - can access everything
    await prisma.user.create({
      data: {
        email: 'super@ftry.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: roles['super_admin'].id,
        emailVerified: true,
      },
    });

    // ========== TENANT 1 USERS - Glamour Salon ==========

    // Tenant 1 Owner (Admin)
    const tenant1Owner = await prisma.user.create({
      data: {
        email: 'admin@glamour.com',
        password: hashedPassword,
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+919876543210',
        tenantId: tenant1.id,
        roleId: roles['tenant_owner'].id,
        emailVerified: true,
      },
    });

    // Tenant 1 Manager
    await prisma.user.create({
      data: {
        email: 'manager@glamour.com',
        password: hashedPassword,
        firstName: 'Rahul',
        lastName: 'Verma',
        phone: '+919876543211',
        tenantId: tenant1.id,
        roleId: roles['tenant_admin'].id,
        emailVerified: true,
        createdBy: tenant1Owner.id,
      },
    });

    // ========== TENANT 2 USERS - Elegance Beauty ==========

    // Tenant 2 Owner (Admin)
    const tenant2Owner = await prisma.user.create({
      data: {
        email: 'admin@elegance.com',
        password: hashedPassword,
        firstName: 'Anita',
        lastName: 'Patel',
        phone: '+919876543220',
        tenantId: tenant2.id,
        roleId: roles['tenant_owner'].id,
        emailVerified: true,
      },
    });

    // Tenant 2 Manager
    await prisma.user.create({
      data: {
        email: 'manager@elegance.com',
        password: hashedPassword,
        firstName: 'Vikram',
        lastName: 'Singh',
        phone: '+919876543221',
        tenantId: tenant2.id,
        roleId: roles['tenant_admin'].id,
        emailVerified: true,
        createdBy: tenant2Owner.id,
      },
    });

    console.log('✅ Demo data created:');
    console.log('\n🔐 Super Admin (Access to ALL tenants):');
    console.log(`   super@ftry.com / ${demoPassword}`);

    console.log('\n💅 Tenant 1 - Glamour Salon:');
    console.log(`   Admin: admin@glamour.com / ${demoPassword}`);
    console.log(`   Manager: manager@glamour.com / ${demoPassword}`);

    console.log('\n✨ Tenant 2 - Elegance Beauty:');
    console.log(`   Admin: admin@elegance.com / ${demoPassword}`);
    console.log(`   Manager: manager@elegance.com / ${demoPassword}`);

    console.log('\n📝 Notes:');
    console.log("   - Each tenant's users can only see their own tenant's data");
    console.log('   - Super admin can see and manage all tenants');
    console.log(`   - All passwords are set to: ${demoPassword}`);
    console.log('   - Set DEMO_PASSWORD environment variable to customize demo passwords');
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
