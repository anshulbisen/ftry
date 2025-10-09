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
import { UserAdminService } from '../services/user-admin.service';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from '../dto/user';
import { type UserWithPermissions } from '@ftry/shared/types';

/**
 * Unified User Management Controller
 *
 * Handles user CRUD operations with permission-based access control.
 * - Super admins can manage users across all tenants
 * - Tenant admins can manage users within their tenant
 *
 * Data is automatically scoped based on user permissions.
 */
@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('v1/admin/users')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class UserController {
  constructor(private readonly userAdminService: UserAdminService) {}

  /**
   * List users with filtering and pagination
   * - Super admin: sees all users across all tenants
   * - Tenant admin: sees only users in their tenant
   */
  @Get()
  @RequirePermissions(['users:read:all', 'users:read:own'])
  @ApiOperation({ summary: 'List all users (scoped by permissions)' })
  @ApiResponse({ status: 200, description: 'List of users (passwords excluded)' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(@CurrentUser() user: UserWithPermissions, @Query() filters: UserFilterDto) {
    return this.userAdminService.findAll(user, filters);
  }

  /**
   * Get single user by ID
   */
  @Get(':id')
  @RequirePermissions(['users:read:all', 'users:read:own'])
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found (password excluded)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findOne(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    return this.userAdminService.findOne(user, id);
  }

  /**
   * Create new user
   * - Super admin: can create in any tenant
   * - Tenant admin: can create only in their tenant
   */
  @Post()
  @RequirePermissions(['users:create:all', 'users:create:own'])
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully (password excluded)' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@CurrentUser() user: UserWithPermissions, @Body() dto: CreateUserDto) {
    return this.userAdminService.create(user, dto);
  }

  /**
   * Update user
   * - Super admin: can update any user
   * - Tenant admin: can update users in their tenant
   */
  @Patch(':id')
  @RequirePermissions(['users:update:all', 'users:update:own'])
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully (password excluded)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(
    @CurrentUser() user: UserWithPermissions,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userAdminService.update(user, id, dto);
  }

  /**
   * Delete user (soft delete)
   * - Super admin: can delete any user
   * - Tenant admin: can delete users in their tenant
   */
  @Delete(':id')
  @RequirePermissions(['users:delete:all', 'users:delete:own'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User already deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async delete(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    return this.userAdminService.delete(user, id);
  }

  /**
   * Impersonate user (admin feature)
   * - Super admin: can impersonate any user
   * - Tenant admin: can impersonate users in their tenant
   *
   * Returns user data that can be used to generate JWT token
   */
  @Post(':id/impersonate')
  @RequirePermissions(['impersonate:any', 'impersonate:own'])
  @ApiOperation({ summary: 'Impersonate user (get user data for token generation)' })
  @ApiResponse({ status: 200, description: 'User data retrieved for impersonation' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async impersonate(@CurrentUser() user: UserWithPermissions, @Param('id') id: string) {
    return this.userAdminService.impersonate(user, id);
  }
}
