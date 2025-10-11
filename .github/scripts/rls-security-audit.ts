#!/usr/bin/env bun
/**
 * RLS Security Audit Script
 * Validates Row-Level Security implementation in CI/CD
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || process.env['TEST_DATABASE_URL'],
    },
  },
});

interface AuditResult {
  category: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

const results: AuditResult[] = [];

async function checkRLSEnabled() {
  console.log('🔍 Checking RLS status on tables...\n');

  const requiredTables = ['User', 'Role', 'AuditLog', 'RefreshToken', 'Session'];

  const tables: any = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = ANY(${requiredTables}::text[])
  `;

  for (const tableName of requiredTables) {
    const table = tables.find((t: any) => t.tablename === tableName);

    if (!table) {
      results.push({
        category: 'RLS Status',
        passed: false,
        message: `Table "${tableName}" not found in database`,
        severity: 'critical',
      });
      continue;
    }

    if (table.rowsecurity) {
      results.push({
        category: 'RLS Status',
        passed: true,
        message: `✅ Table "${tableName}" has RLS enabled`,
        severity: 'info',
      });
    } else {
      results.push({
        category: 'RLS Status',
        passed: false,
        message: `❌ Table "${tableName}" does NOT have RLS enabled`,
        severity: 'critical',
      });
    }
  }
}

async function checkRLSPolicies() {
  console.log('📋 Checking RLS policies...\n');

  const policies: any = await prisma.$queryRaw`
    SELECT tablename, policyname, cmd, permissive
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  const tablesWithPolicies = new Set(policies.map((p: any) => p.tablename));
  const requiredTables = ['User', 'Role', 'AuditLog'];

  for (const tableName of requiredTables) {
    if (tablesWithPolicies.has(tableName)) {
      const tablePolicies = policies.filter((p: any) => p.tablename === tableName);
      results.push({
        category: 'RLS Policies',
        passed: true,
        message: `✅ Table "${tableName}" has ${tablePolicies.length} RLS policy/policies`,
        severity: 'info',
      });
    } else {
      results.push({
        category: 'RLS Policies',
        passed: false,
        message: `❌ Table "${tableName}" has RLS enabled but NO policies defined`,
        severity: 'critical',
      });
    }
  }
}

async function checkHelperFunctions() {
  console.log('🔧 Checking helper functions...\n');

  const functions: any = await prisma.$queryRaw`
    SELECT proname as function_name
    FROM pg_proc
    WHERE proname IN ('current_tenant_id', 'is_super_admin')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  `;

  const functionNames = functions.map((f: any) => f.function_name);

  if (functionNames.includes('current_tenant_id')) {
    results.push({
      category: 'Helper Functions',
      passed: true,
      message: '✅ Helper function "current_tenant_id()" exists',
      severity: 'info',
    });
  } else {
    results.push({
      category: 'Helper Functions',
      passed: false,
      message: '⚠️ Helper function "current_tenant_id()" not found (policies may use inline logic)',
      severity: 'warning',
    });
  }

  if (functionNames.includes('is_super_admin')) {
    results.push({
      category: 'Helper Functions',
      passed: true,
      message: '✅ Helper function "is_super_admin()" exists',
      severity: 'info',
    });
  } else {
    results.push({
      category: 'Helper Functions',
      passed: false,
      message: '⚠️ Helper function "is_super_admin()" not found (policies may use inline logic)',
      severity: 'warning',
    });
  }
}

async function checkIndexes() {
  console.log('🚀 Checking performance indexes...\n');

  const indexes: any = await prisma.$queryRaw`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE '%tenant%'
    ORDER BY tablename
  `;

  const tablesWithTenantIndex = new Set(indexes.map((i: any) => i.tablename));
  const requiredTables = ['User', 'Role', 'AuditLog'];

  for (const tableName of requiredTables) {
    if (tablesWithTenantIndex.has(tableName)) {
      results.push({
        category: 'Performance',
        passed: true,
        message: `✅ Table "${tableName}" has tenantId index for RLS performance`,
        severity: 'info',
      });
    } else {
      results.push({
        category: 'Performance',
        passed: false,
        message: `⚠️ Table "${tableName}" missing tenantId index (performance impact)`,
        severity: 'warning',
      });
    }
  }
}

async function testTenantIsolation() {
  console.log('🧪 Testing tenant isolation...\n');

  try {
    // Create test data
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);

    // Create test tenants
    const tenant1 = await prisma.tenant.upsert({
      where: { slug: 'audit-tenant-1' },
      update: {},
      create: {
        name: 'Audit Tenant 1',
        slug: 'audit-tenant-1',
        status: 'active',
      },
    });

    const tenant2 = await prisma.tenant.upsert({
      where: { slug: 'audit-tenant-2' },
      update: {},
      create: {
        name: 'Audit Tenant 2',
        slug: 'audit-tenant-2',
        status: 'active',
      },
    });

    // Create test role
    const role = await prisma.role.upsert({
      where: {
        name_tenantId: {
          name: 'Audit Role',
          tenantId: tenant1.id,
        },
      },
      update: {},
      create: {
        name: 'Audit Role',
        tenantId: tenant1.id,
        permissions: ['test:read'],
        type: 'custom',
      },
    });

    // Create test users
    const user1 = await prisma.user.upsert({
      where: { email: 'audit-user1@test.com' },
      update: { tenantId: tenant1.id },
      create: {
        email: 'audit-user1@test.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
        firstName: 'Audit',
        lastName: 'User1',
        tenantId: tenant1.id,
        roleId: role.id,
        status: 'active',
        emailVerified: true,
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'audit-user2@test.com' },
      update: { tenantId: tenant2.id },
      create: {
        email: 'audit-user2@test.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
        firstName: 'Audit',
        lastName: 'User2',
        tenantId: tenant2.id,
        roleId: role.id,
        status: 'active',
        emailVerified: true,
      },
    });

    // Test 1: Tenant 1 isolation
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenant1.id}'`);
    const tenant1Users = await prisma.user.findMany({
      where: { email: { in: ['audit-user1@test.com', 'audit-user2@test.com'] } },
    });

    const canSeeTenant2 = tenant1Users.some((u) => u.tenantId === tenant2.id);

    if (!canSeeTenant2) {
      results.push({
        category: 'Isolation Test',
        passed: true,
        message: '✅ Tenant 1 cannot see Tenant 2 data',
        severity: 'info',
      });
    } else {
      results.push({
        category: 'Isolation Test',
        passed: false,
        message: '❌ CRITICAL: Tenant 1 CAN see Tenant 2 data (RLS violation!)',
        severity: 'critical',
      });
    }

    // Test 2: Super admin access
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);
    const allUsers = await prisma.user.findMany({
      where: { email: { in: ['audit-user1@test.com', 'audit-user2@test.com'] } },
    });

    if (allUsers.length >= 2) {
      results.push({
        category: 'Isolation Test',
        passed: true,
        message: '✅ Super admin can see data from all tenants',
        severity: 'info',
      });
    } else {
      results.push({
        category: 'Isolation Test',
        passed: false,
        message: '❌ Super admin cannot see all tenant data',
        severity: 'critical',
      });
    }

    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { in: ['audit-user1@test.com', 'audit-user2@test.com'] } },
    });

    await prisma.role.deleteMany({
      where: { name: 'Audit Role' },
    });
  } catch (error) {
    results.push({
      category: 'Isolation Test',
      passed: false,
      message: `❌ Isolation test failed: ${error}`,
      severity: 'critical',
    });
  }
}

async function generateReport() {
  console.log('\n═══════════════════════════════════════');
  console.log('   RLS SECURITY AUDIT REPORT');
  console.log('═══════════════════════════════════════\n');

  // Group by category
  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    console.log(`\n## ${category}\n`);

    const categoryResults = results.filter((r) => r.category === category);

    for (const result of categoryResults) {
      console.log(result.message);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('   SUMMARY');
  console.log('═══════════════════════════════════════\n');

  const critical = results.filter((r) => !r.passed && r.severity === 'critical');
  const warnings = results.filter((r) => !r.passed && r.severity === 'warning');
  const passed = results.filter((r) => r.passed);

  console.log(`✅ Passed:   ${passed.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Critical: ${critical.length}`);

  if (critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:\n');
    critical.forEach((r) => console.log(`   - ${r.message}`));
    console.log('\n❌ AUDIT FAILED - Critical issues must be fixed!\n');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended fixes):\n');
    warnings.forEach((r) => console.log(`   - ${r.message}`));
    console.log('\n✅ AUDIT PASSED with warnings\n');
    process.exit(0);
  } else {
    console.log('\n✅ AUDIT PASSED - No issues found!\n');
    process.exit(0);
  }
}

async function main() {
  console.log('🔒 Running RLS Security Audit...\n');

  try {
    await checkRLSEnabled();
    await checkRLSPolicies();
    await checkHelperFunctions();
    await checkIndexes();
    await testTenantIsolation();

    await generateReport();
  } catch (error) {
    console.error('❌ Audit failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
