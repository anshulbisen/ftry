import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@ftry/backend/auth';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { PermissionService } from '../services/permission.service';

/**
 * Permission Management Controller
 *
 * Read-only controller for viewing permissions.
 * Permissions are defined in code and seeded to the database.
 * They cannot be created or modified through the API.
 */
@ApiTags('Admin - Permissions')
@ApiBearerAuth()
@Controller('v1/admin/permissions')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * List all available permissions
   * Returns permissions grouped by resource
   */
  @Get()
  @RequirePermissions(['permissions:read'])
  @ApiOperation({ summary: 'List all available permissions (grouped by resource)' })
  @ApiResponse({
    status: 200,
    description: 'List of permissions grouped by resource',
    schema: {
      example: [
        {
          resource: 'users',
          permissions: ['users:read:all', 'users:read:own', 'users:create:all', 'users:create:own'],
        },
        {
          resource: 'tenants',
          permissions: ['tenants:read:all', 'tenants:create', 'tenants:update:all'],
        },
      ],
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll() {
    return this.permissionService.findAll();
  }

  /**
   * Get permissions by category/resource
   */
  @Get('category/:category')
  @RequirePermissions(['permissions:read'])
  @ApiOperation({ summary: 'Get permissions for a specific resource category' })
  @ApiResponse({
    status: 200,
    description: 'Permissions for the specified category',
    schema: {
      example: {
        resource: 'users',
        permissions: ['users:read:all', 'users:read:own', 'users:create:all'],
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findByCategory(@Param('category') category: string) {
    return this.permissionService.findByCategory(category);
  }

  /**
   * Get effective permissions for a role
   */
  @Get('role/:roleId')
  @RequirePermissions(['permissions:read'])
  @ApiOperation({ summary: 'Get effective permissions for a role' })
  @ApiResponse({
    status: 200,
    description: 'Role permissions',
    schema: {
      example: {
        roleId: 'cm4b1c2d3e4f5g6h7i8j9k0l',
        roleName: 'Tenant Admin',
        roleType: 'tenant',
        permissions: ['users:read:own', 'users:create:own', 'roles:read:own'],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.permissionService.getRolePermissions(roleId);
  }

  /**
   * Get effective permissions for a user
   * Includes role permissions + any additional user-specific permissions
   */
  @Get('user/:userId')
  @RequirePermissions(['permissions:read'])
  @ApiOperation({ summary: 'Get effective permissions for a user (role + additional)' })
  @ApiResponse({
    status: 200,
    description: 'User effective permissions',
    schema: {
      example: {
        userId: 'cm4b1c2d3e4f5g6h7i8j9k0l',
        roleId: 'cm4b1c2d3e4f5g6h7i8j9k0m',
        roleName: 'Tenant Admin',
        permissions: ['users:read:own', 'users:create:own', 'roles:read:own'],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUserPermissions(@Param('userId') userId: string) {
    return this.permissionService.getUserPermissions(userId);
  }
}
