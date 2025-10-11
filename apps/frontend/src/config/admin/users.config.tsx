/**
 * User Resource Configuration
 *
 * Configuration for user management admin interface using ResourceManager.
 * Replaces the duplicated UserManagement component with declarative config.
 *
 * @see apps/frontend/src/components/admin/users/UserManagement.tsx - Legacy implementation
 * @see apps/frontend/src/types/admin.ts - Type definitions
 */

import { Users, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserForm } from '@/components/admin/users/UserForm';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useAdminData';
import type { ResourceConfig, CustomAction, TableColumn } from '@/types/admin';
import type { UserListItem } from '@/lib/admin/admin.api';

/**
 * User Resource Configuration
 *
 * Complete configuration for user CRUD operations including:
 * - Permission-gated access control
 * - Conditional tenant column visibility (super admin only)
 * - Custom impersonate action
 * - Search by email, first name, last name
 * - Form integration with UserForm component
 */
export const userConfig: ResourceConfig<
  UserListItem,
  {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
    roleId: string;
  },
  {
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleId?: string;
    status?: string;
  }
> = {
  // ========== Metadata ==========
  metadata: {
    singular: 'User',
    plural: 'Users',
    icon: Users,
    description: 'Manage users and their roles',
    emptyMessage: 'No users found',
    loadingMessage: 'Loading users...',
    errorMessagePrefix: 'Failed to load users',
  },

  // ========== Permissions ==========
  permissions: {
    create: ['users:create:all', 'users:create:own'],
    read: ['users:read:all', 'users:read:own'],
    update: ['users:update:all', 'users:update:own'],
    delete: ['users:delete:all', 'users:delete:own'],
    custom: {
      impersonate: ['impersonate:any', 'impersonate:own'],
    },
  },

  // ========== TanStack Query Hooks ==========
  hooks: {
    useList: (filters) => useUsers(filters),
    useCreate: () => useCreateUser(),
    useUpdate: () => useUpdateUser(),
    useDelete: () => useDeleteUser(),
  },

  // ========== Table Configuration ==========
  table: {
    columns: [
      // Email column with name subtitle
      {
        id: 'email',
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">{row.original.email}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.firstName} {row.original.lastName}
            </span>
          </div>
        ),
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Role column with badge
      {
        id: 'role',
        accessorFn: (row) => row.role.name,
        header: 'Role',
        cell: ({ row }) => <Badge variant="outline">{row.original.role.name}</Badge>,
        enableSorting: true,
        meta: {
          sortable: true,
        },
      },

      // Tenant column (conditionally visible for super admin)
      {
        id: 'tenant',
        header: 'Tenant',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.tenant?.name || 'System'}</span>
        ),
        enableSorting: false,
        meta: {
          sortable: false,
          visibleIf: (permissions: string[]) => permissions.includes('users:read:all'),
        },
      },

      // Status column with badge
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
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
      key: 'email',
      direction: 'asc',
    },
    rowsPerPage: 10,
    selectable: false,
  },

  // ========== Form Configuration ==========
  form: {
    component: UserForm,
    dialogSize: 'default',
    getDialogTitle: (user) => (user ? `Edit ${user.email}` : 'Create User'),
  },

  // ========== Custom Actions ==========
  customActions: [
    {
      id: 'impersonate',
      label: 'Impersonate',
      icon: UserCog,
      variant: 'default',
      location: ['row'],
      permissions: ['impersonate:any', 'impersonate:own'],
      handler: async () => {
        // TODO: Implement impersonation logic when backend endpoint is ready
        // Implementation will use the entity parameter once backend is ready
        return Promise.resolve();
      },
      shouldShow: (user) => user.status === 'active',
    },
  ] as CustomAction<UserListItem>[],

  // ========== Search Configuration ==========
  search: {
    enabled: true,
    placeholder: 'Search users by name or email...',
    searchableFields: ['email', 'firstName', 'lastName'],
    debounceMs: 300,
    minChars: 2,
  },

  // ========== Delete Validation ==========
  deleteValidation: {
    canDelete: (user) => ({
      allowed: true,
      reason: undefined,
    }),
    warningMessage: (user) =>
      `This will permanently delete the user "${user.email}". This action cannot be undone.`,
  },
};
