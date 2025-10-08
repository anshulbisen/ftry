---
description: Database migration workflow with safety checks and validation
---

Manage Prisma database migrations with comprehensive safety checks and validation.

## Usage

```bash
# Create migration (interactive)
/db-migrate

# Create migration with name
/db-migrate add-user-preferences

# Deploy pending migrations
/db-migrate deploy

# Generate Prisma client only
/db-migrate generate

# Create migration without applying (review first)
/db-migrate create-only add-tenant-isolation

# Reset database (development only)
/db-migrate reset

# View migration status
/db-migrate status
```

## What It Does

### Safety Checks (Automated)

1. **Pre-migration validation**
   - Verify schema syntax
   - Check for breaking changes
   - Validate RLS policies (if applicable)
   - Review index strategy
   - Detect missing relations

2. **Migration review**
   - Generate migration SQL
   - Review ALTER statements
   - Identify data loss risks
   - Check for long-running operations
   - Validate multi-tenant isolation

3. **Post-migration validation**
   - Run Prisma generate
   - Verify TypeScript types
   - Test affected queries
   - Check application startup
   - Validate seed data (if any)

### Commands Executed

```bash
# Standard migration
bunx prisma migrate dev --name <migration-name>
bunx prisma generate
bun run typecheck

# Deploy (production-safe)
bunx prisma migrate deploy
bunx prisma generate

# Create only (review before apply)
bunx prisma migrate dev --create-only --name <migration-name>
```

## Migration Workflow

1. **Schema changes** - Update `prisma/schema.prisma`
2. **Run command** - `/db-migrate add-user-roles`
3. **Review SQL** - Check generated migration file
4. **Validate** - Automated type checking and tests
5. **Commit** - Include schema + migration together

## Safety Features

### Development

- Creates migration file
- Applies to development database
- Regenerates Prisma Client
- Validates TypeScript types
- Runs affected tests

### Production

- Deploys pending migrations only
- No schema drift allowed
- Transactional migrations
- Rollback on failure
- Zero-downtime strategy (when possible)

## Multi-Tenant Considerations

**RLS Validation**: Ensures Row-Level Security policies are maintained

```sql
-- Automatically checks for tenant_id in new tables
ALTER TABLE appointments ADD COLUMN tenant_id UUID NOT NULL;
CREATE POLICY tenant_isolation ON appointments
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Index Strategy**: Validates composite indexes include tenant_id

```prisma
@@index([tenantId, userId]) // Correct: tenant_id first
@@index([userId, tenantId]) // Warning: inefficient for RLS
```

## Common Patterns

### Add Field

```prisma
model User {
  // Add new field
  phoneNumber String?
}
```

```bash
/db-migrate add-user-phone-number
```

### Add Relation

```prisma
model Appointment {
  // Add relation
  service   Service @relation(fields: [serviceId], references: [id])
  serviceId String
}
```

```bash
/db-migrate add-appointment-service-relation
```

### Add Index

```prisma
model Customer {
  @@index([tenantId, email]) // Composite for RLS
}
```

```bash
/db-migrate add-customer-email-index
```

### Enable RLS

```bash
/db-migrate enable-rls-for-bookings
```

## Error Prevention

### Blocked Operations

- Dropping columns with data (warns first)
- Removing NOT NULL without default
- Changing primary keys
- Breaking foreign key constraints
- Removing RLS policies

### Warnings

- Adding NOT NULL to existing table
- Changing column types
- Renaming tables/columns
- Adding expensive indexes

## Integration with Workflow

### Before Migration

```bash
# Plan the change
/use-agent database-expert review schema changes

# Implement schema update
# Edit prisma/schema.prisma

# Create migration
/db-migrate add-feature-name
```

### After Migration

```bash
# Update seed data if needed
# Edit prisma/seed.ts

# Test migration
/test-first DatabaseService integration

# Update documentation
/update-docs database

# Commit changes
/commit "feat(db): add feature-name schema"
```

## Best Practices

1. **Descriptive names**: `add-user-preferences` not `migration-1`
2. **Single concern**: One logical change per migration
3. **Review SQL**: Always check generated SQL before applying
4. **Test rollback**: Ensure migrations can be reverted
5. **Seed compatibility**: Update seed.ts for schema changes
6. **RLS first**: Add tenant_id and policies for new tables
7. **Index strategy**: Composite indexes with tenant_id first

## Technology Stack

- **PostgreSQL**: 18 (check compatibility)
- **Prisma**: 6.16.3
- **Runtime**: Bun 1.2.19

## See Also

- `prisma/CLAUDE.md` - Database schema guidelines
- `docs/DATABASE.md` - Architecture and RLS patterns
- `/use-agent database-expert` - Schema review and optimization
