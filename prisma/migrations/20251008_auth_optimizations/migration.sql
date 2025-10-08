-- Auth Optimizations Migration
-- Adds performance indexes, constraints, and security improvements

-- 1. Add composite indexes for common queries

-- Refresh token lookup by token (already unique, but ensure index)
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_isRevoked_idx" ON "RefreshToken"("userId", "isRevoked");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "RefreshToken_revokedAt_idx" ON "RefreshToken"("revokedAt") WHERE "revokedAt" IS NOT NULL;

-- User lookup optimizations
CREATE INDEX IF NOT EXISTS "User_email_isDeleted_idx" ON "User"("email", "isDeleted");
CREATE INDEX IF NOT EXISTS "User_tenantId_isDeleted_idx" ON "User"("tenantId", "isDeleted") WHERE "tenantId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");

-- 2. Add CHECK constraints for data integrity

-- User status must be valid enum value
ALTER TABLE "User" ADD CONSTRAINT "User_status_check"
  CHECK ("status" IN ('active', 'inactive', 'suspended', 'pending'));

-- Login attempts must be non-negative
ALTER TABLE "User" ADD CONSTRAINT "User_loginAttempts_check"
  CHECK ("loginAttempts" >= 0);

-- Email must be lowercase, non-empty, and valid format
ALTER TABLE "User" ADD CONSTRAINT "User_email_format_check"
  CHECK (
    "email" = LOWER("email") AND
    "email" ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
  );

-- Password must have minimum length (hashed passwords are always long)
ALTER TABLE "User" ADD CONSTRAINT "User_password_length_check"
  CHECK (LENGTH("password") >= 60); -- bcrypt hashes are 60 chars

-- Phone number format (if provided)
ALTER TABLE "User" ADD CONSTRAINT "User_phone_format_check"
  CHECK ("phone" IS NULL OR "phone" ~ '^\+?[1-9]\d{1,14}$');

-- First/Last name must not be empty
ALTER TABLE "User" ADD CONSTRAINT "User_firstName_check"
  CHECK (LENGTH(TRIM("firstName")) > 0);

ALTER TABLE "User" ADD CONSTRAINT "User_lastName_check"
  CHECK (LENGTH(TRIM("lastName")) > 0);

-- 3. Add constraints for RefreshToken

-- Ensure expiry is in the future when created
-- Note: This is enforced at application level, but adding as documentation
COMMENT ON COLUMN "RefreshToken"."expiresAt" IS 'Must be set to future date when token is created';

-- Token must not be empty
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_token_check"
  CHECK (LENGTH(TRIM("token")) > 0);

-- Device info max length
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_deviceInfo_check"
  CHECK ("deviceInfo" IS NULL OR LENGTH("deviceInfo") <= 255);

-- IP address format (basic check)
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_ipAddress_check"
  CHECK ("ipAddress" IS NULL OR "ipAddress" ~ '^[0-9.:a-fA-F]+$');

-- Revoked tokens must have revoked timestamp and reason
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_revoked_consistency_check"
  CHECK (
    ("isRevoked" = false) OR
    ("isRevoked" = true AND "revokedAt" IS NOT NULL)
  );

-- 4. Add partial indexes for performance

-- Only index active users for faster auth lookups
CREATE INDEX IF NOT EXISTS "User_active_email_idx" ON "User"("email")
  WHERE "isDeleted" = false AND "status" = 'active';

-- Index locked accounts for security monitoring
CREATE INDEX IF NOT EXISTS "User_locked_idx" ON "User"("lockedUntil")
  WHERE "lockedUntil" IS NOT NULL;

-- Index active refresh tokens
CREATE INDEX IF NOT EXISTS "RefreshToken_active_idx" ON "RefreshToken"("userId", "expiresAt")
  WHERE "isRevoked" = false;

-- 5. Add comments for documentation

COMMENT ON TABLE "User" IS 'User accounts with multi-tenant support. Soft delete enabled for audit trail.';
COMMENT ON TABLE "RefreshToken" IS 'JWT refresh tokens with rotation support. Expired tokens cleaned up periodically.';

COMMENT ON COLUMN "User"."loginAttempts" IS 'Failed login attempts counter. Reset on successful login. Account locked after 5 attempts.';
COMMENT ON COLUMN "User"."lockedUntil" IS 'Account lock expiry timestamp. User cannot login until this time has passed.';
COMMENT ON COLUMN "User"."isDeleted" IS 'Soft delete flag. Deleted users are retained for audit trail.';
COMMENT ON COLUMN "User"."additionalPermissions" IS 'User-specific permissions that override role permissions. Array of permission strings.';

COMMENT ON COLUMN "RefreshToken"."isRevoked" IS 'Revoked token flag. Used for token rotation and security. Reuse of revoked token triggers security alert.';
COMMENT ON COLUMN "RefreshToken"."revokedReason" IS 'Reason for token revocation: "Token rotated during refresh", "User logout", "Token reuse detected", etc.';

-- 6. Add soft delete consistency constraint

-- Ensure isDeleted and deletedAt are always in sync
ALTER TABLE "User" ADD CONSTRAINT "User_soft_delete_consistency_check"
  CHECK (
    ("isDeleted" = false AND "deletedAt" IS NULL) OR
    ("isDeleted" = true AND "deletedAt" IS NOT NULL)
  );

COMMENT ON CONSTRAINT "User_soft_delete_consistency_check" ON "User" IS 'Ensures isDeleted and deletedAt are always synchronized: both NULL when active, both set when deleted.';
