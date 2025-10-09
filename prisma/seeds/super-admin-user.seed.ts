import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Super Admin User Seed
 *
 * Creates the initial super admin user account.
 * Credentials are configured via environment variables for security.
 *
 * Environment Variables:
 * - SUPER_ADMIN_EMAIL: Super admin email (default: super@ftry.com)
 * - SUPER_ADMIN_PASSWORD: Super admin password (default: MUST BE SET IN PRODUCTION)
 *
 * @see docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md
 */

// Default credentials (MUST be changed in production)
const DEFAULT_SUPER_ADMIN_EMAIL = 'super@ftry.com';
// Use same default as demo users for consistency in development
const DEFAULT_SUPER_ADMIN_PASSWORD = 'DevPassword123!@#';

/**
 * Seed super admin user to database
 * @param prisma - PrismaClient instance
 */
export async function seedSuperAdminUser(prisma: PrismaClient): Promise<void> {
  console.log('👤 Seeding super admin user...');

  // Get or default credentials
  const email = process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD || DEFAULT_SUPER_ADMIN_PASSWORD;

  // Security warning in production
  if (process.env.NODE_ENV === 'production' && password === DEFAULT_SUPER_ADMIN_PASSWORD) {
    throw new Error(
      'SECURITY ERROR: SUPER_ADMIN_PASSWORD environment variable must be set in production!',
    );
  }

  // Find Super Admin role
  const superAdminRole = await prisma.role.findFirst({
    where: {
      name: 'Super Admin',
      tenantId: null, // System role
    },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found. Please run admin-roles.seed.ts first.');
  }

  // Check if super admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`   ⚠️  Super admin already exists: ${email}`);
    console.log('   💡 Use password reset flow to change password');
    return;
  }

  // Hash password with bcrypt (12 rounds for security)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create super admin user
  const superAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      tenantId: null, // NULL = super admin (cross-tenant access)
      roleId: superAdminRole.id,
      emailVerified: true, // Pre-verified for immediate access
      status: 'active',
    },
  });

  console.log(`   ✅ Created super admin user: ${email}`);
  console.log('   🔒 IMPORTANT: Change password after first login!');

  // Log credentials in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('\n   📋 Super Admin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n   ⚠️  These credentials are shown only in development mode');
  }

  console.log('✅ Super admin user seeded successfully');
}
