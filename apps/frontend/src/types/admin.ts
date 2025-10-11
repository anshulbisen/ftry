/**
 * Admin CRUD System Type Definitions
 *
 * Comprehensive type system for configuration-based admin resource management.
 * This enables declarative CRUD UIs where each entity (users, tenants, roles, etc.)
 * is defined by a configuration object instead of duplicated component code.
 *
 * @module types/admin
 * @see apps/frontend/src/lib/admin/admin.api.ts - API client integration
 * @see apps/frontend/src/hooks/useAdminData.ts - TanStack Query hooks
 * @see apps/frontend/src/components/admin/users/UserManagement.tsx - Reference implementation
 */

import type { LucideIcon } from 'lucide-react';
import type { AdminPermission } from '@ftry/shared/types';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Generic entity type with required id field
 * All admin resources must have a string id
 */
export type Entity = { id: string };

/**
 * Generic filter type for query parameters
 * Supports flexible filtering across different resource types
 */
export type ResourceFilters = Record<string, unknown>;

// ============================================================================
// METADATA & DISPLAY
// ============================================================================

/**
 * Entity Metadata Configuration
 *
 * Defines how a resource is displayed throughout the admin interface.
 *
 * @example
 * ```ts
 * const userMetadata: EntityMetadata = {
 *   singular: 'User',
 *   plural: 'Users',
 *   icon: Users,
 *   description: 'Manage users and their roles',
 *   emptyMessage: 'No users found. Create your first user to get started.',
 * };
 * ```
 */
export interface EntityMetadata {
  /** Singular form of entity name (e.g., "User") */
  singular: string;

  /** Plural form of entity name (e.g., "Users") */
  plural: string;

  /** Lucide icon component for visual identification */
  icon: LucideIcon;

  /** Short description shown in page header */
  description?: string;

  /** Message displayed when no data exists */
  emptyMessage?: string;

  /** Loading message during data fetch */
  loadingMessage?: string;

  /** Error message prefix (appends actual error) */
  errorMessagePrefix?: string;
}

// ============================================================================
// PERMISSIONS & ACCESS CONTROL
// ============================================================================

/**
 * Permission Mapping Configuration
 *
 * Maps CRUD operations to permission strings for access control.
 * Supports both simple (all/own) and complex permission patterns.
 *
 * @example
 * ```ts
 * const userPermissions: PermissionMap = {
 *   create: ['users:create:all', 'users:create:own'],
 *   read: ['users:read:all', 'users:read:own'],
 *   update: ['users:update:all', 'users:update:own'],
 *   delete: ['users:delete:all', 'users:delete:own'],
 *   // Optional custom operations
 *   custom: {
 *     impersonate: ['impersonate:any', 'impersonate:own'],
 *     export: ['users:export:all'],
 *   }
 * };
 * ```
 */
export interface PermissionMap {
  /** Permissions required to create new resources */
  create?: AdminPermission[];

  /** Permissions required to read/list resources */
  read?: AdminPermission[];

  /** Permissions required to update existing resources */
  update?: AdminPermission[];

  /** Permissions required to delete resources */
  delete?: AdminPermission[];

  /** Custom operation permissions (e.g., suspend, activate, impersonate) */
  custom?: Record<string, AdminPermission[]>;
}

// ============================================================================
// REACT QUERY INTEGRATION
// ============================================================================

/**
 * TanStack Query Hook Configuration
 *
 * Defines query and mutation hooks for a resource with full type safety.
 * Uses TanStack Query's built-in types for proper integration.
 *
 * @template TEntity - The entity type (e.g., SafeUser, Role, Tenant)
 * @template TCreateInput - Input type for creation (e.g., CreateUserDto)
 * @template TUpdateInput - Input type for updates (e.g., UpdateUserDto)
 *
 * @example
 * ```ts
 * const userHooks: ResourceHooks<SafeUser, CreateUserDto, UpdateUserDto> = {
 *   useList: (filters) => useUsers(filters),
 *   useGet: (id) => useUser(id),
 *   useCreate: () => useCreateUser(),
 *   useUpdate: () => useUpdateUser(),
 *   useDelete: () => useDeleteUser(),
 * };
 * ```
 */
export interface ResourceHooks<
  TEntity extends Entity,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>,
> {
  /**
   * Hook to fetch list of entities with optional filtering
   * @param filters - Optional query parameters for filtering/searching
   * @returns TanStack Query result with entity array (may be undefined during loading)
   */
  useList: (filters?: ResourceFilters) => UseQueryResult<TEntity[] | undefined, Error>;

  /**
   * Hook to fetch single entity by ID
   * @param id - Entity unique identifier
   * @returns TanStack Query result with single entity (may be undefined during loading)
   */
  useGet?: (id: string) => UseQueryResult<TEntity | undefined, Error>;

  /**
   * Hook to create new entity
   * @returns TanStack Mutation result
   */
  useCreate: () => UseMutationResult<TEntity | undefined, Error, TCreateInput, unknown>;

  /**
   * Hook to update existing entity
   * @returns TanStack Mutation result with id and data parameters
   */
  useUpdate: () => UseMutationResult<
    TEntity | undefined,
    Error,
    { id: string; data: TUpdateInput },
    unknown
  >;

  /**
   * Hook to delete entity
   * @returns TanStack Mutation result with id parameter
   */
  useDelete: () => UseMutationResult<void | undefined, Error, string, unknown>;

  /**
   * Optional custom mutation hooks for entity-specific operations
   * @example
   * ```ts
   * custom: {
   *   useSuspend: () => useSuspendTenant(),
   *   useActivate: () => useActivateTenant(),
   * }
   * ```
   */
  custom?: Record<string, () => UseMutationResult<unknown, Error, unknown, unknown>>;
}

// ============================================================================
// TABLE CONFIGURATION
// ============================================================================

/**
 * Column Metadata
 *
 * Custom metadata stored in TanStack Table's built-in `meta` property.
 * This follows TanStack Table's official pattern for extending column definitions.
 *
 * @see https://tanstack.com/table/v8/docs/api/core/column-def#meta
 */
export interface ColumnMetadata {
  /**
   * Whether column is sortable (enables sort UI)
   * @default false
   */
  sortable?: boolean;

  /**
   * Conditional visibility based on user permissions
   * @param permissions - Current user's permission array
   * @returns true if column should be visible
   */
  visibleIf?: (permissions: string[]) => boolean;

  /**
   * CSS classes for column header
   */
  headerClassName?: string;

  /**
   * CSS classes for column cells
   */
  cellClassName?: string;

  /**
   * Column width (CSS value)
   * @example '200px', '20%', 'auto'
   */
  width?: string;
}

/**
 * Table Column Definition with Typed Metadata
 *
 * Extends TanStack Table's ColumnDef to include strongly-typed metadata.
 * Uses TanStack Table's built-in `meta` property for custom data.
 *
 * @template TEntity - The entity type being displayed
 *
 * @example
 * ```ts
 * const columns: TableColumn<SafeUser>[] = [
 *   {
 *     id: 'email',
 *     accessorKey: 'email',
 *     header: 'Email',
 *     cell: ({ row }) => (
 *       <div>
 *         <span>{row.original.email}</span>
 *         <span className="text-muted">{row.original.firstName} {row.original.lastName}</span>
 *       </div>
 *     ),
 *     enableSorting: true,
 *     meta: {
 *       sortable: true,
 *     },
 *   },
 *   {
 *     id: 'tenant',
 *     header: 'Tenant',
 *     cell: ({ row }) => row.original.tenant?.name || 'System',
 *     meta: {
 *       visibleIf: (permissions) => permissions.includes('users:read:all'),
 *     },
 *   },
 * ];
 * ```
 */
export type TableColumn<TEntity extends Entity> = ColumnDef<TEntity, unknown> & {
  /**
   * Custom metadata using TanStack Table's built-in meta property
   * Strongly typed for our admin system requirements
   */
  meta?: ColumnMetadata;
};

// ============================================================================
// FORM CONFIGURATION
// ============================================================================

/**
 * Form Component Reference
 *
 * Configuration for the create/edit form dialog component.
 * Supports both simple component reference and factory pattern.
 *
 * @template TEntity - The entity type
 * @template TFormData - The form data structure (defaults to Partial<TEntity>)
 *
 * @example
 * ```ts
 * // Simple component reference
 * const formConfig: FormConfig<SafeUser> = {
 *   component: UserForm,
 * };
 *
 * // With custom props and validation
 * const formConfig: FormConfig<Role, CreateRoleDto> = {
 *   component: RoleForm,
 *   defaultValues: { permissions: [] },
 *   validationSchema: roleSchema,
 * };
 * ```
 */
export interface FormConfig<TEntity extends Entity, TFormData = Partial<TEntity>> {
  /**
   * React component for the form
   * Receives entity for edit mode, undefined for create mode
   */
  component: React.ComponentType<FormProps<TEntity, TFormData>>;

  /**
   * Default values for create mode
   */
  defaultValues?: TFormData;

  /**
   * Zod validation schema (if using custom validation)
   */
  validationSchema?: unknown; // ZodSchema type would require importing zod

  /**
   * Custom dialog title override
   * @param entity - Entity being edited, undefined for create
   */
  getDialogTitle?: (entity?: TEntity) => string;

  /**
   * Dialog size variant
   * @default 'default'
   */
  dialogSize?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
}

/**
 * Standard Form Component Props
 *
 * Props interface that all form components must implement.
 *
 * @template TEntity - The entity type
 * @template TFormData - The form data structure
 */
export interface FormProps<TEntity extends Entity, TFormData = Partial<TEntity>> {
  /** Entity being edited (undefined for create mode) */
  entity?: TEntity;

  /** Whether dialog is open */
  open: boolean;

  /** Callback to close dialog */
  onClose: () => void;

  /** Optional callback after successful submission */
  onSuccess?: (entity: TEntity) => void;

  /** Optional initial form data override */
  initialData?: TFormData;
}

// ============================================================================
// CUSTOM ACTIONS
// ============================================================================

/**
 * Custom Action Definition
 *
 * Defines custom operations beyond standard CRUD (e.g., suspend, activate, export).
 * Actions can appear in row menus, bulk operations, or page header.
 *
 * @template TEntity - The entity type
 *
 * @example
 * ```ts
 * const suspendAction: CustomAction<Tenant> = {
 *   id: 'suspend',
 *   label: 'Suspend Tenant',
 *   icon: XCircle,
 *   variant: 'destructive',
 *   location: ['row', 'bulk'],
 *   permissions: ['tenants:suspend'],
 *   confirmation: {
 *     title: 'Suspend Tenant',
 *     description: (tenant) => `Suspend "${tenant.name}"? Users will lose access.`,
 *     confirmText: 'Suspend',
 *     variant: 'destructive',
 *   },
 *   handler: async (tenant, { useSuspend }) => {
 *     const { mutateAsync } = useSuspend();
 *     await mutateAsync(tenant.id);
 *   },
 *   shouldShow: (tenant) => tenant.status === 'active',
 * };
 * ```
 */
export interface CustomAction<TEntity extends Entity> {
  /** Unique action identifier */
  id: string;

  /** Display label */
  label: string;

  /** Lucide icon component */
  icon: LucideIcon;

  /**
   * Action appearance variant
   * @default 'default'
   */
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';

  /**
   * Where action should appear
   * - 'row': In row action menu
   * - 'bulk': In bulk actions toolbar
   * - 'header': In page header
   */
  location: Array<'row' | 'bulk' | 'header'>;

  /** Required permissions to see action */
  permissions?: AdminPermission[];

  /**
   * Confirmation dialog configuration
   * If provided, shows confirmation before executing
   */
  confirmation?: ConfirmationConfig<TEntity>;

  /**
   * Action handler function
   * @param entity - Entity being acted upon (single or array for bulk)
   * @param hooks - Custom hooks from ResourceHooks.custom
   * @returns Promise that resolves when action completes
   */
  handler: (
    entity: TEntity | TEntity[],
    hooks: Record<string, () => UseMutationResult<unknown, Error, unknown, unknown>>,
  ) => Promise<void>;

  /**
   * Conditional visibility
   * @param entity - Entity to check
   * @returns true if action should be shown
   */
  shouldShow?: (entity: TEntity) => boolean;

  /**
   * Whether action supports bulk operations
   * @default false for 'row' location, true for 'bulk' location
   */
  supportsBulk?: boolean;
}

/**
 * Confirmation Dialog Configuration
 *
 * @template TEntity - The entity type
 */
export interface ConfirmationConfig<TEntity extends Entity> {
  /** Dialog title */
  title: string | ((entity: TEntity | TEntity[]) => string);

  /** Dialog description/warning message */
  description: string | ((entity: TEntity | TEntity[]) => string);

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /**
   * Button variant
   * @default 'default'
   */
  variant?: 'default' | 'destructive';

  /**
   * Show entity count for bulk operations
   * @default true
   */
  showCount?: boolean;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Delete Validation Configuration
 *
 * Defines rules for preventing deletion based on entity state or relationships.
 * Helps prevent data integrity issues (e.g., deleting role with active users).
 *
 * @template TEntity - The entity type
 *
 * @example
 * ```ts
 * const roleDeleteValidation: DeleteValidation<RoleWithStats> = {
 *   canDelete: (role) => ({
 *     allowed: role.userCount === 0,
 *     reason: role.userCount > 0
 *       ? `Cannot delete role with ${role.userCount} active users`
 *       : undefined,
 *   }),
 *   warningMessage: 'Deleting a role is permanent and cannot be undone.',
 * };
 * ```
 */
export interface DeleteValidation<TEntity extends Entity> {
  /**
   * Validation function to check if deletion is allowed
   * @param entity - Entity being deleted
   * @returns Validation result with optional reason
   */
  canDelete: (entity: TEntity) => DeleteValidationResult;

  /**
   * Warning message shown even when deletion is allowed
   */
  warningMessage?: string | ((entity: TEntity) => string);

  /**
   * Custom error message when validation fails
   */
  errorMessage?: string | ((entity: TEntity) => string);
}

/**
 * Delete Validation Result
 */
export interface DeleteValidationResult {
  /** Whether deletion is allowed */
  allowed: boolean;

  /** Reason why deletion is not allowed (if applicable) */
  reason?: string;

  /**
   * Suggested action to resolve blocking issue
   * @example "Reassign users to another role first"
   */
  suggestedAction?: string;
}

// ============================================================================
// SEARCH & FILTER CONFIGURATION
// ============================================================================

/**
 * Search Configuration
 *
 * Defines search behavior and filtering options for the resource list.
 *
 * @example
 * ```ts
 * const userSearch: SearchConfig = {
 *   enabled: true,
 *   placeholder: 'Search users by name or email...',
 *   searchableFields: ['email', 'firstName', 'lastName'],
 *   debounceMs: 300,
 * };
 * ```
 */
export interface SearchConfig {
  /** Whether search is enabled */
  enabled: boolean;

  /** Search input placeholder text */
  placeholder?: string;

  /**
   * Fields to search across
   * Used for client-side filtering if backend doesn't support search
   */
  searchableFields?: string[];

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;

  /**
   * Minimum characters before triggering search
   * @default 2
   */
  minChars?: number;
}

/**
 * Filter Configuration
 *
 * Defines available filters for the resource list.
 *
 * @example
 * ```ts
 * const userFilters: FilterConfig[] = [
 *   {
 *     key: 'status',
 *     label: 'Status',
 *     type: 'select',
 *     options: [
 *       { label: 'Active', value: 'active' },
 *       { label: 'Inactive', value: 'inactive' },
 *     ],
 *   },
 *   {
 *     key: 'roleId',
 *     label: 'Role',
 *     type: 'select',
 *     optionsLoader: async () => {
 *       const roles = await adminApi.getRoles();
 *       return roles.map(r => ({ label: r.name, value: r.id }));
 *     },
 *   },
 * ];
 * ```
 */
export interface FilterConfig {
  /** Filter key (query parameter name) */
  key: string;

  /** Display label */
  label: string;

  /**
   * Filter type
   * - 'select': Dropdown selection
   * - 'multiselect': Multiple selection
   * - 'date': Date picker
   * - 'daterange': Date range picker
   * - 'boolean': Toggle/checkbox
   */
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean';

  /** Static options for select/multiselect */
  options?: FilterOption[];

  /** Async options loader for select/multiselect */
  optionsLoader?: () => Promise<FilterOption[]>;

  /** Default value */
  defaultValue?: unknown;

  /** Whether filter is enabled by default */
  defaultEnabled?: boolean;

  /** Permissions required to use this filter */
  permissions?: AdminPermission[];
}

/**
 * Filter Option
 */
export interface FilterOption {
  label: string;
  value: string | number | boolean;
  icon?: LucideIcon;
  description?: string;
}

// ============================================================================
// MAIN RESOURCE CONFIGURATION
// ============================================================================

/**
 * Complete Resource Configuration
 *
 * The main configuration object that defines an entire admin CRUD interface.
 * This is the primary API for creating new admin resource pages.
 *
 * @template TEntity - The entity type (e.g., SafeUser, Role, Tenant)
 * @template TCreateInput - Input type for creation
 * @template TUpdateInput - Input type for updates
 *
 * @example
 * ```ts
 * const userResourceConfig: ResourceConfig<SafeUser, CreateUserDto, UpdateUserDto> = {
 *   // Entity identification and display
 *   metadata: {
 *     singular: 'User',
 *     plural: 'Users',
 *     icon: Users,
 *     description: 'Manage users and their roles',
 *     emptyMessage: 'No users found. Create your first user to get started.',
 *   },
 *
 *   // Permission-based access control
 *   permissions: {
 *     create: ['users:create:all', 'users:create:own'],
 *     read: ['users:read:all', 'users:read:own'],
 *     update: ['users:update:all', 'users:update:own'],
 *     delete: ['users:delete:all', 'users:delete:own'],
 *     custom: {
 *       impersonate: ['impersonate:any', 'impersonate:own'],
 *     },
 *   },
 *
 *   // TanStack Query integration
 *   hooks: {
 *     useList: useUsers,
 *     useGet: useUser,
 *     useCreate: useCreateUser,
 *     useUpdate: useUpdateUser,
 *     useDelete: useDeleteUser,
 *     custom: {
 *       useImpersonate: useImpersonateUser,
 *     },
 *   },
 *
 *   // Table configuration
 *   table: {
 *     columns: [
 *       {
 *         key: 'email',
 *         label: 'Email',
 *         sortable: true,
 *         render: (user) => <UserEmailCell user={user} />,
 *       },
 *       {
 *         key: 'role',
 *         label: 'Role',
 *         render: (user) => <Badge>{user.role.name}</Badge>,
 *       },
 *       {
 *         key: 'tenant',
 *         label: 'Tenant',
 *         visibleIf: (perms) => perms.includes('users:read:all'),
 *         render: (user) => user.tenant?.name || 'System',
 *       },
 *     ],
 *     defaultSort: { key: 'email', direction: 'asc' },
 *     rowsPerPage: 25,
 *   },
 *
 *   // Form configuration
 *   form: {
 *     component: UserForm,
 *     defaultValues: { status: 'active' },
 *     validationSchema: userSchema,
 *   },
 *
 *   // Custom actions beyond CRUD
 *   customActions: [
 *     {
 *       id: 'impersonate',
 *       label: 'Impersonate',
 *       icon: UserCog,
 *       location: ['row'],
 *       permissions: ['impersonate:any', 'impersonate:own'],
 *       handler: async (user, { useImpersonate }) => {
 *         const { mutateAsync } = useImpersonate();
 *         await mutateAsync(user.id);
 *       },
 *     },
 *   ],
 *
 *   // Delete validation
 *   deleteValidation: {
 *     canDelete: (user) => ({
 *       allowed: user.status !== 'system',
 *       reason: user.status === 'system' ? 'Cannot delete system users' : undefined,
 *     }),
 *     warningMessage: 'This action cannot be undone.',
 *   },
 *
 *   // Search and filtering
 *   search: {
 *     enabled: true,
 *     placeholder: 'Search users...',
 *     searchableFields: ['email', 'firstName', 'lastName'],
 *   },
 *
 *   filters: [
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       type: 'select',
 *       options: [
 *         { label: 'Active', value: 'active' },
 *         { label: 'Inactive', value: 'inactive' },
 *       ],
 *     },
 *   ],
 * };
 * ```
 */
export interface ResourceConfig<
  TEntity extends Entity,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>,
> {
  // ========== Core Configuration ==========

  /**
   * Entity metadata for display and identification
   */
  metadata: EntityMetadata;

  /**
   * Permission mappings for access control
   */
  permissions: PermissionMap;

  /**
   * TanStack Query hooks for data operations
   */
  hooks: ResourceHooks<TEntity, TCreateInput, TUpdateInput>;

  // ========== Table Configuration ==========

  /**
   * Table column definitions and behavior
   */
  table: {
    /** Column definitions */
    columns: TableColumn<TEntity>[];

    /** Default sorting configuration */
    defaultSort?: {
      key: string;
      direction: 'asc' | 'desc';
    };

    /** Rows per page */
    rowsPerPage?: number;

    /** Enable row selection */
    selectable?: boolean;

    /** Custom row click handler */
    onRowClick?: (entity: TEntity) => void;

    /** Custom empty state component */
    emptyState?: React.ComponentType;

    /** Custom loading state component */
    loadingState?: React.ComponentType;
  };

  // ========== Form Configuration ==========

  /**
   * Form component configuration for create/edit dialogs
   */
  form: FormConfig<TEntity, TCreateInput>;

  // ========== Optional Features ==========

  /**
   * Custom actions beyond standard CRUD
   */
  customActions?: CustomAction<TEntity>[];

  /**
   * Delete validation rules
   */
  deleteValidation?: DeleteValidation<TEntity>;

  /**
   * Search configuration
   */
  search?: SearchConfig;

  /**
   * Filter configurations
   */
  filters?: FilterConfig[];

  /**
   * Bulk operations configuration
   */
  bulkOperations?: {
    /** Enable bulk selection */
    enabled: boolean;

    /** Enable bulk delete */
    allowDelete?: boolean;

    /** Custom bulk actions */
    customActions?: CustomAction<TEntity>[];
  };

  /**
   * Export configuration
   */
  export?: {
    /** Enable export functionality */
    enabled: boolean;

    /** Supported export formats */
    formats?: Array<'csv' | 'xlsx' | 'json'>;

    /** Required permissions */
    permissions?: AdminPermission[];

    /** Custom export handler */
    handler?: (entities: TEntity[]) => Promise<void>;
  };

  /**
   * Page-level customization
   */
  page?: {
    /** Custom page header component */
    header?: React.ComponentType<{ metadata: EntityMetadata }>;

    /** Additional header actions */
    headerActions?: React.ComponentType;

    /** Show breadcrumbs */
    showBreadcrumbs?: boolean;

    /** Custom breadcrumb items */
    breadcrumbs?: BreadcrumbItem[];
  };
}

/**
 * Breadcrumb Item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract entity type from ResourceConfig
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractEntity<T> = T extends ResourceConfig<infer E, any, any> ? E : never;

/**
 * Extract create input type from ResourceConfig
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractCreateInput<T> = T extends ResourceConfig<any, infer C, any> ? C : never;

/**
 * Extract update input type from ResourceConfig
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractUpdateInput<T> = T extends ResourceConfig<any, any, infer U> ? U : never;

/**
 * Partial ResourceConfig for overriding defaults
 */
export type PartialResourceConfig<
  TEntity extends Entity,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>,
> = Partial<ResourceConfig<TEntity, TCreateInput, TUpdateInput>> & {
  metadata: EntityMetadata;
  hooks: ResourceHooks<TEntity, TCreateInput, TUpdateInput>;
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if action supports bulk operations
 */
export function isBulkAction<TEntity extends Entity>(action: CustomAction<TEntity>): boolean {
  return (
    action.location.includes('bulk') ||
    (action.supportsBulk === true && action.location.includes('row'))
  );
}

/**
 * Type guard to check if entity has required fields
 */
export function isValidEntity(entity: unknown): entity is Entity {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'id' in entity &&
    typeof (entity as Entity).id === 'string'
  );
}
