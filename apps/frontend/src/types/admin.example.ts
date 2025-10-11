/**
 * Admin CRUD System - Usage Examples
 *
 * This file demonstrates how to use the ResourceConfig type system to create
 * declarative admin CRUD interfaces. These are EXAMPLES ONLY - not actual
 * implementation code.
 *
 * NOTE: This file is for documentation purposes and intentionally uses
 * placeholder implementations. It will not compile as-is. See the type
 * definitions in admin.ts and the README for actual usage patterns.
 *
 * @see apps/frontend/src/types/admin.ts - Type definitions
 */

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Users, Building2, Shield, UserCog, XCircle, CheckCircle } from 'lucide-react';
import type { SafeUser, Role, Tenant, Permission } from '@ftry/shared/types';
import type { ResourceConfig, CustomAction, DeleteValidation, TableColumn } from '@/types/admin';
import type { TenantWithStats, RoleWithStats, UserListItem } from '@/lib/admin/admin.api';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';

// These would be imported from actual hook implementations
declare const useUsers: () => UseQueryResult<UserListItem[] | undefined, Error>;
declare const useCreateUser: () => UseMutationResult<UserListItem | undefined, Error, any, unknown>;
declare const useUpdateUser: () => UseMutationResult<
  UserListItem | undefined,
  Error,
  { id: string; data: any },
  unknown
>;
declare const useDeleteUser: () => UseMutationResult<void | undefined, Error, string, unknown>;
declare const useTenants: () => UseQueryResult<TenantWithStats[] | undefined, Error>;
declare const useCreateTenant: () => UseMutationResult<
  TenantWithStats | undefined,
  Error,
  Partial<Tenant>,
  unknown
>;
declare const useUpdateTenant: () => UseMutationResult<
  TenantWithStats | undefined,
  Error,
  { id: string; data: Partial<Tenant> },
  unknown
>;
declare const useDeleteTenant: () => UseMutationResult<void | undefined, Error, string, unknown>;
declare const useSuspendTenant: () => UseMutationResult<unknown, Error, unknown, unknown>;
declare const useActivateTenant: () => UseMutationResult<unknown, Error, unknown, unknown>;
declare const useRoles: () => UseQueryResult<RoleWithStats[] | undefined, Error>;
declare const useCreateRole: () => UseMutationResult<
  RoleWithStats | undefined,
  Error,
  any,
  unknown
>;
declare const useUpdateRole: () => UseMutationResult<
  RoleWithStats | undefined,
  Error,
  { id: string; data: any },
  unknown
>;
declare const useDeleteRole: () => UseMutationResult<void | undefined, Error, string, unknown>;

// Assume these form components exist
// import { UserForm } from '@/components/admin/users/UserForm';
// import { TenantForm } from '@/components/admin/tenants/TenantForm';
// import { RoleForm } from '@/components/admin/roles/RoleForm';

// ============================================================================
// EXAMPLE 1: USER MANAGEMENT CONFIGURATION
// ============================================================================

/**
 * Complete user management configuration demonstrating all features:
 * - Permission-based column visibility
 * - Custom actions (impersonate)
 * - Delete validation
 * - Search and filtering
 */
export const userResourceConfig: ResourceConfig<
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
  // Basic metadata
  metadata: {
    singular: 'User',
    plural: 'Users',
    icon: Users,
    description: 'Manage users and their roles',
    emptyMessage: 'No users found. Create your first user to get started.',
    loadingMessage: 'Loading users...',
    errorMessagePrefix: 'Failed to load users',
  },

  // Permission mappings
  permissions: {
    create: ['users:create:all', 'users:create:own'],
    read: ['users:read:all', 'users:read:own'],
    update: ['users:update:all', 'users:update:own'],
    delete: ['users:delete:all', 'users:delete:own'],
    custom: {
      impersonate: ['impersonate:any', 'impersonate:own'],
    },
  },

  // TanStack Query hooks
  hooks: {
    useList: useUsers,
    useCreate: useCreateUser,
    useUpdate: useUpdateUser,
    useDelete: useDeleteUser,
    // Custom hook for impersonation
    custom: {
      useImpersonate: () => {
        // This would be the actual impersonate mutation hook
        throw new Error('Not implemented - example only');
      },
    },
  },

  // Table configuration
  table: {
    columns: [
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        width: '30%',
        render: (user) => ({
          /* <UserEmailCell user={user} /> */
        }),
      } as TableColumn<UserListItem>,
      {
        key: 'role',
        label: 'Role',
        sortable: true,
        render: (user) => ({
          /* <Badge>{user.role.name}</Badge> */
        }),
      } as TableColumn<UserListItem>,
      {
        key: 'tenant',
        label: 'Tenant',
        // Only show tenant column to super admins
        visibleIf: (permissions) => permissions.includes('users:read:all'),
        render: (user) => user.tenant?.name || 'System',
      } as TableColumn<UserListItem>,
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (user) => ({
          /* <StatusBadge status={user.status} /> */
        }),
      } as TableColumn<UserListItem>,
      {
        key: 'lastLogin',
        label: 'Last Login',
        sortable: true,
        render: (user) => ({
          /* <RelativeTime date={user.lastLogin} /> */
        }),
      } as TableColumn<UserListItem>,
    ],
    defaultSort: {
      key: 'email',
      direction: 'asc',
    },
    rowsPerPage: 25,
    selectable: true,
  },

  // Form configuration
  form: {
    component: null as any, // UserForm would go here
    defaultValues: {
      status: 'active',
    },
    dialogSize: 'default',
    getDialogTitle: (user) => (user ? `Edit ${user.email}` : 'Create User'),
  },

  // Custom actions
  customActions: [
    {
      id: 'impersonate',
      label: 'Impersonate',
      icon: UserCog,
      variant: 'outline',
      location: ['row'],
      permissions: ['impersonate:any', 'impersonate:own'],
      confirmation: {
        title: 'Impersonate User',
        description: (user) =>
          `You are about to impersonate "${(user as UserListItem).email}". You will be logged in as this user.`,
        confirmText: 'Impersonate',
        variant: 'default',
      },
      handler: async (user, { useImpersonate }) => {
        const { mutateAsync } = useImpersonate();
        await mutateAsync((user as UserListItem).id);
      },
      shouldShow: (user) => user.status === 'active',
    },
  ],

  // Delete validation
  deleteValidation: {
    canDelete: (user) => ({
      allowed: user.status !== 'system',
      reason: user.status === 'system' ? 'Cannot delete system users' : undefined,
      suggestedAction: user.status === 'system' ? 'Deactivate the user instead' : undefined,
    }),
    warningMessage: 'Deleting a user is permanent and cannot be undone.',
  },

  // Search configuration
  search: {
    enabled: true,
    placeholder: 'Search users by name or email...',
    searchableFields: ['email', 'firstName', 'lastName'],
    debounceMs: 300,
    minChars: 2,
  },

  // Filters
  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Suspended', value: 'suspended' },
      ],
      defaultValue: 'active',
    },
    {
      key: 'roleId',
      label: 'Role',
      type: 'select',
      optionsLoader: async () => {
        // This would fetch roles from API
        return [
          { label: 'All Roles', value: '' },
          { label: 'Admin', value: 'role-1' },
          { label: 'Manager', value: 'role-2' },
        ];
      },
    },
  ],

  // Bulk operations
  bulkOperations: {
    enabled: true,
    allowDelete: true,
    customActions: [
      {
        id: 'bulk-activate',
        label: 'Activate Selected',
        icon: CheckCircle,
        variant: 'default',
        location: ['bulk'],
        permissions: ['users:update:all', 'users:update:own'],
        handler: async (users) => {
          // Bulk activate implementation
          console.log('Activating users:', users);
        },
      },
    ],
  },

  // Export configuration
  export: {
    enabled: true,
    formats: ['csv', 'xlsx'],
    permissions: ['users:read:all', 'users:read:own'],
  },
};

// ============================================================================
// EXAMPLE 2: TENANT MANAGEMENT CONFIGURATION
// ============================================================================

/**
 * Tenant management configuration demonstrating:
 * - Extended entity types (TenantWithStats)
 * - Multiple custom actions (suspend, activate)
 * - Complex delete validation
 */
export const tenantResourceConfig: ResourceConfig<
  TenantWithStats,
  Partial<Tenant>,
  Partial<Tenant>
> = {
  metadata: {
    singular: 'Tenant',
    plural: 'Tenants',
    icon: Building2,
    description: 'Manage tenant organizations',
    emptyMessage: 'No tenants found. Create your first tenant organization.',
  },

  permissions: {
    create: ['tenants:create'],
    read: ['tenants:read:all', 'tenants:read:own'],
    update: ['tenants:update:all', 'tenants:update:own'],
    delete: ['tenants:delete'],
    custom: {
      suspend: ['tenants:suspend'],
      activate: ['tenants:suspend'],
    },
  },

  hooks: {
    useList: useTenants,
    useCreate: useCreateTenant,
    useUpdate: useUpdateTenant,
    useDelete: useDeleteTenant,
    custom: {
      useSuspend: useSuspendTenant,
      useActivate: useActivateTenant,
    },
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (tenant) => ({
          /* <TenantNameCell tenant={tenant} /> */
        }),
      } as TableColumn<TenantWithStats>,
      {
        key: 'userCount',
        label: 'Users',
        sortable: true,
        render: (tenant) => tenant.userCount,
      } as TableColumn<TenantWithStats>,
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (tenant) => ({
          /* <StatusBadge status={tenant.status} /> */
        }),
      } as TableColumn<TenantWithStats>,
      {
        key: 'subscriptionPlan',
        label: 'Plan',
        render: (tenant) => tenant.subscriptionPlan || 'Free',
      } as TableColumn<TenantWithStats>,
    ],
    defaultSort: {
      key: 'name',
      direction: 'asc',
    },
  },

  form: {
    component: null as any, // TenantForm
    dialogSize: 'lg',
  },

  // Custom actions for suspend/activate
  customActions: [
    {
      id: 'suspend',
      label: 'Suspend Tenant',
      icon: XCircle,
      variant: 'destructive',
      location: ['row'],
      permissions: ['tenants:suspend'],
      confirmation: {
        title: 'Suspend Tenant',
        description: (tenant) =>
          `Suspend "${(tenant as TenantWithStats).name}"? All users will lose access immediately.`,
        confirmText: 'Suspend',
        variant: 'destructive',
      },
      handler: async (tenant, { useSuspend }) => {
        const { mutateAsync } = useSuspend();
        await mutateAsync((tenant as TenantWithStats).id);
      },
      shouldShow: (tenant) => tenant.status === 'active',
    },
    {
      id: 'activate',
      label: 'Activate Tenant',
      icon: CheckCircle,
      variant: 'default',
      location: ['row'],
      permissions: ['tenants:suspend'],
      handler: async (tenant, { useActivate }) => {
        const { mutateAsync } = useActivate();
        await mutateAsync((tenant as TenantWithStats).id);
      },
      shouldShow: (tenant) => tenant.status === 'suspended',
    },
  ],

  // Complex delete validation
  deleteValidation: {
    canDelete: (tenant) => {
      if (tenant.userCount > 0) {
        return {
          allowed: false,
          reason: `Cannot delete tenant with ${tenant.userCount} active users`,
          suggestedAction: 'Remove or transfer all users first',
        };
      }
      return { allowed: true };
    },
    warningMessage: 'Deleting a tenant will permanently remove all associated data.',
  },

  search: {
    enabled: true,
    placeholder: 'Search tenants...',
    searchableFields: ['name', 'slug', 'email'],
  },

  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Trial', value: 'trial' },
      ],
    },
    {
      key: 'subscriptionPlan',
      label: 'Plan',
      type: 'select',
      options: [
        { label: 'All Plans', value: '' },
        { label: 'Free', value: 'free' },
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
    },
  ],
};

// ============================================================================
// EXAMPLE 3: ROLE MANAGEMENT CONFIGURATION
// ============================================================================

/**
 * Role management configuration demonstrating:
 * - Relationship-based delete validation
 * - Permission filtering
 */
export const roleResourceConfig: ResourceConfig<
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
  metadata: {
    singular: 'Role',
    plural: 'Roles',
    icon: Shield,
    description: 'Manage roles and permissions',
    emptyMessage: 'No roles found. Create a custom role to get started.',
  },

  permissions: {
    create: ['roles:create:system', 'roles:create:tenant'],
    read: ['roles:read:all', 'roles:read:own'],
    update: ['roles:update:system', 'roles:update:tenant'],
    delete: ['roles:delete'],
  },

  hooks: {
    useList: useRoles,
    useCreate: useCreateRole,
    useUpdate: useUpdateRole,
    useDelete: useDeleteRole,
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (role) => ({
          /* <RoleNameCell role={role} /> */
        }),
      } as TableColumn<RoleWithStats>,
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        render: (role) => ({
          /* <Badge>{role.type}</Badge> */
        }),
      } as TableColumn<RoleWithStats>,
      {
        key: 'userCount',
        label: 'Users',
        sortable: true,
        render: (role) => role.userCount,
      } as TableColumn<RoleWithStats>,
      {
        key: 'permissionCount',
        label: 'Permissions',
        render: (role) => role.permissionCount,
      } as TableColumn<RoleWithStats>,
    ],
    defaultSort: {
      key: 'name',
      direction: 'asc',
    },
  },

  form: {
    component: null as any, // RoleForm
    dialogSize: 'lg',
    defaultValues: {
      permissions: [],
      type: 'tenant',
    },
  },

  // Prevent deleting roles with active users
  deleteValidation: {
    canDelete: (role) => {
      if (role.isSystem) {
        return {
          allowed: false,
          reason: 'System roles cannot be deleted',
          suggestedAction: 'Create a custom role instead',
        };
      }
      if (role.userCount > 0) {
        return {
          allowed: false,
          reason: `${role.userCount} users are assigned to this role`,
          suggestedAction: 'Reassign users to another role first',
        };
      }
      return { allowed: true };
    },
    warningMessage: 'Deleting a role is permanent and cannot be undone.',
  },

  search: {
    enabled: true,
    placeholder: 'Search roles...',
    searchableFields: ['name', 'description'],
  },

  filters: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        { label: 'System', value: 'system' },
        { label: 'Tenant', value: 'tenant' },
        { label: 'Custom', value: 'custom' },
      ],
    },
  ],
};

// ============================================================================
// BENEFITS DEMONSTRATION
// ============================================================================

/**
 * Benefits of this Type System:
 *
 * 1. TYPE SAFETY
 *    - Full TypeScript inference across all config properties
 *    - Generic types ensure consistency between entity and operations
 *    - Compile-time errors for invalid configurations
 *
 * 2. DECLARATIVE CONFIGURATION
 *    - Entire CRUD interface defined in single config object
 *    - No duplicated component code across resources
 *    - Easy to understand and modify
 *
 * 3. REUSABILITY
 *    - Single ResourceManager component handles all resources
 *    - Shared patterns (permissions, validation, actions) across entities
 *    - Consistent UX across all admin pages
 *
 * 4. MAINTAINABILITY
 *    - Add new resource = create config, no new components
 *    - Modify behavior = update config, not component code
 *    - All resource logic in one place
 *
 * 5. EXTENSIBILITY
 *    - Custom actions without touching base components
 *    - Custom validations per resource
 *    - Optional features (search, filters, export) as needed
 *
 * 6. TANSTACK QUERY INTEGRATION
 *    - Proper typing for all hooks
 *    - Automatic cache invalidation
 *    - Optimistic updates support
 *    - Loading and error states
 *
 * 7. PERMISSION-BASED RENDERING
 *    - Column visibility based on user permissions
 *    - Action availability based on permissions
 *    - Type-safe permission checks
 *
 * 8. VALIDATION SYSTEM
 *    - Type-safe delete validation
 *    - Custom validation per resource
 *    - User-friendly error messages
 *
 * Example usage in component:
 *
 * ```tsx
 * import { ResourceManager } from '@/components/admin/ResourceManager';
 * import { userResourceConfig } from '@/config/resources/users';
 *
 * export function UsersPage() {
 *   return <ResourceManager config={userResourceConfig} />;
 * }
 * ```
 *
 * That's it! The entire admin interface is rendered from the config.
 */
