/**
 * Integration Tests for RLS Tenant Context in JwtStrategy
 *
 * These tests verify that Row-Level Security (RLS) policies are correctly
 * enforcing tenant isolation at the database level.
 *
 * IMPORTANT: These tests require:
 * 1. A test database with RLS policies enabled
 * 2. The migration '20251008101821_enable_row_level_security' applied
 * 3. Test data seeded with multiple tenants
 *
 * Run with: nx test backend-auth --testPathPattern=integration
 */

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { UserValidationService } from '../services/user-validation.service';
import { PrismaService } from '@ftry/shared/prisma';
import { CacheService } from '@ftry/backend/cache';
import type { JwtPayload } from '@ftry/shared/types';

describe('JwtStrategy RLS Integration', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;
  let module: TestingModule;

  // Test tenant IDs (must exist in test database)
  const TENANT_1_ID = 'test-tenant-1';
  const TENANT_2_ID = 'test-tenant-2';

  let tenant1UserId: string;
  let tenant2UserId: string;

  // Skip these integration tests if no test database is configured
  const hasTestDatabase = process.env['TEST_DATABASE_URL'] !== undefined;

  beforeAll(async () => {
    if (!hasTestDatabase) {
      console.warn('⚠️  Skipping RLS integration tests - no TEST_DATABASE_URL configured');
      console.warn('   Set TEST_DATABASE_URL environment variable to run these tests');
      return;
    }
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET', 'test-secret'),
            signOptions: { expiresIn: '15m' },
          }),
        }),
      ],
      providers: [
        JwtStrategy,
        PrismaService,
        UserValidationService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null), // Disable cache for integration tests
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);

    // Setup: Create test data
    await setupTestData();
  });

  afterAll(async () => {
    if (!hasTestDatabase) return;

    // Cleanup: Remove test data
    await cleanupTestData();
    await module.close();
  });

  async function setupTestData() {
    // Clear tenant context for admin operations
    await prisma.setTenantContext(null);

    // Create test tenants
    await prisma.tenant.upsert({
      where: { id: TENANT_1_ID },
      create: {
        id: TENANT_1_ID,
        name: 'Test Salon 1',
        slug: 'test-salon-1',
        status: 'active',
      },
      update: {},
    });

    await prisma.tenant.upsert({
      where: { id: TENANT_2_ID },
      create: {
        id: TENANT_2_ID,
        name: 'Test Salon 2',
        slug: 'test-salon-2',
        status: 'active',
      },
      update: {},
    });

    // Create test role
    const role = await prisma.role.upsert({
      where: { id: 'test-role-id' },
      create: {
        id: 'test-role-id',
        name: 'Test Role',
        permissions: ['test:read'],
        type: 'system',
        status: 'active',
      },
      update: {},
    });

    // Create test users for each tenant
    // Valid bcrypt hash (60 chars) for password "test123"
    const validBcryptHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2';

    const user1 = await prisma.user.upsert({
      where: { email: 'tenant1@test.com' },
      create: {
        email: 'tenant1@test.com',
        password: validBcryptHash,
        firstName: 'Tenant1',
        lastName: 'User',
        tenantId: TENANT_1_ID,
        roleId: role.id,
        status: 'active',
      },
      update: {},
    });
    tenant1UserId = user1.id;

    const user2 = await prisma.user.upsert({
      where: { email: 'tenant2@test.com' },
      create: {
        email: 'tenant2@test.com',
        password: validBcryptHash,
        firstName: 'Tenant2',
        lastName: 'User',
        tenantId: TENANT_2_ID,
        roleId: role.id,
        status: 'active',
      },
      update: {},
    });
    tenant2UserId = user2.id;
  }

  async function cleanupTestData() {
    // Clear tenant context for admin operations
    await prisma.setTenantContext(null);

    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['tenant1@test.com', 'tenant2@test.com'],
        },
      },
    });

    // Delete test tenants
    await prisma.tenant.deleteMany({
      where: {
        id: {
          in: [TENANT_1_ID, TENANT_2_ID],
        },
      },
    });

    // Delete test role
    await prisma.role.deleteMany({
      where: { id: 'test-role-id' },
    });
  }

  describe('RLS Tenant Isolation', () => {
    it('should set tenant context for tenant 1 user and only see tenant 1 data', async () => {
      if (!hasTestDatabase) return;

      const payload: JwtPayload = {
        sub: tenant1UserId,
        email: 'tenant1@test.com',
        tenantId: TENANT_1_ID,
        roleId: 'test-role-id',
        permissions: ['test:read'],
      };

      // Validate JWT - this should set RLS context
      await strategy.validate(payload);

      // Verify tenant context is set correctly
      const context = await prisma.getTenantContext();
      expect(context).toBe(TENANT_1_ID);

      // Query users - should only see tenant 1 users
      const users = await prisma.user.findMany({
        select: { id: true, email: true, tenantId: true },
      });

      // All returned users should belong to tenant 1
      expect(users.every((u) => u.tenantId === TENANT_1_ID || u.tenantId === null)).toBe(true);

      // Should include our tenant 1 user
      expect(users.some((u) => u.id === tenant1UserId)).toBe(true);

      // Should NOT include tenant 2 user
      expect(users.some((u) => u.id === tenant2UserId)).toBe(false);
    });

    it('should set tenant context for tenant 2 user and only see tenant 2 data', async () => {
      if (!hasTestDatabase) return;

      const payload: JwtPayload = {
        sub: tenant2UserId,
        email: 'tenant2@test.com',
        tenantId: TENANT_2_ID,
        roleId: 'test-role-id',
        permissions: ['test:read'],
      };

      // Validate JWT - this should set RLS context
      await strategy.validate(payload);

      // Verify tenant context is set correctly
      const context = await prisma.getTenantContext();
      expect(context).toBe(TENANT_2_ID);

      // Query users - should only see tenant 2 users
      const users = await prisma.user.findMany({
        select: { id: true, email: true, tenantId: true },
      });

      // All returned users should belong to tenant 2
      expect(users.every((u) => u.tenantId === TENANT_2_ID || u.tenantId === null)).toBe(true);

      // Should include our tenant 2 user
      expect(users.some((u) => u.id === tenant2UserId)).toBe(true);

      // Should NOT include tenant 1 user
      expect(users.some((u) => u.id === tenant1UserId)).toBe(false);
    });

    it('should prevent cross-tenant data access even with explicit WHERE clause', async () => {
      if (!hasTestDatabase) return;

      // Set context for tenant 1
      const payload: JwtPayload = {
        sub: tenant1UserId,
        email: 'tenant1@test.com',
        tenantId: TENANT_1_ID,
        roleId: 'test-role-id',
        permissions: ['test:read'],
      };

      await strategy.validate(payload);

      // Try to explicitly query tenant 2 user (RLS should block)
      const user = await prisma.user.findUnique({
        where: { id: tenant2UserId },
      });

      // RLS should block access - user should be null
      expect(user).toBeNull();
    });

    it('should prevent cross-tenant data access via findMany with WHERE', async () => {
      if (!hasTestDatabase) return;

      // Set context for tenant 1
      await prisma.setTenantContext(TENANT_1_ID);

      // Try to query tenant 2 users explicitly
      const users = await prisma.user.findMany({
        where: { tenantId: TENANT_2_ID },
      });

      // RLS should block - should return empty array
      expect(users).toHaveLength(0);
    });

    it('should switch tenant context between requests correctly', async () => {
      if (!hasTestDatabase) return;

      // Request 1: Tenant 1
      const payload1: JwtPayload = {
        sub: tenant1UserId,
        email: 'tenant1@test.com',
        tenantId: TENANT_1_ID,
        roleId: 'test-role-id',
        permissions: ['test:read'],
      };

      await strategy.validate(payload1);
      let context = await prisma.getTenantContext();
      expect(context).toBe(TENANT_1_ID);

      let user = await prisma.user.findUnique({ where: { id: tenant1UserId } });
      expect(user).not.toBeNull();
      expect(user?.tenantId).toBe(TENANT_1_ID);

      // Request 2: Tenant 2 (simulate new request)
      const payload2: JwtPayload = {
        sub: tenant2UserId,
        email: 'tenant2@test.com',
        tenantId: TENANT_2_ID,
        roleId: 'test-role-id',
        permissions: ['test:read'],
      };

      await strategy.validate(payload2);
      context = await prisma.getTenantContext();
      expect(context).toBe(TENANT_2_ID);

      // Now tenant 1 user should be inaccessible
      user = await prisma.user.findUnique({ where: { id: tenant1UserId } });
      expect(user).toBeNull();

      // But tenant 2 user should be accessible
      user = await prisma.user.findUnique({ where: { id: tenant2UserId } });
      expect(user).not.toBeNull();
      expect(user?.tenantId).toBe(TENANT_2_ID);
    });
  });

  describe('Super Admin Access', () => {
    let superAdminId: string;

    beforeAll(async () => {
      if (!hasTestDatabase) return;

      // Create super admin user (tenantId = null)
      await prisma.setTenantContext(null);

      // Valid bcrypt hash (60 chars) for password "test123"
      const validBcryptHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2';

      const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@test.com' },
        create: {
          email: 'superadmin@test.com',
          password: validBcryptHash,
          firstName: 'Super',
          lastName: 'Admin',
          tenantId: null, // Super admin has no tenant
          roleId: 'test-role-id',
          status: 'active',
        },
        update: {},
      });
      superAdminId = superAdmin.id;
    });

    afterAll(async () => {
      if (!hasTestDatabase) return;

      await prisma.setTenantContext(null);
      if (superAdminId) {
        await prisma.user.delete({ where: { id: superAdminId } });
      }
    });

    it('should allow super admin to see all tenant data', async () => {
      if (!hasTestDatabase) return;

      const payload: JwtPayload = {
        sub: superAdminId,
        email: 'superadmin@test.com',
        tenantId: null, // Super admin
        roleId: 'test-role-id',
        permissions: ['*'],
      };

      await strategy.validate(payload);

      // Verify tenant context is cleared
      const context = await prisma.getTenantContext();
      expect(context).toBe('');

      // Query users - should see ALL users from all tenants
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: ['tenant1@test.com', 'tenant2@test.com', 'superadmin@test.com'],
          },
        },
        select: { id: true, email: true, tenantId: true },
      });

      // Should see users from both tenants + super admin
      expect(users.length).toBeGreaterThanOrEqual(3);

      // Should include tenant 1 user
      expect(users.some((u) => u.tenantId === TENANT_1_ID)).toBe(true);

      // Should include tenant 2 user
      expect(users.some((u) => u.tenantId === TENANT_2_ID)).toBe(true);

      // Should include super admin (tenantId = null)
      expect(users.some((u) => u.tenantId === null)).toBe(true);
    });

    it('should allow super admin to query specific tenant data', async () => {
      if (!hasTestDatabase) return;

      await prisma.setTenantContext(null);

      // Super admin can query tenant 1 data
      const tenant1Users = await prisma.user.findMany({
        where: { tenantId: TENANT_1_ID },
      });
      expect(tenant1Users.length).toBeGreaterThan(0);

      // Super admin can query tenant 2 data
      const tenant2Users = await prisma.user.findMany({
        where: { tenantId: TENANT_2_ID },
      });
      expect(tenant2Users.length).toBeGreaterThan(0);
    });
  });

  describe('RLS Policy Verification', () => {
    it('should have RLS enabled on User table', async () => {
      if (!hasTestDatabase) return;

      await prisma.setTenantContext(null);

      const result = await prisma.$queryRaw<Array<{ rowsecurity: boolean }>>`
        SELECT rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'User'
      `;

      expect(result[0]?.rowsecurity).toBe(true);
    });

    it('should have tenant_isolation_policy on User table', async () => {
      if (!hasTestDatabase) return;

      await prisma.setTenantContext(null);

      const result = await prisma.$queryRaw<Array<{ policyname: string }>>`
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'User'
      `;

      expect(result.some((r) => r.policyname === 'tenant_isolation_policy')).toBe(true);
    });

    it('should have set_tenant_context function available', async () => {
      if (!hasTestDatabase) return;

      await prisma.setTenantContext(null);

      const result = await prisma.$queryRaw<Array<{ proname: string }>>`
        SELECT proname
        FROM pg_proc
        WHERE proname = 'set_tenant_context'
      `;

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
