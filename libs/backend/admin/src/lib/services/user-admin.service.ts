import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@ftry/shared/prisma';
import { UserWithPermissions, UserWithoutPassword } from '@ftry/shared/types';
import { removePassword } from '@ftry/shared/utils';
import { DataScopingService } from './data-scoping.service';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from '../dto/user';
import { requirePermission, requireAnyPermission } from '../utils/permission.utils';

/**
 * User Admin Service
 *
 * Handles user management operations with automatic data scoping
 * based on user permissions.
 *
 * Different from the regular UserService in @ftry/backend/auth,
 * this service is for admin operations with cross-tenant capabilities.
 *
 * Permission Logic:
 * - Super Admin (users:*:all): Can manage users across all tenants
 * - Tenant Admin (users:*:own): Can only manage users in their tenant
 */
@Injectable()
export class UserAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopingService: DataScopingService,
  ) {}

  /**
   * Find all users with automatic scoping
   * - Super admin: returns all users across all tenants
   * - Tenant admin: returns only users in their tenant
   */
  async findAll(
    currentUser: UserWithPermissions,
    filters?: UserFilterDto,
  ): Promise<UserWithoutPassword[]> {
    // Extract filters and pagination
    const limit = Math.min(filters?.limit || 50, 100); // Max 100
    const offset = filters?.offset || 0;

    // Build where clause from filters
    const where: Record<string, unknown> = {};
    if (filters?.limit !== undefined) {
      // Note: limit is handled separately, not part of where clause
    }
    if (filters?.offset !== undefined) {
      // Note: offset is handled separately, not part of where clause
    }
    // Add other filters as needed based on UserFilterDto structure

    // Build base query
    const baseQuery = {
      where,
      include: { role: true, tenant: true },
      take: limit,
      skip: offset,
    };

    // Apply data scoping based on permissions
    const scopedQuery = this.scopingService.scopeQuery(currentUser, baseQuery, 'users');

    // Execute query
    const users = await this.prisma.user.findMany(scopedQuery);

    // Remove password from results (security)
    return users.map((user) => removePassword(user));
  }

  /**
   * Find user by ID with permission check
   */
  async findOne(currentUser: UserWithPermissions, id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user can access this user
    requirePermission(this.scopingService, currentUser, user, 'read', 'users');

    // Remove password from result
    return removePassword(user);
  }

  /**
   * Create new user
   * - Super admin: can create in any tenant
   * - Tenant admin: can create only in their tenant
   *
   * Uses transaction to ensure:
   * - Atomic user creation
   * - Tenant user limit enforcement
   * - No race conditions
   */
  async create(currentUser: UserWithPermissions, dto: CreateUserDto): Promise<UserWithoutPassword> {
    // Validate tenant access
    const targetTenantId = dto.tenantId || currentUser.tenantId;

    if (targetTenantId !== currentUser.tenantId && currentUser.tenantId !== null) {
      // Trying to create in different tenant
      requireAnyPermission(currentUser, ['users:create:all']);
    }

    // Hash password (bcrypt with 12 rounds)
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Use transaction for atomic user creation with tenant limit validation
    return this.prisma.$transaction(async (tx) => {
      // Check tenant user limit (if applicable)
      if (targetTenantId) {
        const tenant = await tx.tenant.findUnique({
          where: { id: targetTenantId },
          select: {
            maxUsers: true,
            _count: { select: { users: true } },
          },
        });

        if (tenant && tenant._count.users >= tenant.maxUsers) {
          throw new BadRequestException('Tenant user limit reached');
        }
      }

      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          roleId: dto.roleId,
          tenantId: targetTenantId,
          status: 'active',
        },
        include: { role: true, tenant: true },
      });

      // Remove password from result
      return removePassword(user);
    });
  }

  /**
   * Update user
   * - Super admin: can update any user
   * - Tenant admin: can update users in their tenant
   */
  async update(
    currentUser: UserWithPermissions,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserWithoutPassword> {
    // Get the user to check tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user can update this user
    requirePermission(this.scopingService, currentUser, user, 'update', 'users');

    // Prepare update data (exclude password - handle separately)
    const updateData: Partial<UpdateUserDto> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.roleId !== undefined) updateData.roleId = dto.roleId;
    if (dto.status !== undefined) updateData.status = dto.status;

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true, tenant: true },
    });

    // Remove password from result
    return removePassword(updatedUser);
  }

  /**
   * Delete user (soft delete)
   * - Super admin: can delete any user
   * - Tenant admin: can delete users in their tenant
   */
  async delete(currentUser: UserWithPermissions, userId: string): Promise<UserWithoutPassword> {
    // Get the user to check tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already deleted
    if (user.isDeleted) {
      throw new BadRequestException('User is already deleted');
    }

    // Check if current user can delete this user
    requirePermission(this.scopingService, currentUser, user, 'delete', 'users');

    // Soft delete user
    const deletedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      include: { role: true, tenant: true },
    });

    // Remove password from result
    return removePassword(deletedUser);
  }

  /**
   * Impersonate user (admin feature)
   * - Super admin: can impersonate any user
   * - Tenant admin: can impersonate users in their tenant
   *
   * Note: This method validates permissions but token generation
   * should be handled by the auth service
   */
  async impersonate(
    currentUser: UserWithPermissions,
    userId: string,
  ): Promise<UserWithoutPassword> {
    // Get the user to impersonate
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user can impersonate this user
    requireAnyPermission(currentUser, ['impersonate:any', 'impersonate:own']);

    // Validate same tenant for :own permission
    if (
      currentUser.tenantId !== null &&
      user.tenantId !== currentUser.tenantId &&
      !this.scopingService.canAccessEntity(currentUser, user, 'impersonate:any')
    ) {
      throw new ForbiddenException('Cannot impersonate users in other tenants');
    }

    // Remove password from result
    return removePassword(user);
  }
}
