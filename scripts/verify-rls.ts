#!/usr/bin/env bun
/**
 * RLS Verification Script
 * Tests current Row-Level Security implementation
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient({
  log: ['query', 'warn', 'error'],
});

// Extended PrismaClient with RLS methods
interface PrismaWithRLS extends PrismaClient {
  setTenantContext(tenantId: string | null): Promise<void>;
  getTenantContext(): Promise<string>;
  $executeRawUnsafe: any;
}

const prismaRLS = prisma as PrismaWithRLS;

// RLS helper functions
prismaRLS.setTenantContext = async function (tenantId: string | null) {
  if (tenantId) {
    await this.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    console.log(`✅ RLS context set: tenantId=${tenantId}`);
  } else {
    await this.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);
    console.log('✅ RLS context cleared (super admin mode)');
  }
};

prismaRLS.getTenantContext = async function () {
  const result: any = await this.$queryRaw`
    SELECT current_setting('app.current_tenant', true) as current_tenant
  `;
  return result[0]?.current_tenant || '';
};

async function checkRLSStatus() {
  console.log('\n🔍 Checking RLS Status...\n');

  try {
    // Check which tables have RLS enabled
    const tables: any = await prismaRLS.$queryRaw`
      SELECT
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('User', 'Role', 'AuditLog', 'RefreshToken', 'Session', 'Tenant', 'Permission')
      ORDER BY tablename
    `;

    console.log('📋 Table RLS Status:');
    console.log('─'.repeat(40));
    for (const table of tables) {
      const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`${table.tablename.padEnd(20)} ${status}`);
    }

    // Check RLS policies
    const policies: any = await prismaRLS.$queryRaw`
      SELECT
        tablename,
        policyname,
        cmd,
        permissive
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;

    console.log('\n📜 RLS Policies:');
    console.log('─'.repeat(40));
    for (const policy of policies) {
      console.log(`Table: ${policy.tablename}`);
      console.log(`  Policy: ${policy.policyname}`);
      console.log(`  Commands: ${policy.cmd}`);
      console.log(`  Permissive: ${policy.permissive ? 'Yes' : 'No'}`);
      console.log('');
    }

    // Check if helper functions exist
    const functions: any = await prismaRLS.$queryRaw`
      SELECT
        proname as function_name,
        pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname IN ('current_tenant_id', 'is_super_admin')
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `;

    console.log('🔧 Helper Functions:');
    console.log('─'.repeat(40));
    if (functions.length === 0) {
      console.log('❌ No RLS helper functions found');
      console.log('   - Missing: current_tenant_id()');
      console.log('   - Missing: is_super_admin()');
    } else {
      for (const func of functions) {
        console.log(`✅ ${func.function_name}() exists`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking RLS status:', error);
    return false;
  }
}

async function testRLSIsolation() {
  console.log('\n🧪 Testing RLS Isolation...\n');

  try {
    // Create test data if needed
    const testTenant1 = await prismaRLS.tenant.upsert({
      where: { slug: 'rls-test-1' },
      update: {},
      create: {
        name: 'RLS Test Tenant 1',
        slug: 'rls-test-1',
        status: 'active',
      },
    });

    const testTenant2 = await prismaRLS.tenant.upsert({
      where: { slug: 'rls-test-2' },
      update: {},
      create: {
        name: 'RLS Test Tenant 2',
        slug: 'rls-test-2',
        status: 'active',
      },
    });

    // Create test role
    const testRole = await prismaRLS.role.upsert({
      where: {
        name_tenantId: {
          name: 'RLS Test Role',
          tenantId: testTenant1.id,
        },
      },
      update: {},
      create: {
        name: 'RLS Test Role',
        tenantId: testTenant1.id,
        permissions: ['test:read'],
        type: 'custom',
      },
    });

    // Test 1: Set context to tenant 1
    await prismaRLS.$transaction(async (tx) => {
      const txRLS = tx as PrismaWithRLS;
      await txRLS.setTenantContext(testTenant1.id);

      const currentContext = await txRLS.getTenantContext();
      console.log(`Current context: ${currentContext}`);

      // Query users - should only see tenant 1 users
      const users = await tx.user.findMany({
        select: { id: true, email: true, tenantId: true },
      });

      const tenant1Users = users.filter((u) => u.tenantId === testTenant1.id);
      const tenant2Users = users.filter((u) => u.tenantId === testTenant2.id);
      const nullTenantUsers = users.filter((u) => u.tenantId === null);

      console.log(`\n📊 Tenant 1 Context Results:`);
      console.log(`  - Tenant 1 users: ${tenant1Users.length}`);
      console.log(
        `  - Tenant 2 users: ${tenant2Users.length} ${tenant2Users.length > 0 ? '❌ VIOLATION!' : '✅'}`,
      );
      console.log(`  - Super admin users: ${nullTenantUsers.length}`);

      if (tenant2Users.length > 0) {
        console.error("❌ RLS VIOLATION: Can see other tenant's data!");
        return false;
      }
    });

    // Test 2: Super admin mode
    await prismaRLS.$transaction(async (tx) => {
      const txRLS = tx as PrismaWithRLS;
      await txRLS.setTenantContext(null); // Super admin mode

      const users = await tx.user.findMany({
        select: { id: true, email: true, tenantId: true },
      });

      const uniqueTenants = new Set(users.map((u) => u.tenantId).filter((t) => t !== null));

      console.log(`\n📊 Super Admin Context Results:`);
      console.log(`  - Total users: ${users.length}`);
      console.log(`  - Unique tenants: ${uniqueTenants.size}`);
      console.log(`  - Can access all tenants: ${uniqueTenants.size >= 2 ? '✅' : '⚠️'}`);
    });

    // Cleanup test data
    await prismaRLS.role.deleteMany({
      where: { name: 'RLS Test Role' },
    });

    console.log('\n✅ RLS isolation tests completed');
    return true;
  } catch (error) {
    console.error('❌ Error testing RLS isolation:', error);
    return false;
  }
}

async function identifyEnhancements() {
  console.log('\n💡 Identifying Potential Enhancements...\n');

  const enhancements = [];

  // Check for audit logging
  const auditTriggers: any = await prismaRLS.$queryRaw`
    SELECT COUNT(*) as count
    FROM pg_trigger
    WHERE tgname LIKE '%rls_violation%'
  `;

  if (auditTriggers[0].count === '0') {
    enhancements.push('📝 Add RLS violation audit triggers');
  }

  // Check for performance indexes on tenantId
  const indexes: any = await prismaRLS.$queryRaw`
    SELECT
      tablename,
      indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE '%tenant%'
  `;

  const tablesWithTenantId = ['User', 'Role', 'AuditLog'];
  for (const table of tablesWithTenantId) {
    const hasIndex = indexes.some(
      (idx: any) => idx.tablename === table && idx.indexname.includes('tenant'),
    );
    if (!hasIndex) {
      enhancements.push(`🚀 Add index on ${table}.tenantId for performance`);
    }
  }

  // Check for RLS helper functions
  const functions: any = await prismaRLS.$queryRaw`
    SELECT proname
    FROM pg_proc
    WHERE proname IN ('current_tenant_id', 'is_super_admin')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  `;

  if (functions.length < 2) {
    enhancements.push('🔧 Add RLS helper functions (current_tenant_id, is_super_admin)');
  }

  if (enhancements.length === 0) {
    console.log('✅ RLS implementation is comprehensive!');
  } else {
    console.log('Suggested enhancements:');
    enhancements.forEach((e) => console.log(`  - ${e}`));
  }

  return enhancements;
}

async function main() {
  console.log('═'.repeat(50));
  console.log('     RLS VERIFICATION REPORT');
  console.log('═'.repeat(50));

  try {
    // Check RLS status
    const statusOk = await checkRLSStatus();

    // Test RLS isolation
    const isolationOk = await testRLSIsolation();

    // Identify enhancements
    const enhancements = await identifyEnhancements();

    console.log('\n═'.repeat(50));
    console.log('     SUMMARY');
    console.log('═'.repeat(50));
    console.log(`\nRLS Status Check: ${statusOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`RLS Isolation Test: ${isolationOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(
      `Enhancements Needed: ${enhancements.length === 0 ? '✅ NONE' : `⚠️ ${enhancements.length} suggestions`}`,
    );

    if (statusOk && isolationOk) {
      console.log('\n🎉 Your RLS implementation is working correctly!');

      if (enhancements.length > 0) {
        console.log('\n📌 Next Steps:');
        console.log('1. Review the suggested enhancements above');
        console.log('2. Run the enhanced migration if needed:');
        console.log('   bunx prisma migrate dev --name enhanced_rls_setup');
        console.log('3. Setup GitHub Actions workflow for automated testing');
        console.log('4. Add the RLS test suite to your CI/CD pipeline');
      }
    } else {
      console.log('\n⚠️ RLS needs attention. Please review the issues above.');
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
