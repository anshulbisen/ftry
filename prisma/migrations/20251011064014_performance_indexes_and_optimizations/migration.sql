-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_resource_idx" ON "AuditLog"("tenantId", "resource");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_isRevoked_idx" ON "RefreshToken"("expiresAt", "isRevoked");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_isRevoked_idx" ON "RefreshToken"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "Role_tenantId_type_idx" ON "Role"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Role_tenantId_status_idx" ON "Role"("tenantId", "status");

-- CreateIndex
CREATE INDEX "User_tenantId_status_idx" ON "User"("tenantId", "status");

-- CreateIndex
CREATE INDEX "User_tenantId_roleId_idx" ON "User"("tenantId", "roleId");

-- CreateIndex
CREATE INDEX "User_email_status_idx" ON "User"("email", "status");
