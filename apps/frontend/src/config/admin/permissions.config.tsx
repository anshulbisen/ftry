/**
 * Permission Resource Configuration
 *
 * Configuration for permission viewing interface using ResourceManager.
 * Permissions are typically read-only - they are assigned to roles, not directly managed.
 *
 * @see apps/frontend/src/types/admin.ts - Type definitions
 */

import { Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAllPermissions } from '@/hooks/useAdminData';
import type { ResourceConfig } from '@/types/admin';
import type { Permission } from '@ftry/shared/types';

/**
 * Permission Resource Configuration
 *
 * Read-only configuration for viewing permissions.
 * Permissions cannot be created or deleted - they are defined in the system.
 */
export const permissionConfig: ResourceConfig<
  Permission,
  never, // No create operation
  never // No update operation
> = {
  // ========== Metadata ==========
  metadata: {
    singular: 'Permission',
    plural: 'Permissions',
    icon: Key,
    description: 'View available permissions',
    emptyMessage: 'No permissions found',
    loadingMessage: 'Loading permissions...',
    errorMessagePrefix: 'Failed to load permissions',
  },

  // ========== Permissions ==========
  permissions: {
    read: ['permissions:read'],
    // No create, update, delete - permissions are system-defined
  },

  // ========== TanStack Query Hooks ==========
  hooks: {
    useList: () => useAllPermissions(),
    // No create, update, delete hooks - return disabled mutations
    useCreate: () =>
      ({
        mutate: () => {
          throw new Error('Permissions cannot be created via UI');
        },
        mutateAsync: async () => {
          throw new Error('Permissions cannot be created via UI');
        },
        isIdle: true,
        isPending: false,
        isError: false,
        isSuccess: false,
        reset: () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    useUpdate: () =>
      ({
        mutate: () => {
          throw new Error('Permissions cannot be updated via UI');
        },
        mutateAsync: async () => {
          throw new Error('Permissions cannot be updated via UI');
        },
        isIdle: true,
        isPending: false,
        isError: false,
        isSuccess: false,
        reset: () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    useDelete: () =>
      ({
        mutate: () => {
          throw new Error('Permissions cannot be deleted via UI');
        },
        mutateAsync: async () => {
          throw new Error('Permissions cannot be deleted via UI');
        },
        isIdle: true,
        isPending: false,
        isError: false,
        isSuccess: false,
        reset: () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
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
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm font-mono text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Description column
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.description || 'No description'}
          </span>
        ),
        enableSorting: false,
        meta: {
          sortable: false,
        },
      },

      // Category column with badge
      {
        id: 'category',
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <Badge variant="outline">{row.original.category || 'general'}</Badge>,
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Action column with badge
      {
        id: 'action',
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.original.action || '';
          const scope = action.includes(':all') ? 'all' : action.includes(':own') ? 'own' : 'other';
          return <Badge variant={scope === 'all' ? 'default' : 'secondary'}>{action}</Badge>;
        },
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
    rowsPerPage: 20, // More items per page for permissions
    selectable: false,
  },

  // ========== Form Configuration ==========
  // No form component - permissions are read-only
  form: {
    component: () => null,
    dialogSize: 'default',
  },

  // ========== Search Configuration ==========
  search: {
    enabled: true,
    placeholder: 'Search permissions by name or category...',
    searchableFields: ['name', 'description', 'category'],
    debounceMs: 300,
    minChars: 2,
  },
};
