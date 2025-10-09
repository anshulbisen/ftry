-- ============================================================
-- DATABASE SEED VERIFICATION QUERIES
-- ============================================================
-- Use these queries to verify that database seeds were successful
-- Run these in Prisma Studio or pgAdmin
-- ============================================================

-- 1. COUNT PERMISSIONS
-- Expected: 51 total (31 admin + 20 tenant-scoped)
SELECT 
  category,
  COUNT(*) as count
FROM "Permission"
GROUP BY category
ORDER BY count DESC;

-- 2. LIST ALL ADMIN PERMISSIONS
-- Expected: 31 permissions
SELECT 
  name,
  resource,
  action,
  description
FROM "Permission"
WHERE category = 'admin'
ORDER BY resource, action;

-- 3. LIST ALL SYSTEM ROLES
-- Expected: 9 roles (4 admin + 5 tenant-scoped)
SELECT 
  name,
  type,
  level,
  "isSystem",
  "isDefault",
  "tenantId",
  array_length(permissions, 1) as permission_count
FROM "Role"
WHERE "isSystem" = true
ORDER BY level DESC;

-- 4. VERIFY SUPER ADMIN USER
-- Expected: 1 user with tenantId = NULL and Super Admin role
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  u."tenantId",
  u.status,
  u."emailVerified",
  r.name as role_name,
  r.level as role_level,
  array_length(r.permissions, 1) as permission_count
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
WHERE u."tenantId" IS NULL;

-- 5. LIST ALL DEMO TENANTS
-- Expected: 2 tenants (Glamour Salon, Elegance Beauty)
SELECT 
  id,
  name,
  slug,
  "subscriptionPlan",
  "maxUsers",
  (SELECT COUNT(*) FROM "User" WHERE "tenantId" = t.id) as user_count,
  "createdAt"
FROM "Tenant" t
ORDER BY name;

-- 6. LIST ALL TENANT USERS WITH ROLES
-- Expected: 4 users (2 per tenant)
SELECT 
  t.name as tenant_name,
  u.email,
  u."firstName",
  u."lastName",
  r.name as role_name,
  r.level as role_level,
  u.status,
  u."emailVerified"
FROM "User" u
INNER JOIN "Tenant" t ON u."tenantId" = t.id
LEFT JOIN "Role" r ON u."roleId" = r.id
ORDER BY t.name, r.level DESC;

-- 7. COUNT USERS BY TYPE
-- Expected: 1 super admin, 4 tenant users
SELECT 
  CASE 
    WHEN "tenantId" IS NULL THEN 'Super Admin'
    ELSE 'Tenant User'
  END as user_type,
  COUNT(*) as count
FROM "User"
GROUP BY user_type;

-- 8. VERIFY ROLE PERMISSION COUNTS
-- Check that all roles have expected number of permissions
SELECT 
  name,
  type,
  level,
  array_length(permissions, 1) as permission_count,
  "isSystem",
  "tenantId"
FROM "Role"
WHERE "isSystem" = true
ORDER BY level DESC;

-- 9. CHECK SUPER ADMIN PERMISSIONS
-- Verify Super Admin has all 31 admin permissions
SELECT 
  r.name as role_name,
  r.level,
  array_length(r.permissions, 1) as permission_count,
  r.permissions
FROM "Role" r
WHERE r.name = 'Super Admin'
  AND r."tenantId" IS NULL;

-- 10. VERIFY EMAIL UNIQUENESS (CROSS-TENANT)
-- Should show same emails can exist across different tenants
SELECT 
  email,
  COUNT(*) as usage_count,
  array_agg(COALESCE(t.name, 'Super Admin')) as used_by
FROM "User" u
LEFT JOIN "Tenant" t ON u."tenantId" = t.id
GROUP BY email
ORDER BY usage_count DESC;

-- 11. AUDIT LOG CHECK (If any exist)
-- Verify audit logs were created for user creations
SELECT 
  action,
  entity,
  COUNT(*) as count
FROM "AuditLog"
GROUP BY action, entity
ORDER BY count DESC;

-- 12. SESSION AND TOKEN CHECK
-- Should be empty initially (no active sessions yet)
SELECT 
  'Sessions' as table_name,
  COUNT(*) as count
FROM "Session"
UNION ALL
SELECT 
  'RefreshTokens' as table_name,
  COUNT(*) as count
FROM "RefreshToken";

-- ============================================================
-- HEALTH CHECK QUERY
-- Run this to get a complete overview
-- ============================================================
SELECT 
  'Permissions' as category,
  COUNT(*)::text as value
FROM "Permission"
UNION ALL
SELECT 
  'Roles',
  COUNT(*)::text
FROM "Role"
WHERE "isSystem" = true
UNION ALL
SELECT 
  'Super Admins',
  COUNT(*)::text
FROM "User"
WHERE "tenantId" IS NULL
UNION ALL
SELECT 
  'Tenants',
  COUNT(*)::text
FROM "Tenant"
UNION ALL
SELECT 
  'Tenant Users',
  COUNT(*)::text
FROM "User"
WHERE "tenantId" IS NOT NULL
UNION ALL
SELECT 
  'Total Users',
  COUNT(*)::text
FROM "User";
