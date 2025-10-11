/**
 * Tenant Resource Configuration
 *
 * Configuration for tenant management admin interface using ResourceManager.
 * Replaces the duplicated TenantManagement component with declarative config.
 *
 * @see apps/frontend/src/components/admin/tenants/TenantManagement.tsx - Legacy implementation
 * @see apps/frontend/src/types/admin.ts - Type definitions
 */

import { Building, Ban, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TenantForm } from '@/components/admin/tenants/TenantForm';
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
} from '@/hooks/useAdminData';
import type { ResourceConfig, CustomAction } from '@/types/admin';
import type { TenantWithStats } from '@/lib/admin/admin.api';
import type { Tenant } from '@ftry/shared/types';

/**
 * Tenant Resource Configuration
 *
 * Complete configuration for tenant CRUD operations including:
 * - Permission-gated access control
 * - Super admin only management
 * - Custom suspend/activate actions
 * - Prevent deletion if tenant has users
 */
export const tenantConfig: ResourceConfig<TenantWithStats, Partial<Tenant>, Partial<Tenant>> = {
  // ========== Metadata ==========
  metadata: {
    singular: 'Tenant',
    plural: 'Tenants',
    icon: Building,
    description: 'Manage tenants and their subscriptions',
    emptyMessage: 'No tenants found',
    loadingMessage: 'Loading tenants...',
    errorMessagePrefix: 'Failed to load tenants',
  },

  // ========== Permissions ==========
  permissions: {
    create: ['tenants:create'],
    read: ['tenants:read:all', 'tenants:read:own'],
    update: ['tenants:update:all', 'tenants:update:own'],
    delete: ['tenants:delete'],
    custom: {
      suspend: ['tenants:update:all'],
      activate: ['tenants:update:all'],
    },
  },

  // ========== TanStack Query Hooks ==========
  hooks: {
    useList: (filters) => useTenants(filters),
    useCreate: () => useCreateTenant(),
    useUpdate: () => useUpdateTenant(),
    useDelete: () => useDeleteTenant(),
  },

  // ========== Table Configuration ==========
  table: {
    columns: [
      // Name column
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm text-foreground">{row.original.name}</span>
          </div>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Website column
      {
        id: 'website',
        accessorKey: 'website',
        header: 'Website',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.website || 'N/A'}</span>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Users count column
      {
        id: 'userCount',
        accessorKey: 'userCount',
        header: 'Users',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.userCount || 0}</span>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Status column with badge
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'active'
                ? 'default'
                : row.original.status === 'suspended'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {row.original.status}
          </Badge>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },
    ],
    defaultSort: {
      key: 'name',
      direction: 'asc',
    },
    rowsPerPage: 10,
    selectable: false,
  },

  // ========== Form Configuration ==========
  form: {
    component: TenantForm,
    dialogSize: 'default',
    getDialogTitle: (tenant) => (tenant ? `Edit ${tenant.name}` : 'Create Tenant'),
  },

  // ========== Custom Actions ==========
  customActions: [
    {
      id: 'suspend',
      label: 'Suspend',
      icon: Ban,
      variant: 'destructive',
      location: ['row'],
      permissions: ['tenants:update:all'],
      handler: async (tenant, hooks) => {
        // TODO: Implement suspend logic when backend endpoint is ready
        return Promise.resolve();
      },
      shouldShow: (tenant) => tenant.status === 'active',
      confirmation: {
        title: 'Suspend Tenant',
        description: (tenant) =>
          Array.isArray(tenant)
            ? 'Are you sure you want to suspend these tenants?'
            : `Are you sure you want to suspend "${tenant.name}"? Users will lose access.`,
        confirmText: 'Suspend',
        cancelText: 'Cancel',
        variant: 'destructive',
      },
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: CheckCircle,
      variant: 'default',
      location: ['row'],
      permissions: ['tenants:update:all'],
      handler: async (tenant, hooks) => {
        // TODO: Implement activate logic when backend endpoint is ready
        return Promise.resolve();
      },
      shouldShow: (tenant) => tenant.status === 'suspended',
      confirmation: {
        title: 'Activate Tenant',
        description: (tenant) =>
          Array.isArray(tenant)
            ? 'Are you sure you want to activate these tenants?'
            : `Are you sure you want to activate "${tenant.name}"?`,
        confirmText: 'Activate',
        cancelText: 'Cancel',
        variant: 'default',
      },
    },
  ] as Array<CustomAction<TenantWithStats>>,

  // ========== Search Configuration ==========
  search: {
    enabled: true,
    placeholder: 'Search tenants by name or website...',
    searchableFields: ['name', 'website'],
    debounceMs: 300,
    minChars: 2,
  },

  // ========== Delete Validation ==========
  deleteValidation: {
    canDelete: (tenant) => {
      if (tenant.userCount > 0) {
        return {
          allowed: false,
          reason: 'Cannot delete tenant with active users',
          suggestedAction: 'Please remove all users from this tenant first',
        };
      }
      return {
        allowed: true,
      };
    },
    warningMessage: (tenant) =>
      `This will permanently delete the tenant "${tenant.name}". This action cannot be undone.`,
  },
};
