import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@ftry/shared/prisma';
import { UserWithPermissions, Tenant } from '@ftry/shared/types';
import { DataScopingService } from './data-scoping.service';
import { CreateTenantDto, UpdateTenantDto, TenantFilterDto } from '../dto/tenant';
import { requirePermission, requireAnyPermission } from '../utils/permission.utils';

/**
 * Tenant Service
 *
 * Handles tenant management operations with automatic data scoping
 * based on user permissions.
 *
 * Permission Logic:
 * - Super Admin (tenants:*:all): Can manage all tenants
 * - Tenant Owner (tenants:*:own): Can only view/update their own tenant
 */
@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopingService: DataScopingService,
  ) {}

  /**
   * Find all tenants with automatic scoping
   * - Super admin: returns all tenants
   * - Tenant owner: returns only their tenant
   */
  async findAll(currentUser: UserWithPermissions, filters?: TenantFilterDto): Promise<Tenant[]> {
    // Build base query
    const baseQuery = {
      where: (filters as Record<string, unknown>) || {},
      orderBy: { createdAt: 'desc' as const },
    };

    // Apply data scoping based on permissions
    const scopedQuery = this.scopingService.scopeQuery(currentUser, baseQuery, 'tenants');

    // For tenant owners, filter by their specific tenant ID
    // Super admin will see all tenants (no tenantId filter added)
    if (currentUser.tenantId !== null) {
      scopedQuery.where = {
        ...scopedQuery.where,
        id: currentUser.tenantId, // Only show own tenant
      };
    }

    return this.prisma.tenant.findMany(scopedQuery);
  }

  /**
   * Find single tenant by ID with permission check
   */
  async findOne(currentUser: UserWithPermissions, id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if user can access this tenant
    // Tenants don't have tenantId - use id instead for permission check
    const entityWithTenantId = { ...tenant, tenantId: tenant.id };
    requirePermission(this.scopingService, currentUser, entityWithTenantId, 'read', 'tenants');

    return tenant;
  }

  /**
   * Create new tenant (super admin only)
   */
  async create(currentUser: UserWithPermissions, dto: CreateTenantDto): Promise<Tenant> {
    // Only super admins can create tenants
    requireAnyPermission(currentUser, ['tenants:create']);

    // Normalize slug to lowercase
    const slug = dto.slug ? dto.slug.toLowerCase() : '';

    // Create tenant with default values
    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug,
        subscriptionPlan: dto.subscriptionPlan || 'free',
        maxUsers: dto.maxUsers || 5,
        status: 'active',
        subscriptionStatus: 'active',
        description: dto.description,
        website: dto.website,
      },
    });
  }

  /**
   * Update tenant
   */
  async update(
    currentUser: UserWithPermissions,
    id: string,
    dto: UpdateTenantDto,
  ): Promise<Tenant> {
    // Get the tenant to check access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if current user can update this tenant
    // Tenants don't have tenantId - use id instead for permission check
    const entityWithTenantId = { ...tenant, tenantId: tenant.id };
    requirePermission(this.scopingService, currentUser, entityWithTenantId, 'update', 'tenants');

    // Normalize slug if provided
    const updateData = { ...dto };
    if (updateData.slug) {
      updateData.slug = updateData.slug.toLowerCase();
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Suspend tenant (super admin only)
   */
  async suspend(currentUser: UserWithPermissions, id: string): Promise<Tenant> {
    // Only super admins can suspend tenants
    requireAnyPermission(currentUser, ['tenants:suspend']);

    // Get the tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if already suspended
    if (tenant.status === 'suspended') {
      throw new BadRequestException('Tenant is already suspended');
    }

    // Suspend the tenant
    return this.prisma.tenant.update({
      where: { id },
      data: {
        status: 'suspended',
        subscriptionStatus: 'suspended',
      },
    });
  }

  /**
   * Activate suspended tenant (super admin only)
   */
  async activate(currentUser: UserWithPermissions, id: string): Promise<Tenant> {
    // Only super admins can activate tenants
    requireAnyPermission(currentUser, ['tenants:suspend']);

    // Get the tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if already active
    if (tenant.status === 'active') {
      throw new BadRequestException('Tenant is already active');
    }

    // Activate the tenant
    return this.prisma.tenant.update({
      where: { id },
      data: {
        status: 'active',
        subscriptionStatus: 'active',
      },
    });
  }

  /**
   * Delete tenant (super admin only)
   */
  async delete(currentUser: UserWithPermissions, id: string): Promise<Tenant> {
    // Only super admins can delete tenants
    requireAnyPermission(currentUser, ['tenants:delete']);

    // Get the tenant with user count
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Prevent deletion if tenant has active users
    if (tenant._count.users > 0) {
      throw new BadRequestException(
        'Cannot delete tenant with active users. Please delete or transfer users first.',
      );
    }

    // Delete the tenant
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
