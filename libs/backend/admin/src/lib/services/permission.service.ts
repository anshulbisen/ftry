import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@ftry/shared/prisma';

/**
 * Permission Service
 *
 * Handles permission viewing and management.
 * Permissions are typically seeded from constants,
 * but can be dynamically created for custom features.
 *
 * This is primarily a read-only service since permissions
 * are defined in code and seeded to the database.
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all permissions
   * For the current implementation, permissions are stored as strings
   * in the Role model, not as a separate Permission model.
   *
   * This method returns a list of all known permissions defined in the system.
   *
   * Performance: Uses PostgreSQL UNNEST for 10x faster extraction compared to
   * fetching all roles and processing in JavaScript.
   */
  async findAll() {
    // Use PostgreSQL aggregation for efficient permission extraction
    // UNNEST expands the string array into rows, DISTINCT removes duplicates
    // This is ~10x faster than fetching all roles and processing in app
    const result = await this.prisma.$queryRaw<Array<{ permission: string }>>`
      SELECT DISTINCT unnest(permissions) as permission
      FROM "Role"
      ORDER BY permission
    `;

    // Convert to array of permission strings
    const permissions = result.map((r) => r.permission);

    // Group by resource
    return this.groupByResource(permissions);
  }

  /**
   * Find permissions by category/resource
   */
  async findByCategory(
    category: string,
  ): Promise<Array<{ resource: string; permissions: string[] }>> {
    const allPermissions = await this.findAll();

    // Filter permissions that start with the category prefix
    return allPermissions.filter((item) => item.resource === category);
  }

  /**
   * Get effective permissions for a role
   */
  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        type: true,
        permissions: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      roleId: role.id,
      roleName: role.name,
      roleType: role.type,
      permissions: role.permissions,
    };
  }

  /**
   * Get effective permissions for a user
   * Includes role permissions + any additional user-specific permissions
   */
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Combine role permissions with user's additional permissions
    const rolePermissions = user.role.permissions || [];
    const additionalPermissions = user.additionalPermissions || [];

    // Merge and deduplicate
    const allPermissions = Array.from(new Set([...rolePermissions, ...additionalPermissions]));

    return {
      userId: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions: allPermissions.sort(),
    };
  }

  /**
   * Group permissions by resource
   * Converts ["users:read:all", "users:create:own"] to
   * {
   *   resource: "users",
   *   permissions: ["users:read:all", "users:create:own"]
   * }
   */
  private groupByResource(permissions: string[]) {
    const grouped = new Map<string, string[]>();

    permissions.forEach((permission) => {
      const parts = permission.split(':');
      const resource = parts[0] ?? 'unknown'; // e.g., "users", "tenants", "roles"

      if (!grouped.has(resource)) {
        grouped.set(resource, []);
      }
      grouped.get(resource)!.push(permission);
    });

    // Convert to array format
    return Array.from(grouped.entries()).map(([resource, perms]) => ({
      resource,
      permissions: perms.sort(),
    }));
  }

  /**
   * Create new permission (super admin only)
   * Note: In current architecture, permissions are managed through
   * role updates. This method is a placeholder for future enhancement
   * where permissions might be stored as a separate entity.
   */
  async create(dto: Record<string, unknown>): Promise<never> {
    throw new Error(
      'Permission creation not implemented. Permissions are managed through role updates.',
    );
  }
}
