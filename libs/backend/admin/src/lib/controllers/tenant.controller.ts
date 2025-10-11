import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@ftry/backend/auth';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto, UpdateTenantDto, TenantFilterDto } from '../dto/tenant';
import { type UserWithPermissions } from '@ftry/shared/types';

/**
 * Unified Tenant Management Controller
 *
 * Handles tenant CRUD operations with permission-based access control.
 * - Super admins can manage all tenants
 * - Tenant owners can view/update their own tenant
 *
 * Access is controlled via @RequirePermissions decorator.
 */
@ApiTags('Admin - Tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * List tenants with filtering and pagination
   * - Super admin: sees all tenants
   * - Tenant owner: sees only their tenant
   */
  @Get()
  @RequirePermissions(['tenants:read:all', 'tenants:read:own'])
  @ApiOperation({ summary: 'List all tenants (scoped by permissions)' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(@CurrentUser() user: UserWithPermissions, @Query() filters: TenantFilterDto) {
    return this.tenantService.findAll(user, filters);
  }

  /**
   * Get single tenant by ID
   */
  @Get(':id')
  @RequirePermissions(['tenants:read:all', 'tenants:read:own'])
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant found' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findOne(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    return this.tenantService.findOne(user, id);
  }

  /**
   * Create new tenant (super admin only)
   */
  @Post()
  @RequirePermissions(['tenants:create'])
  @ApiOperation({ summary: 'Create new tenant (super admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - super admin only' })
  async create(@CurrentUser() user: UserWithPermissions, @Body() dto: CreateTenantDto) {
    return this.tenantService.create(user, dto);
  }

  /**
   * Update tenant
   * - Super admin: can update any tenant
   * - Tenant owner: can update own tenant
   */
  @Patch(':id')
  @RequirePermissions(['tenants:update:all', 'tenants:update:own'])
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(
    @CurrentUser() user: UserWithPermissions,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.update(user, id, dto);
  }

  /**
   * Delete tenant (super admin only)
   * Prevents deletion if tenant has active users
   */
  @Delete(':id')
  @RequirePermissions(['tenants:delete'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant (super admin only)' })
  @ApiResponse({ status: 204, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete tenant with active users' })
  @ApiResponse({ status: 403, description: 'Forbidden - super admin only' })
  async delete(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    await this.tenantService.delete(user, id);
  }

  /**
   * Suspend tenant (super admin only)
   */
  @Post(':id/suspend')
  @RequirePermissions(['tenants:suspend'])
  @ApiOperation({ summary: 'Suspend tenant (super admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant suspended successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 400, description: 'Tenant already suspended' })
  @ApiResponse({ status: 403, description: 'Forbidden - super admin only' })
  async suspend(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    return this.tenantService.suspend(user, id);
  }

  /**
   * Activate suspended tenant (super admin only)
   */
  @Post(':id/activate')
  @RequirePermissions(['tenants:suspend'])
  @ApiOperation({ summary: 'Activate suspended tenant (super admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant activated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 400, description: 'Tenant already active' })
  @ApiResponse({ status: 403, description: 'Forbidden - super admin only' })
  async activate(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    return this.tenantService.activate(user, id);
  }
}
