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
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from '../dto/role';
import { type UserWithPermissions } from '@ftry/shared/types';

/**
 * Unified Role Management Controller
 *
 * Handles role CRUD operations with permission-based access control.
 * - Super admins can manage system-wide roles
 * - Tenant admins can manage tenant-specific roles
 *
 * System-protected roles cannot be modified or deleted.
 */
@ApiTags('Admin - Roles')
@ApiBearerAuth()
@Controller('admin/roles')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * List roles with filtering
   * - Super admin: sees all roles (system + all tenant roles)
   * - Tenant admin: sees system roles + their tenant roles
   */
  @Get()
  @RequirePermissions(['roles:read:all', 'roles:read:own'])
  @ApiOperation({ summary: 'List all roles (scoped by permissions)' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(@CurrentUser() user: UserWithPermissions, @Query() filters?: any) {
    return this.roleService.findAll(user, filters);
  }

  /**
   * Get single role by ID
   */
  @Get(':id')
  @RequirePermissions(['roles:read:all', 'roles:read:own'])
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role found' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findOne(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    return this.roleService.findOne(user, id);
  }

  /**
   * Create new role
   * - Super admin: can create system or tenant roles
   * - Tenant admin: can create only tenant roles
   */
  @Post()
  @RequirePermissions(['roles:create:system', 'roles:create:tenant'])
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@CurrentUser() user: UserWithPermissions, @Body() dto: CreateRoleDto) {
    return this.roleService.create(user, dto);
  }

  /**
   * Update role
   * - Super admin: can update any role (except system-protected)
   * - Tenant admin: can update only tenant roles (not system roles)
   */
  @Patch(':id')
  @RequirePermissions(['roles:update:system', 'roles:update:tenant'])
  @ApiOperation({ summary: 'Update role (cannot update system-protected roles)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot modify system-protected role' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(
    @CurrentUser() user: UserWithPermissions,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(user, id, dto);
  }

  /**
   * Delete role
   * - Cannot delete system-protected roles
   * - Cannot delete default roles
   * - Cannot delete roles with active users
   */
  @Delete(':id')
  @RequirePermissions(['roles:delete'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role (with safety checks)' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete system/default role or role with users' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async delete(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    await this.roleService.delete(user, id);
  }

  /**
   * Assign permissions to role
   * Replaces all existing permissions with new set
   */
  @Post(':id/permissions')
  @RequirePermissions(['permissions:assign'])
  @ApiOperation({ summary: 'Assign permissions to role (replaces existing)' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot modify system-protected role or invalid permissions',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async assignPermissions(
    @CurrentUser() user: UserWithPermissions,
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.roleService.assignPermissions(user, id, dto.permissions);
  }
}
