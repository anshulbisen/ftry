/**
 * RLS Test Helpers
 * Utilities for testing Row-Level Security in both unit and integration tests
 */

import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@ftry/shared/prisma';

export interface TestTenant {
  id: string;
  name: string;
  slug: string;
}

export interface TestUser {
  id: string;
  email: string;
  tenantId: string | null;
  roleId: string;
}

export interface RlsTestContext {
  prisma: PrismaService;
  tenants: TestTenant[];
  users: TestUser[];
  cleanup: () => Promise<void>;
}

/**
 * Creates a test database with RLS enabled
 * Works with both real PostgreSQL and in-memory test databases
 */
export async function setupRlsTestDatabase(
  options: {
    useRealDatabase?: boolean;
    databaseUrl?: string;
  } = {},
): Promise<RlsTestContext> {
  const { useRealDatabase = false, databaseUrl } = options;

  // Create Prisma client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl || process.env['DATABASE_URL_TEST'] || process.env['DATABASE_URL'],
      },
    },
  }) as PrismaService;

  // Add RLS methods to Prisma
  (prisma as any).setTenantContext = async function (tenantId: string | null) {
    if (tenantId) {
      await this.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${tenantId}'`);
    } else {
      await this.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);
    }
  };

  (prisma as any).getTenantContext = async function () {
    const result = await this.$queryRaw<[{ current_tenant: string }]>`
      SELECT current_setting('app.current_tenant', true) as current_tenant
    `;
    return result[0]?.current_tenant || '';
  };

  await prisma.$connect();

  if (useRealDatabase) {
    // Enable RLS on test database
    await enableRlsForTesting(prisma);
  }

  // Create test data
  const { tenants, users } = await createTestFixtures(prisma);

  // Cleanup function
  const cleanup = async () => {
    await cleanupTestData(prisma);
    await prisma.$disconnect();
  };

  return { prisma, tenants, users, cleanup };
}

/**
 * Enables RLS on test database tables
 * Safe to run multiple times (idempotent)
 */
async function enableRlsForTesting(prisma: PrismaClient): Promise<void> {
  // Create helper functions
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION current_tenant_id()
    RETURNS TEXT AS $$
      SELECT current_setting('app.current_tenant', true)::TEXT;
    $$ LANGUAGE SQL STABLE;
  `);

  // Enable RLS on User table
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  `);

  // Drop existing policies (idempotent)
  await prisma
    .$executeRawUnsafe(
      `
    DROP POLICY IF EXISTS tenant_isolation_policy ON "User";
  `,
    )
    .catch(() => {}); // Ignore if doesn't exist

  // Create policy
  await prisma.$executeRawUnsafe(`
    CREATE POLICY tenant_isolation_policy ON "User"
    FOR ALL
    USING (
      "tenantId" = current_tenant_id()
      OR current_tenant_id() IS NULL
      OR current_tenant_id() = ''
    );
  `);

  // Repeat for other tables as needed
  const tables = ['Client', 'Service', 'Appointment', 'Invoice'];

  for (const table of tables) {
    // Check if table exists
    const tableExists = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${table}
      ) as exists
    `;

    if (tableExists[0].exists) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
      `);

      await prisma
        .$executeRawUnsafe(
          `
        DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}";
      `,
        )
        .catch(() => {});

      await prisma.$executeRawUnsafe(`
        CREATE POLICY tenant_isolation_policy ON "${table}"
        FOR ALL
        USING (
          "tenantId" = current_tenant_id()
          OR current_tenant_id() IS NULL
          OR current_tenant_id() = ''
        );
      `);
    }
  }
}

/**
 * Creates test fixtures for RLS testing
 */
async function createTestFixtures(prisma: PrismaClient): Promise<{
  tenants: TestTenant[];
  users: TestUser[];
}> {
  // Clear any existing test data
  await cleanupTestData(prisma);

  // Create test tenants
  const tenant1: TestTenant = {
    id: 'test-tenant-1',
    name: 'Test Salon 1',
    slug: 'test-salon-1',
  };

  const tenant2: TestTenant = {
    id: 'test-tenant-2',
    name: 'Test Salon 2',
    slug: 'test-salon-2',
  };

  await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`); // Super admin mode

  await prisma.$executeRawUnsafe(`
    INSERT INTO "Tenant" (id, name, slug, status, "createdAt", "updatedAt")
    VALUES
      ('${tenant1.id}', '${tenant1.name}', '${tenant1.slug}', 'active', NOW(), NOW()),
      ('${tenant2.id}', '${tenant2.name}', '${tenant2.slug}', 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  // Create test role
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Role" (id, name, permissions, type, level, status, "createdAt", "updatedAt")
    VALUES ('test-role-id', 'Test Role', ARRAY['test:read']::text[], 'system', 1, 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  // Create test users
  const validPasswordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2';

  const user1: TestUser = {
    id: 'test-user-1',
    email: 'user1@test.com',
    tenantId: tenant1.id,
    roleId: 'test-role-id',
  };

  const user2: TestUser = {
    id: 'test-user-2',
    email: 'user2@test.com',
    tenantId: tenant2.id,
    roleId: 'test-role-id',
  };

  const superAdmin: TestUser = {
    id: 'test-super-admin',
    email: 'admin@test.com',
    tenantId: null,
    roleId: 'test-role-id',
  };

  await prisma.$executeRawUnsafe(`
    INSERT INTO "User" (
      id, email, password, "firstName", "lastName", "tenantId", "roleId",
      status, "emailVerified", "createdAt", "updatedAt"
    ) VALUES
      ('${user1.id}', '${user1.email}', '${validPasswordHash}', 'User', 'One', '${user1.tenantId}', '${user1.roleId}', 'active', true, NOW(), NOW()),
      ('${user2.id}', '${user2.email}', '${validPasswordHash}', 'User', 'Two', '${user2.tenantId}', '${user2.roleId}', 'active', true, NOW(), NOW()),
      ('${superAdmin.id}', '${superAdmin.email}', '${validPasswordHash}', 'Super', 'Admin', NULL, '${superAdmin.roleId}', 'active', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  return {
    tenants: [tenant1, tenant2],
    users: [user1, user2, superAdmin],
  };
}

/**
 * Cleans up test data
 */
async function cleanupTestData(prisma: PrismaClient): Promise<void> {
  // Set super admin context to bypass RLS
  await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant = ''`);

  // Delete test users
  await prisma.$executeRawUnsafe(`
    DELETE FROM "User"
    WHERE email LIKE '%@test.com'
    OR id LIKE 'test-%'
  `);

  // Delete test tenants
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Tenant"
    WHERE id LIKE 'test-tenant-%'
  `);

  // Delete test roles
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Role"
    WHERE id = 'test-role-id'
  `);
}

/**
 * Helper to run tests with different tenant contexts
 */
export async function withTenantContext<T>(
  prisma: PrismaService,
  tenantId: string | null,
  callback: () => Promise<T>,
): Promise<T> {
  await prisma.setTenantContext(tenantId);
  try {
    return await callback();
  } finally {
    // Reset context after test
    await prisma.setTenantContext(null);
  }
}

/**
 * Assertion helpers for RLS tests
 */
export const rlsAssertions = {
  /**
   * Assert that a user can only see their tenant's data
   */
  async assertTenantIsolation(
    prisma: PrismaService,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await prisma.setTenantContext(tenantId);

    const users = await prisma.user.findMany();
    const userTenants = new Set(users.map((u) => u.tenantId));

    // Should only see users from same tenant or null (system users)
    for (const userTenant of userTenants) {
      if (userTenant !== null && userTenant !== tenantId) {
        throw new Error(`RLS violation: User can see data from tenant ${userTenant}`);
      }
    }
  },

  /**
   * Assert that cross-tenant access is blocked
   */
  async assertCrossTenantBlocked(
    prisma: PrismaService,
    tenantId: string,
    otherTenantUserId: string,
  ): Promise<void> {
    await prisma.setTenantContext(tenantId);

    const user = await prisma.user.findUnique({
      where: { id: otherTenantUserId },
    });

    if (user !== null) {
      throw new Error(`RLS violation: Can access user from another tenant`);
    }
  },

  /**
   * Assert that super admin can see all data
   */
  async assertSuperAdminAccess(prisma: PrismaService): Promise<void> {
    await prisma.setTenantContext(null);

    const users = await prisma.user.findMany();
    const tenants = new Set(users.map((u) => u.tenantId).filter((t) => t !== null));

    if (tenants.size < 2) {
      throw new Error(`Super admin should see data from multiple tenants`);
    }
  },
};

/**
 * Mock RLS for unit tests (without real database)
 */
export class MockRlsService {
  private currentTenant: string | null = null;
  private data: Map<string, any[]> = new Map();

  setTenantContext(tenantId: string | null): void {
    this.currentTenant = tenantId;
  }

  getTenantContext(): string | null {
    return this.currentTenant;
  }

  addMockData(table: string, records: any[]): void {
    this.data.set(table, records);
  }

  findMany(table: string, where?: any): any[] {
    const records = this.data.get(table) || [];

    if (this.currentTenant === null || this.currentTenant === '') {
      // Super admin - return all
      return records;
    }

    // Filter by tenant
    return records.filter((r) => r.tenantId === this.currentTenant || r.tenantId === null);
  }

  findUnique(table: string, id: string): any | null {
    const records = this.findMany(table);
    const record = records.find((r) => r.id === id);
    return record || null;
  }
}
