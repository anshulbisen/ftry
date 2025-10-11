#!/usr/bin/env bun
/**
 * Performance Test Data Seeder
 * Creates realistic volume of data for performance benchmarking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || process.env['TEST_DATABASE_URL'],
    },
  },
});

// Simple faker alternative (no external dependencies)
function randomName(): string {
  const firstNames = [
    'John',
    'Jane',
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Henry',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Martinez',
    'Lopez',
  ];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function randomEmail(index: number): string {
  return `perftest${index}@test${Math.floor(Math.random() * 1000)}.com`;
}

async function seedPerformanceData() {
  console.log('🌱 Seeding performance test data...');

  try {
    // Bypass RLS for seeding
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);

    // Create 10 test tenants
    console.log('📦 Creating tenants...');
    const tenants = [];
    for (let i = 1; i <= 10; i++) {
      const tenant = await prisma.tenant.create({
        data: {
          name: `Performance Test Salon ${i}`,
          slug: `perf-test-salon-${i}`,
          status: 'active',
          subscriptionPlan: i % 3 === 0 ? 'premium' : 'free',
          subscriptionStatus: 'active',
          maxUsers: i % 2 === 0 ? 10 : 50,
        },
      });
      tenants.push(tenant);
    }
    console.log(`✅ Created ${tenants.length} tenants`);

    // Create roles for each tenant
    console.log('👥 Creating roles...');
    const roles = [];
    for (const tenant of tenants) {
      const role = await prisma.role.create({
        data: {
          name: 'Staff',
          description: 'Standard staff role',
          tenantId: tenant.id,
          permissions: ['users:read', 'appointments:read', 'appointments:write'],
          type: 'custom',
          level: 1,
          status: 'active',
        },
      });
      roles.push(role);
    }
    console.log(`✅ Created ${roles.length} roles`);

    // Create users for each tenant (50 users per tenant = 500 total)
    console.log('👤 Creating users...');
    let userCount = 0;
    const validPasswordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2'; // "password123"

    for (const tenant of tenants) {
      const role = roles.find((r) => r.tenantId === tenant.id)!;

      // Create users in batches of 10 for better performance
      for (let batch = 0; batch < 5; batch++) {
        const usersData = [];
        for (let i = 0; i < 10; i++) {
          const fullName = randomName();
          const [firstName, lastName] = fullName.split(' ');
          usersData.push({
            email: randomEmail(userCount++),
            password: validPasswordHash,
            firstName,
            lastName,
            tenantId: tenant.id,
            roleId: role.id,
            status: 'active',
            emailVerified: true,
            loginAttempts: 0,
          });
        }

        await prisma.user.createMany({
          data: usersData,
          skipDuplicates: true,
        });
      }
    }
    console.log(`✅ Created ${userCount} users`);

    // Create refresh tokens for some users (simulate active sessions)
    console.log('🔑 Creating refresh tokens...');
    const users = await prisma.user.findMany({ take: 100 });
    let tokenCount = 0;

    for (const user of users) {
      // 2-3 tokens per user (multiple devices)
      const numTokens = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < numTokens; i++) {
        await prisma.refreshToken.create({
          data: {
            token: `perf_test_token_${user.id}_${i}_${Date.now()}`,
            userId: user.id,
            deviceInfo: `Test Device ${i + 1}`,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            isRevoked: false,
          },
        });
        tokenCount++;
      }
    }
    console.log(`✅ Created ${tokenCount} refresh tokens`);

    // Create audit logs (simulate activity)
    console.log('📝 Creating audit logs...');
    const allUsers = await prisma.user.findMany();
    let auditCount = 0;

    for (let i = 0; i < 1000; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const actions = ['login', 'logout', 'user.create', 'user.update', 'appointment.create'];
      const action = actions[Math.floor(Math.random() * actions.length)];

      await prisma.auditLog.create({
        data: {
          userId: randomUser.id,
          tenantId: randomUser.tenantId,
          action,
          resource: 'user',
          resourceId: randomUser.id,
          method: 'POST',
          path: `/api/v1/${action.replace('.', '/')}`,
          statusCode: 200,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Performance Test Agent',
          success: true,
          newData: { test: 'data' },
        },
      });
      auditCount++;
    }
    console.log(`✅ Created ${auditCount} audit logs`);

    // Print summary
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Performance Data Seeded Successfully');
    console.log('═══════════════════════════════════════');
    console.log(`Tenants:        ${tenants.length}`);
    console.log(`Roles:          ${roles.length}`);
    console.log(`Users:          ${userCount}`);
    console.log(`Refresh Tokens: ${tokenCount}`);
    console.log(`Audit Logs:     ${auditCount}`);
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error seeding performance data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedPerformanceData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
