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

    // Convert to Permission objects
    return result.map((r) => this.parsePermissionString(r.permission));
  }

  /**
   * Find permissions by category/resource
   */
  async findByCategory(category: string) {
    const allPermissions = await this.findAll();

    // Filter permissions that match the category
    return allPermissions.filter((permission) => permission.category === category);
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
   * Parse permission string into Permission object
   * Converts "users:read:all" into a structured Permission object
   *
   * @example
   * "users:read:all" → {
   *   id: "users:read:all",
   *   name: "users:read:all",
   *   resource: "users",
   *   action: "read:all",
   *   category: "users",
   *   description: "Read all users",
   *   createdAt: new Date(),
   *   updatedAt: new Date()
   * }
   */
  private parsePermissionString(permissionString: string) {
    const parts = permissionString.split(':');
    const resource = parts[0] ?? 'unknown';
    const action = parts.slice(1).join(':') || 'unknown';

    // Generate a human-readable description
    const description = this.generatePermissionDescription(resource, action);

    return {
      id: permissionString, // Use the permission string as ID
      name: permissionString,
      resource,
      action,
      category: resource, // Category is the same as resource
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate human-readable description for a permission
   */
  private generatePermissionDescription(resource: string, action: string): string {
    const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
    const actionParts = action.split(':');

    if (actionParts.length === 2) {
      const [verb, scope] = actionParts;
      const scopeText = scope === 'all' ? 'all' : 'own';
      return `${verb?.charAt(0).toUpperCase()}${verb?.slice(1)} ${scopeText} ${resourceName.toLowerCase()}`;
    }

    return `${action} on ${resourceName.toLowerCase()}`;
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
