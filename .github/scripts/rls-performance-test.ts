#!/usr/bin/env bun
/**
 * RLS Performance Test Script
 * Benchmarks query performance with Row-Level Security enabled
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || process.env['TEST_DATABASE_URL'],
    },
  },
});

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
}

async function benchmark(
  operation: string,
  iterations: number,
  fn: () => Promise<void>,
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < 3; i++) {
    await fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  return {
    operation,
    iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: times[0],
    maxTime: times[times.length - 1],
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
  };
}

async function setupTestData() {
  console.log('🌱 Setting up test data...\n');

  await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);

  // Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'perf-test-tenant' },
    update: {},
    create: {
      name: 'Performance Test Tenant',
      slug: 'perf-test-tenant',
      status: 'active',
    },
  });

  // Create role
  const role = await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'Perf Test Role',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      name: 'Perf Test Role',
      tenantId: tenant.id,
      permissions: ['test:read'],
      type: 'custom',
    },
  });

  // Check if we have enough users
  const existingUsers = await prisma.user.count({
    where: { tenantId: tenant.id },
  });

  if (existingUsers < 100) {
    console.log('   Creating 100 test users...');
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push({
        email: `perfuser${i}@test.com`,
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
        firstName: `User`,
        lastName: `${i}`,
        tenantId: tenant.id,
        roleId: role.id,
        status: 'active',
        emailVerified: true,
      });
    }

    await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });
    console.log('   ✅ Created 100 users');
  }

  return { tenant, role };
}

async function runPerformanceTests() {
  const { tenant } = await setupTestData();

  console.log('⚡ Running performance benchmarks...\n');

  const results: BenchmarkResult[] = [];

  // Test 1: Simple SELECT with RLS
  console.log('📊 Test 1: Simple SELECT with RLS context');
  const simpleSelect = await benchmark('Simple SELECT (with RLS)', 100, async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenant.id}'`);
    await prisma.user.findMany({ take: 10 });
  });
  results.push(simpleSelect);
  console.log(
    `   Avg: ${simpleSelect.avgTime.toFixed(2)}ms, P95: ${simpleSelect.p95.toFixed(2)}ms\n`,
  );

  // Test 2: SELECT with WHERE clause
  console.log('📊 Test 2: SELECT with WHERE clause');
  const selectWithWhere = await benchmark('SELECT with WHERE (with RLS)', 100, async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenant.id}'`);
    await prisma.user.findMany({
      where: { status: 'active' },
      take: 10,
    });
  });
  results.push(selectWithWhere);
  console.log(
    `   Avg: ${selectWithWhere.avgTime.toFixed(2)}ms, P95: ${selectWithWhere.p95.toFixed(2)}ms\n`,
  );

  // Test 3: SELECT with JOIN (include role)
  console.log('📊 Test 3: SELECT with JOIN');
  const selectWithJoin = await benchmark('SELECT with JOIN (with RLS)', 100, async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenant.id}'`);
    await prisma.user.findMany({
      include: { role: true },
      take: 10,
    });
  });
  results.push(selectWithJoin);
  console.log(
    `   Avg: ${selectWithJoin.avgTime.toFixed(2)}ms, P95: ${selectWithJoin.p95.toFixed(2)}ms\n`,
  );

  // Test 4: Count query
  console.log('📊 Test 4: COUNT query');
  const countQuery = await benchmark('COUNT query (with RLS)', 100, async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenant.id}'`);
    await prisma.user.count();
  });
  results.push(countQuery);
  console.log(`   Avg: ${countQuery.avgTime.toFixed(2)}ms, P95: ${countQuery.p95.toFixed(2)}ms\n`);

  // Test 5: Context switching overhead
  console.log('📊 Test 5: RLS context switching overhead');
  const contextSwitch = await benchmark('Context switch', 100, async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenant.id}'`);
  });
  results.push(contextSwitch);
  console.log(
    `   Avg: ${contextSwitch.avgTime.toFixed(2)}ms, P95: ${contextSwitch.p95.toFixed(2)}ms\n`,
  );

  // Test 6: Super admin mode (no tenant filter)
  console.log('📊 Test 6: Super admin SELECT');
  const superAdminSelect = await benchmark('Super admin SELECT', 100, async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);
    await prisma.user.findMany({ take: 10 });
  });
  results.push(superAdminSelect);
  console.log(
    `   Avg: ${superAdminSelect.avgTime.toFixed(2)}ms, P95: ${superAdminSelect.p95.toFixed(2)}ms\n`,
  );

  return results;
}

function analyzeResults(results: BenchmarkResult[]) {
  console.log('\n═══════════════════════════════════════');
  console.log('   PERFORMANCE ANALYSIS');
  console.log('═══════════════════════════════════════\n');

  // RLS overhead (context switching)
  const contextSwitchResult = results.find((r) => r.operation === 'Context switch');
  if (contextSwitchResult) {
    console.log('🔄 RLS Context Switching:');
    console.log(`   Average: ${contextSwitchResult.avgTime.toFixed(2)}ms`);
    console.log(`   P95: ${contextSwitchResult.p95.toFixed(2)}ms`);
    console.log(
      `   Verdict: ${contextSwitchResult.avgTime < 5 ? '✅ Excellent' : contextSwitchResult.avgTime < 10 ? '⚠️ Acceptable' : '❌ Slow'}\n`,
    );
  }

  // Query performance
  const queryResults = results.filter((r) => r.operation.includes('SELECT'));
  console.log('📊 Query Performance:\n');

  for (const result of queryResults) {
    console.log(`   ${result.operation}:`);
    console.log(`      Avg: ${result.avgTime.toFixed(2)}ms`);
    console.log(`      P50: ${result.p50.toFixed(2)}ms`);
    console.log(`      P95: ${result.p95.toFixed(2)}ms`);
    console.log(`      P99: ${result.p99.toFixed(2)}ms`);

    let verdict = '';
    if (result.avgTime < 10) {
      verdict = '✅ Excellent';
    } else if (result.avgTime < 50) {
      verdict = '✅ Good';
    } else if (result.avgTime < 100) {
      verdict = '⚠️ Acceptable';
    } else {
      verdict = '❌ Needs optimization';
    }

    console.log(`      Verdict: ${verdict}\n`);
  }

  // Overall verdict
  const avgTimes = results.map((r) => r.avgTime);
  const overallAvg = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;

  console.log('═══════════════════════════════════════');
  console.log('   OVERALL VERDICT');
  console.log('═══════════════════════════════════════\n');

  if (overallAvg < 20) {
    console.log('✅ EXCELLENT: RLS performance is optimal');
    console.log('   No action needed. RLS overhead is negligible.\n');
  } else if (overallAvg < 50) {
    console.log('✅ GOOD: RLS performance is acceptable');
    console.log('   RLS overhead is within acceptable limits.\n');
  } else if (overallAvg < 100) {
    console.log('⚠️ ACCEPTABLE: RLS adds measurable overhead');
    console.log('   Consider adding indexes on tenantId columns.\n');
  } else {
    console.log('❌ NEEDS OPTIMIZATION: RLS performance issues detected');
    console.log('   Action required:');
    console.log('   1. Add indexes on tenantId columns');
    console.log('   2. Review RLS policy complexity');
    console.log('   3. Consider caching strategies\n');
  }

  // JSON output for GitHub Actions
  const jsonOutput = {
    overallAvg: parseFloat(overallAvg.toFixed(2)),
    contextSwitchAvg: contextSwitchResult ? parseFloat(contextSwitchResult.avgTime.toFixed(2)) : 0,
    results: results.map((r) => ({
      operation: r.operation,
      avgTime: parseFloat(r.avgTime.toFixed(2)),
      p95: parseFloat(r.p95.toFixed(2)),
      p99: parseFloat(r.p99.toFixed(2)),
    })),
    verdict:
      overallAvg < 20
        ? 'Excellent'
        : overallAvg < 50
          ? 'Good'
          : overallAvg < 100
            ? 'Acceptable'
            : 'Needs Optimization',
    withRls: {
      avgTime: parseFloat((avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length).toFixed(2)),
      p95: parseFloat(
        results
          .map((r) => r.p95)
          .sort((a, b) => a - b)
          [Math.floor(results.length * 0.95)].toFixed(2),
      ),
    },
    withoutRls: {
      avgTime: 0, // Baseline without RLS (hypothetical)
      p95: 0,
    },
    impact: contextSwitchResult
      ? parseFloat(((contextSwitchResult.avgTime / overallAvg) * 100).toFixed(1))
      : 0,
  };

  console.log(JSON.stringify(jsonOutput, null, 2));
}

async function main() {
  console.log('🚀 RLS Performance Test Suite\n');
  console.log('═══════════════════════════════════════\n');

  try {
    const results = await runPerformanceTests();
    analyzeResults(results);
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
