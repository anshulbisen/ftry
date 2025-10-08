-- DropIndex
DROP INDEX "public"."idx_audit_log_tenant_date";

-- DropIndex
DROP INDEX "public"."idx_role_tenant_status";

-- DropIndex
DROP INDEX "public"."idx_user_email_tenant";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneEncrypted" VARCHAR(500),
ADD COLUMN     "phoneHash" VARCHAR(64);

-- CreateIndex
CREATE INDEX "User_phoneHash_idx" ON "User"("phoneHash");
