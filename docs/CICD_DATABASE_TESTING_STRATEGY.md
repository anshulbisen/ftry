# CI/CD Database Testing Strategy

Complete guide for realistic database testing in GitHub Actions CI/CD pipeline.

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Test Database Layers](#test-database-layers)
3. [Seeding Strategies](#seeding-strategies)
4. [Best Practices](#best-practices)
5. [Common Pitfalls](#common-pitfalls)

## Current Architecture

### GitHub Actions Service Containers

```yaml
services:
  postgres:
    image: postgres:18-alpine # Match production version
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ftry_test # Isolated test database
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

**Benefits:**

- ✅ Each job gets fresh PostgreSQL instance
- ✅ Automatic cleanup after job completes
- ✅ Network isolation between jobs
- ✅ Same PostgreSQL version as production (18)

### Test Workflow Stages

```
1. Start PostgreSQL container
   ↓
2. Wait for health check (pg_isready)
   ↓
3. Create schema (prisma db push)
   ↓
4. Apply migrations (prisma migrate deploy)
   ↓
5. Seed test data (optional)
   ↓
6. Run tests
   ↓
7. Cleanup (automatic on job end)
```

## Test Database Layers

### Layer 1: Unit Tests (No Database)

**Purpose**: Fast, isolated logic testing

```typescript
describe('RLS - Mock Tests', () => {
  it('should enforce tenant isolation', () => {
    const mockRls = new MockRlsService();
    mockRls.addMockData('user', [
      { id: '1', tenantId: 'tenant-1' },
      { id: '2', tenantId: 'tenant-2' },
    ]);

    mockRls.setTenantContext('tenant-1');
    const users = mockRls.findMany('user');

    expect(users).toHaveLength(1);
  });
});
```

**Characteristics:**

- No database required
- Runs in <1 second
- Perfect for CI/CD fast feedback
- Limited realism

### Layer 2: Integration Tests (Real Database)

**Purpose**: Test with actual PostgreSQL + RLS policies

```typescript
describe('RLS - Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Uses TEST_DATABASE_URL from GitHub Actions
    prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL },
      },
    });
  });

  it('should enforce tenant isolation in real database', async () => {
    await prisma.setTenantContext('tenant-1');
    const users = await prisma.user.findMany();

    expect(users.every((u) => u.tenantId === 'tenant-1' || u.tenantId === null)).toBe(true);
  });
});
```

**Characteristics:**

- Real PostgreSQL database
- RLS policies enforced
- Actual SQL execution
- Realistic but slower (~5-10s)

### Layer 3: E2E Tests (Full Stack)

**Purpose**: Test entire request → response cycle

```typescript
describe('Auth E2E', () => {
  it('should isolate tenant data via API', async () => {
    // Login as tenant 1 user
    const response1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user1@tenant1.com', password: 'password' });

    const token1 = response1.body.accessToken;

    // Query users - should only see tenant 1
    const users = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token1}`);

    expect(users.body.data.every((u) => u.tenantId === 'tenant-1')).toBe(true);
  });
});
```

**Characteristics:**

- Full HTTP → Database → Response cycle
- JWT authentication included
- RLS context automatically set
- Most realistic, slowest (~30s)

## Seeding Strategies

### Strategy 1: Minimal Fixtures (Recommended for Integration Tests)

Create minimal data for each test case.

```typescript
// libs/backend/auth/src/lib/test-fixtures/minimal-seed.ts

export async function seedMinimalTestData(prisma: PrismaClient) {
  // Clear existing data
  await prisma.$executeRawUnsafe("SET LOCAL app.current_tenant = ''"); // Super admin

  // Create 2 test tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      id: 'test-tenant-1',
      name: 'Test Salon 1',
      slug: 'test-salon-1',
      status: 'active',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      id: 'test-tenant-2',
      name: 'Test Salon 2',
      slug: 'test-salon-2',
      status: 'active',
    },
  });

  // Create test role
  const role = await prisma.role.create({
    data: {
      id: 'test-role',
      name: 'Test Role',
      permissions: ['users:read', 'users:write'],
      type: 'custom',
      tenantId: tenant1.id,
    },
  });

  // Create 1 user per tenant
  const user1 = await prisma.user.create({
    data: {
      id: 'test-user-1',
      email: 'user1@test.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2', // "password123"
      firstName: 'Test',
      lastName: 'User 1',
      tenantId: tenant1.id,
      roleId: role.id,
      status: 'active',
      emailVerified: true,
    },
  });

  // Create super admin
  const superAdmin = await prisma.user.create({
    data: {
      id: 'test-super-admin',
      email: 'admin@test.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
      firstName: 'Super',
      lastName: 'Admin',
      tenantId: null, // NULL = super admin
      roleId: role.id,
      status: 'active',
      emailVerified: true,
    },
  });

  return { tenant1, tenant2, role, user1, superAdmin };
}
```

**When to use:**

- Integration tests
- RLS tests
- Security audit tests

**Benefits:**

- Fast to seed (~100ms)
- Predictable data
- Easy to reason about

### Strategy 2: Realistic Volume (For Performance Tests)

Seed data that mimics production volume.

```typescript
// .github/scripts/seed-performance-test.ts

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seedPerformanceData() {
  console.log('🌱 Seeding performance test data...');

  await prisma.$executeRawUnsafe("SET LOCAL app.current_tenant = ''"); // Bypass RLS

  // Create 10 tenants
  const tenants = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.tenant.create({
        data: {
          name: faker.company.name(),
          slug: `tenant-${i + 1}`,
          status: 'active',
        },
      }),
    ),
  );

  console.log(`✅ Created ${tenants.length} tenants`);

  // Create roles
  const roles = await Promise.all(
    tenants.map((tenant) =>
      prisma.role.create({
        data: {
          name: 'Staff',
          tenantId: tenant.id,
          permissions: ['appointments:read', 'clients:read'],
          type: 'custom',
        },
      }),
    ),
  );

  console.log(`✅ Created ${roles.length} roles`);

  // Create 100 users per tenant (1000 total)
  for (const tenant of tenants) {
    const role = roles.find((r) => r.tenantId === tenant.id)!;

    await prisma.user.createMany({
      data: Array.from({ length: 100 }, () => ({
        email: faker.internet.email(),
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        tenantId: tenant.id,
        roleId: role.id,
        status: 'active',
        emailVerified: true,
      })),
    });
  }

  console.log('✅ Created 1000 users');

  // Create appointments (10 per user = 10,000 appointments)
  const users = await prisma.user.findMany();

  for (const user of users) {
    if (!user.tenantId) continue;

    await prisma.appointment.createMany({
      data: Array.from({ length: 10 }, () => ({
        tenantId: user.tenantId!,
        staffId: user.id,
        startTime: faker.date.future(),
        endTime: faker.date.future(),
        status: 'confirmed',
        notes: faker.lorem.sentence(),
      })),
    });
  }

  console.log('✅ Created 10,000 appointments');
  console.log('🎉 Performance data seeded successfully');
}

seedPerformanceData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**When to use:**

- Performance benchmarks
- Load testing
- Query optimization tests

**Benefits:**

- Realistic query performance
- Identifies N+1 queries
- Tests index effectiveness

**Trade-offs:**

- Slower to seed (~10-30s)
- More memory usage
- Longer test runtime

### Strategy 3: Production Snapshot (For Staging)

Use anonymized production data dump.

```bash
# .github/scripts/create-test-snapshot.sh

#!/bin/bash
# Run this MANUALLY to create test snapshot from production

# Dump production schema + anonymized data
pg_dump $PRODUCTION_DATABASE_URL \
  --schema-only \
  --no-owner \
  --no-acl \
  > schema.sql

# Anonymize sensitive data
pg_dump $PRODUCTION_DATABASE_URL \
  --data-only \
  --table=Tenant \
  --table=Role \
  --table=Permission \
  | sed 's/real-email@example\.com/test-email@example.com/g' \
  | sed 's/555-1234/555-0000/g' \
  > anonymized-data.sql

# Combine
cat schema.sql anonymized-data.sql > test-snapshot.sql
```

**When to use:**

- Staging environment
- Pre-production testing
- Migration testing

**Benefits:**

- Most realistic
- Tests edge cases from production
- Validates migrations

**Trade-offs:**

- Requires manual updates
- Privacy concerns (must anonymize)
- Large file size

## Best Practices

### 1. Isolation Between Tests

**Problem**: Tests interfere with each other

```typescript
// ❌ BAD: Shared state
beforeAll(async () => {
  await seedTestData(prisma);
});

it('test 1', async () => {
  await prisma.user.create({ ... }); // Pollutes database
});

it('test 2', async () => {
  const users = await prisma.user.findMany(); // Sees test 1's user!
});
```

**Solution**: Use transactions or cleanup hooks

```typescript
// ✅ GOOD: Transaction isolation
it('test 1', async () => {
  await prisma.$transaction(async (tx) => {
    await tx.user.create({ ... });
    // Test logic here
    // Automatically rolls back after test
  });
});

// ✅ GOOD: Cleanup hook
afterEach(async () => {
  await prisma.$executeRawUnsafe('SET LOCAL app.current_tenant = \'\'');
  await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
});
```

### 2. Predictable IDs

**Problem**: Random IDs make tests flaky

```typescript
// ❌ BAD: Random ID from database
const user = await prisma.user.create({ data: { ... } });
expect(user.id).toBe(???); // What ID will it be?
```

**Solution**: Use deterministic IDs

```typescript
// ✅ GOOD: Explicit ID
const user = await prisma.user.create({
  data: {
    id: 'test-user-123',
    email: 'user@test.com',
    // ...
  },
});

expect(user.id).toBe('test-user-123'); // Predictable!
```

### 3. Parallel Test Safety

**Problem**: Tests run in parallel and conflict

```typescript
// ❌ BAD: Fixed IDs conflict
it('test 1', async () => {
  await prisma.tenant.create({ data: { id: 'test-tenant', ... } });
});

it('test 2', async () => {
  await prisma.tenant.create({ data: { id: 'test-tenant', ... } }); // CONFLICT!
});
```

**Solution**: Use unique IDs per test

```typescript
// ✅ GOOD: Unique IDs
it('test 1', async () => {
  const tenantId = `test-tenant-${Date.now()}-1`;
  await prisma.tenant.create({ data: { id: tenantId, ... } });
});

it('test 2', async () => {
  const tenantId = `test-tenant-${Date.now()}-2`;
  await prisma.tenant.create({ data: { id: tenantId, ... } });
});
```

### 4. Test Database URLs

**Environment-specific URLs:**

```bash
# .env.test (local development)
DATABASE_URL="postgresql://localhost:5432/ftry_dev"
TEST_DATABASE_URL="postgresql://localhost:5432/ftry_test"

# GitHub Actions (automatic)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ftry_test"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ftry_test"

# Staging
DATABASE_URL="postgresql://staging-db:5432/ftry_staging"
```

**Prisma configuration:**

```typescript
// Use TEST_DATABASE_URL if available
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['TEST_DATABASE_URL'] || process.env['DATABASE_URL'],
    },
  },
});
```

### 5. Migration Testing

**Test migrations in CI before production:**

```yaml
- name: Test migration safety
  run: |
    # Apply current migrations
    bunx prisma migrate deploy

    # Seed with production-like data
    bun run .github/scripts/seed-performance-test.ts

    # Create new migration (from PR changes)
    bunx prisma migrate dev --name test_migration --skip-generate

    # Verify no data loss
    bun run .github/scripts/verify-data-integrity.ts

    # Rollback test
    bunx prisma migrate reset --force
```

### 6. Health Checks Before Tests

**Wait for database to be ready:**

```yaml
- name: Wait for PostgreSQL
  run: |
    until pg_isready -h localhost -p 5432; do
      echo "Waiting for PostgreSQL..."
      sleep 2
    done

- name: Verify database connection
  run: |
    bunx prisma db execute --stdin <<SQL
      SELECT version();
    SQL
```

### 7. Test Data Cleanup

**Always clean up after tests:**

```typescript
// Global cleanup hook
afterAll(async () => {
  await prisma.$executeRawUnsafe("SET LOCAL app.current_tenant = ''");

  // Delete test data
  await prisma.$executeRawUnsafe(`
    DELETE FROM "User" WHERE email LIKE '%@test.com';
    DELETE FROM "Tenant" WHERE slug LIKE 'test-%';
    DELETE FROM "Role" WHERE id LIKE 'test-%';
  `);

  await prisma.$disconnect();
});
```

## Common Pitfalls

### Pitfall 1: Using Production Database in Tests

```typescript
// ❌ DANGER: Could accidentally use production!
const prisma = new PrismaClient(); // Uses DATABASE_URL

// ✅ SAFE: Explicit test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['TEST_DATABASE_URL'] || 'postgresql://localhost:5432/ftry_test',
    },
  },
});

// ✅ SAFER: Fail if TEST_DATABASE_URL not set in CI
if (process.env['CI'] && !process.env['TEST_DATABASE_URL']) {
  throw new Error('TEST_DATABASE_URL must be set in CI');
}
```

### Pitfall 2: Forgetting RLS Context

```typescript
// ❌ BAD: RLS blocks query
await prisma.user.create({ data: { tenantId: 'tenant-1', ... } });
// Error: RLS policy violation!

// ✅ GOOD: Set context first
await prisma.$executeRawUnsafe('SET LOCAL app.current_tenant = \'\''); // Super admin
await prisma.user.create({ data: { tenantId: 'tenant-1', ... } });
```

### Pitfall 3: Slow Test Suite

```typescript
// ❌ BAD: Seeding in every test
beforeEach(async () => {
  await seedLargeDataset(prisma); // 10 seconds!
});

// ✅ GOOD: Seed once, clean between tests
beforeAll(async () => {
  await seedMinimalFixtures(prisma); // 100ms
});

afterEach(async () => {
  await cleanupTestData(prisma); // 50ms
});
```

### Pitfall 4: Inconsistent Schema

```typescript
// ❌ BAD: Schema drift
// CI uses: prisma db push (development schema)
// Production uses: prisma migrate deploy (production schema)

// ✅ GOOD: Same migration path
// CI:         prisma migrate deploy
// Production: prisma migrate deploy
```

### Pitfall 5: Missing Indexes in Tests

```sql
-- ❌ BAD: Tests run on tables without indexes
-- Production has: CREATE INDEX idx_users_tenant ON "User"("tenantId");
-- Test database: No indexes (if using db push without migrations)

-- ✅ GOOD: Apply migrations to get indexes
bunx prisma migrate deploy
```

## CI/CD Workflow Checklist

- [ ] Use PostgreSQL service container matching production version
- [ ] Health checks before running tests
- [ ] Apply migrations (not just db push) for realistic schema
- [ ] Seed minimal data for integration tests
- [ ] Seed realistic volume for performance tests
- [ ] Use transactions for test isolation
- [ ] Clean up test data after each test
- [ ] Set TEST_DATABASE_URL explicitly
- [ ] Verify RLS policies are active
- [ ] Test migrations before deploying
- [ ] Monitor test database resource usage
- [ ] Keep test runtime < 5 minutes total

## Performance Benchmarks

### Target Test Times

| Test Layer          | Target     | Current   | Status |
| ------------------- | ---------- | --------- | ------ |
| Unit tests (mocked) | < 1s       | ~0.5s     | ✅     |
| Integration tests   | < 10s      | ~8s       | ✅     |
| E2E tests           | < 30s      | ~25s      | ✅     |
| Performance tests   | < 60s      | ~45s      | ✅     |
| **Total CI/CD**     | **< 5min** | **~3min** | ✅     |

### Database Metrics

| Metric             | Value |
| ------------------ | ----- |
| PostgreSQL startup | ~2s   |
| Schema creation    | ~1s   |
| Migration deploy   | ~2s   |
| Minimal seed       | ~0.1s |
| Performance seed   | ~15s  |
| Test execution     | ~8s   |
| Cleanup            | ~1s   |

## Resources

- [GitHub Actions Service Containers](https://docs.github.com/en/actions/using-containerized-services/about-service-containers)
- [Prisma Testing Best Practices](https://www.prisma.io/docs/guides/testing)
- [PostgreSQL Docker Images](https://hub.docker.com/_/postgres)

---

**Last Updated**: 2025-10-10
**Status**: Production-ready CI/CD testing strategy
