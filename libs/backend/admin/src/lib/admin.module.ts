import { Module } from '@nestjs/common';
import { PrismaModule } from '@ftry/shared/prisma';

// Controllers
import { TenantController } from './controllers/tenant.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';

// Services
import { TenantService } from './services/tenant.service';
import { UserAdminService } from './services/user-admin.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { DataScopingService } from './services/data-scoping.service';

// Guards
import { AdminPermissionGuard } from './guards/admin-permission.guard';

/**
 * Admin Module
 *
 * Unified administration module for the ftry platform.
 * Provides permission-based access control for:
 * - Tenant management
 * - User management
 * - Role and permission management
 *
 * Access is controlled through roles and permissions:
 * - Super Admin: Full system access
 * - Tenant Owner: Full access within tenant
 * - Tenant Admin: User/role management within tenant
 * - Tenant Manager: Read-only access within tenant
 */
@Module({
  imports: [PrismaModule],
  controllers: [TenantController, UserController, RoleController, PermissionController],
  providers: [
    // Services
    TenantService,
    UserAdminService,
    RoleService,
    PermissionService,
    DataScopingService,
    // Guards
    AdminPermissionGuard,
  ],
  exports: [
    // Export services for use in other modules if needed
    TenantService,
    UserAdminService,
    RoleService,
    PermissionService,
    DataScopingService,
    AdminPermissionGuard,
  ],
})
export class AdminModule {}
