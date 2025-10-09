import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@ftry/shared/prisma';
import { DataScopingService } from './data-scoping.service';

/**
 * Role Service
 *
 * Handles role management operations with permission-based access control.
 * System roles cannot be modified by tenant admins.
 *
 * Permission Logic:
 * - Super Admin (roles:*:system): Can manage all roles including system roles
 * - Tenant Admin (roles:*:tenant): Can only manage tenant-specific roles
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopingService: DataScopingService,
  ) {}

  /**
   * Validate permission format
   * Expected format: resource:action:scope or resource:action
   */
  private validatePermissionFormat(permissions: string[]): void {
    const validPattern = /^[a-z]+:[a-z]+(?::[a-z]+)?$/;

    for (const permission of permissions) {
      if (!validPattern.test(permission)) {
        throw new BadRequestException(
          `Invalid permission format: ${permission}. Expected format: resource:action:scope`,
        );
      }
    }
  }

  /**
   * Find all roles with scoping
   * - Super admin: sees all roles (system + all tenant roles)
   * - Tenant admin: sees only their tenant roles (not system roles)
   */
  async findAll(currentUser: any, filters?: any) {
    // Build base query
    const baseQuery: any = {
      where: filters || {},
      orderBy: { level: 'desc' as const },
    };

    // Apply data scoping based on permissions
    const scopedQuery = this.scopingService.scopeQuery(currentUser, baseQuery, 'roles');

    return this.prisma.role.findMany(scopedQuery);
  }

  /**
   * Find role by ID with permission check
   */
  async findOne(currentUser: any, id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if user can access this role
    const canAccess =
      this.scopingService.canAccessEntity(currentUser, role, 'roles:read:all') ||
      this.scopingService.canAccessEntity(currentUser, role, 'roles:read:own');

    if (!canAccess) {
      throw new ForbiddenException('Cannot access this role');
    }

    return role;
  }

  /**
   * Create new role
   * - Super admin: can create system or tenant roles
   * - Tenant admin: can create only tenant roles
   */
  async create(currentUser: any, dto: any) {
    const { type, tenantId, permissions = [] } = dto;

    // Validate permission format
    this.validatePermissionFormat(permissions);

    // Validate system role creation
    if (type === 'system') {
      if (!currentUser.permissions.includes('roles:create:system')) {
        throw new ForbiddenException('Only super admins can create system roles');
      }
      // System roles must have null tenantId
      if (tenantId !== null && tenantId !== undefined) {
        throw new BadRequestException('System roles must have null tenantId');
      }
    }

    // Validate tenant role creation
    if (type === 'tenant') {
      const targetTenantId = tenantId || currentUser.tenantId;

      // Tenant roles must have a tenantId
      if (!targetTenantId) {
        throw new BadRequestException('Tenant roles must have a tenantId');
      }

      // Check if user can create role in this tenant
      if (targetTenantId !== currentUser.tenantId && currentUser.tenantId !== null) {
        throw new ForbiddenException('Cannot create roles in other tenants');
      }

      // Use the determined tenantId
      dto.tenantId = targetTenantId;
    }

    // Create role
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        level: dto.level,
        permissions: dto.permissions,
        tenantId: dto.tenantId,
        isSystem: false,
        isDefault: false,
        status: 'active',
      },
    });
  }

  /**
   * Update role
   * - Super admin: can update any role (except system-protected)
   * - Tenant admin: can update only tenant roles (not system roles)
   */
  async update(currentUser: any, roleId: string, dto: any) {
    // Get role to check access
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent modification of system-protected roles
    if (role.isSystem) {
      throw new BadRequestException(
        'Cannot modify system-protected role. These roles are managed by the system.',
      );
    }

    // Check if current user can update this role
    const canUpdate =
      this.scopingService.canAccessEntity(currentUser, role, 'roles:update:system') ||
      this.scopingService.canAccessEntity(currentUser, role, 'roles:update:tenant');

    if (!canUpdate) {
      throw new ForbiddenException('Cannot update this role');
    }

    // Validate permissions if provided
    if (dto.permissions) {
      this.validatePermissionFormat(dto.permissions);
    }

    // Prepare update data
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.level !== undefined) updateData.level = dto.level;
    if (dto.permissions !== undefined) updateData.permissions = dto.permissions;

    return this.prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });
  }

  /**
   * Delete role
   * - Cannot delete system-protected roles
   * - Cannot delete default roles
   * - Cannot delete role if users are assigned to it
   */
  async delete(currentUser: any, roleId: string) {
    // Get role with user count
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent deletion of system-protected roles
    if (role.isSystem) {
      throw new BadRequestException(
        'Cannot delete system-protected role. These roles are managed by the system.',
      );
    }

    // Prevent deletion of default roles
    if (role.isDefault) {
      throw new BadRequestException(
        'Cannot delete default role. Users need at least one default role option.',
      );
    }

    // Prevent deletion if users are assigned
    if (role._count.users > 0) {
      throw new BadRequestException(
        `Cannot delete role with active users. ${role._count.users} user(s) are assigned to this role.`,
      );
    }

    // Check if current user can delete this role
    const canDelete = this.scopingService.canAccessEntity(currentUser, role, 'roles:delete');

    if (!canDelete) {
      throw new ForbiddenException('Cannot delete this role');
    }

    return this.prisma.role.delete({
      where: { id: roleId },
    });
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(currentUser: any, roleId: string, permissions: string[]) {
    // Get role to check access
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent modification of system-protected roles
    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system-protected role');
    }

    // Check if current user can update this role
    const canUpdate =
      this.scopingService.canAccessEntity(currentUser, role, 'roles:update:system') ||
      this.scopingService.canAccessEntity(currentUser, role, 'roles:update:tenant');

    if (!canUpdate) {
      throw new ForbiddenException('Cannot update this role');
    }

    // Validate permission format
    this.validatePermissionFormat(permissions);

    // Update role permissions
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions,
      },
    });
  }
}
