import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@ftry/shared/prisma';
import { DataScopingService } from './data-scoping.service';

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
  async findAll(currentUser: any, filters?: any) {
    // Extract filters and pagination
    const limit = Math.min(filters?.limit || 50, 100); // Max 100
    const offset = filters?.offset || 0;

    // Build where clause from filters
    const where: any = {};
    if (filters?.email) where.email = filters.email;
    if (filters?.status) where.status = filters.status;
    if (filters?.roleId) where.roleId = filters.roleId;

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
    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Find user by ID with permission check
   */
  async findOne(currentUser: any, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user can access this user
    const canAccess =
      this.scopingService.canAccessEntity(currentUser, user, 'users:read:all') ||
      this.scopingService.canAccessEntity(currentUser, user, 'users:read:own');

    if (!canAccess) {
      throw new ForbiddenException('Cannot access this user');
    }

    // Remove password from result
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create new user
   * - Super admin: can create in any tenant
   * - Tenant admin: can create only in their tenant
   */
  async create(currentUser: any, dto: any) {
    // Validate tenant access
    const targetTenantId = dto.tenantId || currentUser.tenantId;

    if (targetTenantId !== currentUser.tenantId && currentUser.tenantId !== null) {
      // Trying to create in different tenant
      if (!currentUser.permissions.includes('users:create:all')) {
        throw new ForbiddenException('Cannot create users in other tenants');
      }
    }

    // Hash password (bcrypt with 12 rounds)
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
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
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   * - Super admin: can update any user
   * - Tenant admin: can update users in their tenant
   */
  async update(currentUser: any, userId: string, dto: any) {
    // Get the user to check tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user can update this user
    const canUpdate =
      this.scopingService.canAccessEntity(currentUser, user, 'users:update:all') ||
      this.scopingService.canAccessEntity(currentUser, user, 'users:update:own');

    if (!canUpdate) {
      throw new ForbiddenException('Cannot update this user');
    }

    // Prepare update data (exclude password - handle separately)
    const updateData: any = {};
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
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user (soft delete)
   * - Super admin: can delete any user
   * - Tenant admin: can delete users in their tenant
   */
  async delete(currentUser: any, userId: string) {
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
    const canDelete =
      this.scopingService.canAccessEntity(currentUser, user, 'users:delete:all') ||
      this.scopingService.canAccessEntity(currentUser, user, 'users:delete:own');

    if (!canDelete) {
      throw new ForbiddenException('Cannot delete this user');
    }

    // Soft delete user
    const deletedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Remove password from result
    const { password, ...userWithoutPassword } = deletedUser;
    return userWithoutPassword;
  }

  /**
   * Impersonate user (admin feature)
   * - Super admin: can impersonate any user
   * - Tenant admin: can impersonate users in their tenant
   *
   * Note: This method validates permissions but token generation
   * should be handled by the auth service
   */
  async impersonate(currentUser: any, userId: string) {
    // Get the user to impersonate
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user can impersonate this user
    const canImpersonate =
      this.scopingService.canAccessEntity(currentUser, user, 'impersonate:any') ||
      this.scopingService.canAccessEntity(currentUser, user, 'impersonate:own');

    if (!canImpersonate) {
      throw new ForbiddenException('Cannot impersonate this user');
    }

    // Remove password from result
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
