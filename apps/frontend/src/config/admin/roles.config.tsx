/**
 * Role Resource Configuration
 *
 * Configuration for role management admin interface using ResourceManager.
 * Replaces the duplicated RoleManagement component with declarative config.
 *
 * @see apps/frontend/src/components/admin/roles/RoleManagement.tsx - Legacy implementation
 * @see apps/frontend/src/types/admin.ts - Type definitions
 */

import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RoleForm } from '@/components/admin/roles/RoleForm';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useAdminData';
import type { ResourceConfig } from '@/types/admin';
import type { RoleWithStats } from '@/lib/admin/admin.api';

/**
 * Role Resource Configuration
 *
 * Complete configuration for role CRUD operations including:
 * - Permission-gated access control
 * - System vs tenant role distinction
 * - Prevent deletion of roles with assigned users
 * - Display permission count
 */
export const roleConfig: ResourceConfig<
  RoleWithStats,
  {
    name: string;
    description?: string;
    permissions: string[];
    type?: string;
    tenantId?: string;
  },
  {
    name?: string;
    description?: string;
    permissions?: string[];
    status?: string;
  }
> = {
  // ========== Metadata ==========
  metadata: {
    singular: 'Role',
    plural: 'Roles',
    icon: Shield,
    description: 'Manage roles and permissions',
    emptyMessage: 'No roles found',
    loadingMessage: 'Loading roles...',
    errorMessagePrefix: 'Failed to load roles',
  },

  // ========== Permissions ==========
  permissions: {
    create: ['roles:create:system', 'roles:create:tenant'],
    read: ['roles:read:all', 'roles:read:own'],
    update: ['roles:update:system', 'roles:update:tenant'],
    delete: ['roles:delete'],
  },

  // ========== TanStack Query Hooks ==========
  hooks: {
    useList: (filters) => useRoles(filters),
    useCreate: () => useCreateRole() as any,
    useUpdate: () => useUpdateRole() as any,
    useDelete: () => useDeleteRole(),
  },

  // ========== Table Configuration ==========
  table: {
    columns: [
      // Name column with description
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium text-sm text-foreground">{row.original.name}</span>
              {row.original.description && (
                <span className="text-xs text-muted-foreground">{row.original.description}</span>
              )}
            </div>
          </div>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Type column with badge
      {
        id: 'type',
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant={row.original.type === 'system' ? 'default' : 'secondary'}>
            {row.original.type}
          </Badge>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Permission count column
      {
        id: 'permissionCount',
        accessorFn: (row) => row.permissionCount || row.permissions.length,
        header: 'Permissions',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.permissionCount || row.original.permissions.length}
          </span>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // User count column
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
    component: RoleForm,
    dialogSize: 'default',
    getDialogTitle: (role) => (role ? `Edit ${role.name}` : 'Create Role'),
  },

  // ========== Search Configuration ==========
  search: {
    enabled: true,
    placeholder: 'Search roles by name...',
    searchableFields: ['name', 'description'],
    debounceMs: 300,
    minChars: 2,
  },

  // ========== Delete Validation ==========
  deleteValidation: {
    canDelete: (role) => {
      if (role.isSystem) {
        return {
          allowed: false,
          reason: 'System roles cannot be deleted',
        };
      }
      if (role.userCount > 0) {
        return {
          allowed: false,
          reason: 'Cannot delete role with assigned users',
          suggestedAction: 'Please reassign users to a different role first',
        };
      }
      return {
        allowed: true,
      };
    },
    warningMessage: (role) =>
      role.userCount && role.userCount > 0
        ? `This role has ${role.userCount} assigned users and cannot be deleted.`
        : `This will permanently delete the role "${role.name}". This action cannot be undone.`,
  },
};
