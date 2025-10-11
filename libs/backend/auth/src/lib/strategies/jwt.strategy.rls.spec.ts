/**
 * Row-Level Security Tests for JWT Strategy
 * These tests work with both real PostgreSQL and mocked environments
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { RlsTestContext } from './rls-test-helpers';
import { setupRlsTestDatabase, rlsAssertions, withTenantContext } from './rls-test-helpers';
import { JwtStrategy } from './jwt.strategy';
import type { JwtPayload } from '@ftry/shared/types';

// Environment-aware test runner
const isCI = process.env['CI'] === 'true';
const useRealDatabase = process.env['TEST_DATABASE_URL'] !== undefined;

describe('RLS - JWT Strategy Integration', () => {
  let context: RlsTestContext;
  let strategy: JwtStrategy;

  beforeAll(async () => {
    if (!useRealDatabase && !isCI) {
      // Skip RLS tests in local dev without test database
      console.warn('⚠️ Skipping RLS integration tests - no test database configured');
      return;
    }

    context = await setupRlsTestDatabase({
      useRealDatabase,
      databaseUrl: process.env['TEST_DATABASE_URL'],
    });

    // Mock other dependencies
    const mockUserValidation = {
      validateUserStatus: jest.fn(),
    };

    const mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    strategy = new JwtStrategy(
      context.prisma as any,
      mockUserValidation as any,
      mockCache as any,
      mockConfig as any,
    );
  });

  afterAll(async () => {
    if (context) {
      await context.cleanup();
    }
  });

  describe('Tenant Isolation', () => {
    it('should isolate data between tenants', async () => {
      if (!context) return;

      const tenant1User = context.users[0];
      const tenant2User = context.users[1];

      if (!tenant1User || !tenant2User) {
        console.warn('Test users not found');
        return;
      }

      // Set context for tenant 1
      const payload1: JwtPayload = {
        sub: tenant1User.id,
        email: tenant1User.email,
        tenantId: tenant1User.tenantId!,
        roleId: tenant1User.roleId,
        permissions: ['test:read'],
      };

      await strategy.validate(payload1);

      // Query users - should only see tenant 1
      const users1 = await context.prisma.user.findMany();
      expect(users1.every((u) => u.tenantId === tenant1User.tenantId || u.tenantId === null)).toBe(
        true,
      );
      expect(users1.some((u) => u.id === tenant1User.id)).toBe(true);
      expect(users1.some((u) => u.id === tenant2User.id)).toBe(false);

      // Switch to tenant 2
      const payload2: JwtPayload = {
        sub: tenant2User.id,
        email: tenant2User.email,
        tenantId: tenant2User.tenantId!,
        roleId: tenant2User.roleId,
        permissions: ['test:read'],
      };

      await strategy.validate(payload2);

      // Query users - should only see tenant 2
      const users2 = await context.prisma.user.findMany();
      expect(users2.every((u) => u.tenantId === tenant2User.tenantId || u.tenantId === null)).toBe(
        true,
      );
      expect(users2.some((u) => u.id === tenant2User.id)).toBe(true);
      expect(users2.some((u) => u.id === tenant1User.id)).toBe(false);
    });

    it('should block cross-tenant access attempts', async () => {
      if (!context) return;

      const tenant1User = context.users[0];
      const tenant2User = context.users[1];

      if (!tenant1User || !tenant2User) {
        console.warn('Test users not found');
        return;
      }

      // Set context for tenant 1
      await context.prisma.setTenantContext(tenant1User.tenantId);

      // Try to access tenant 2 user
      const crossTenantUser = await context.prisma.user.findUnique({
        where: { id: tenant2User.id },
      });

      expect(crossTenantUser).toBeNull();
    });

    it('should block cross-tenant access even with explicit WHERE clause', async () => {
      if (!context) return;

      const tenant1User = context.users[0];

      if (!tenant1User) {
        console.warn('Test user not found');
        return;
      }

      // Set context for tenant 1
      await context.prisma.setTenantContext(tenant1User.tenantId);

      // Try to query tenant 2 users explicitly
      const tenant2Users = await context.prisma.user.findMany({
        where: { tenantId: 'test-tenant-2' },
      });

      expect(tenant2Users).toHaveLength(0);
    });
  });

  describe('Super Admin Access', () => {
    it('should allow super admin to see all tenant data', async () => {
      if (!context) return;

      const superAdmin = context.users[2]; // Third user is super admin

      if (!superAdmin) {
        console.warn('Super admin user not found');
        return;
      }

      const payload: JwtPayload = {
        sub: superAdmin.id,
        email: superAdmin.email,
        tenantId: null,
        roleId: superAdmin.roleId,
        permissions: ['*'],
      };

      await strategy.validate(payload);

      // Query users - should see all
      const users = await context.prisma.user.findMany();

      // Should see users from both tenants
      const tenants = new Set(users.map((u) => u.tenantId).filter((t) => t !== null));
      expect(tenants.size).toBeGreaterThanOrEqual(2);
      expect(tenants.has('test-tenant-1')).toBe(true);
      expect(tenants.has('test-tenant-2')).toBe(true);
    });

    it('should allow super admin to query specific tenant data', async () => {
      if (!context) return;

      // Set super admin context
      await context.prisma.setTenantContext(null);

      // Should be able to query any tenant's data
      const tenant1Users = await context.prisma.user.findMany({
        where: { tenantId: 'test-tenant-1' },
      });
      expect(tenant1Users.length).toBeGreaterThan(0);

      const tenant2Users = await context.prisma.user.findMany({
        where: { tenantId: 'test-tenant-2' },
      });
      expect(tenant2Users.length).toBeGreaterThan(0);
    });
  });

  describe('Context Switching', () => {
    it('should properly switch contexts between requests', async () => {
      if (!context) return;

      const tenant1User = context.users[0];
      const tenant2User = context.users[1];

      if (!tenant1User || !tenant2User) {
        console.warn('Test users not found');
        return;
      }

      // Request 1: Tenant 1
      await context.prisma.setTenantContext(tenant1User.tenantId);
      let currentContext = await context.prisma.getTenantContext();
      expect(currentContext).toBe(tenant1User.tenantId);

      let user = await context.prisma.user.findUnique({
        where: { id: tenant1User.id },
      });
      expect(user).not.toBeNull();

      // Request 2: Tenant 2 (simulate new request)
      await context.prisma.setTenantContext(tenant2User.tenantId);
      currentContext = await context.prisma.getTenantContext();
      expect(currentContext).toBe(tenant2User.tenantId);

      // Now tenant 1 user should be inaccessible
      user = await context.prisma.user.findUnique({
        where: { id: tenant1User.id },
      });
      expect(user).toBeNull();

      // But tenant 2 user should be accessible
      user = await context.prisma.user.findUnique({
        where: { id: tenant2User.id },
      });
      expect(user).not.toBeNull();
    });
  });

  describe('RLS Assertions', () => {
    it('should pass tenant isolation assertion', async () => {
      if (!context) return;

      const tenant1User = context.users[0];

      if (!tenant1User) {
        console.warn('Test user not found');
        return;
      }

      await expect(
        rlsAssertions.assertTenantIsolation(context.prisma, tenant1User.id, tenant1User.tenantId!),
      ).resolves.not.toThrow();
    });

    it('should pass cross-tenant block assertion', async () => {
      if (!context) return;

      const tenant1User = context.users[0];
      const tenant2User = context.users[1];

      if (!tenant1User || !tenant2User) {
        console.warn('Test users not found');
        return;
      }

      await expect(
        rlsAssertions.assertCrossTenantBlocked(
          context.prisma,
          tenant1User.tenantId!,
          tenant2User.id,
        ),
      ).resolves.not.toThrow();
    });

    it('should pass super admin access assertion', async () => {
      if (!context) return;

      await expect(rlsAssertions.assertSuperAdminAccess(context.prisma)).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle rapid context switching', async () => {
      if (!context) return;

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const tenantId = i % 2 === 0 ? 'test-tenant-1' : 'test-tenant-2';
        await context.prisma.setTenantContext(tenantId);

        const users = await context.prisma.user.findMany({
          take: 1,
        });

        expect(users.length).toBeLessThanOrEqual(1);
      }

      const duration = Date.now() - startTime;
      const avgTime = duration / iterations;

      // Should be fast (< 50ms per operation)
      expect(avgTime).toBeLessThan(50);
      console.warn(`RLS context switch avg time: ${avgTime.toFixed(2)}ms`);
    });
  });
});

describe('RLS - Mock Tests (No Database)', () => {
  it('should test RLS logic without database', async () => {
    const { MockRlsService } = await import('./rls-test-helpers');
    const mockRls = new MockRlsService();

    // Add mock data
    mockRls.addMockData('user', [
      { id: '1', email: 'user1@test.com', tenantId: 'tenant-1' },
      { id: '2', email: 'user2@test.com', tenantId: 'tenant-2' },
      { id: '3', email: 'admin@test.com', tenantId: null },
    ]);

    // Test tenant 1 isolation
    mockRls.setTenantContext('tenant-1');
    const tenant1Users = mockRls.findMany('user');
    expect(tenant1Users).toHaveLength(2); // tenant-1 user + super admin
    expect(tenant1Users.every((u) => u.tenantId === 'tenant-1' || u.tenantId === null)).toBe(true);

    // Test tenant 2 isolation
    mockRls.setTenantContext('tenant-2');
    const tenant2Users = mockRls.findMany('user');
    expect(tenant2Users).toHaveLength(2); // tenant-2 user + super admin
    expect(tenant2Users.every((u) => u.tenantId === 'tenant-2' || u.tenantId === null)).toBe(true);

    // Test super admin access
    mockRls.setTenantContext(null);
    const allUsers = mockRls.findMany('user');
    expect(allUsers).toHaveLength(3); // All users

    // Test cross-tenant block
    mockRls.setTenantContext('tenant-1');
    const crossTenantUser = mockRls.findUnique('user', '2');
    expect(crossTenantUser).toBeNull();
  });
});
