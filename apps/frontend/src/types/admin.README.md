# Admin CRUD Type System - Architecture Documentation

## Overview

This type system enables **configuration-based admin CRUD interfaces** where each resource (users, tenants, roles, permissions) is defined by a declarative configuration object instead of duplicated component code.

## Core Concept

Instead of creating separate components for each resource:

```tsx
// ❌ OLD WAY: Duplicated components
<UserManagement />
<TenantManagement />
<RoleManagement />
<PermissionManagement />
```

We define configurations and use a single generic component:

```tsx
// ✅ NEW WAY: Configuration-driven
<ResourceManager config={userResourceConfig} />
<ResourceManager config={tenantResourceConfig} />
<ResourceManager config={roleResourceConfig} />
<ResourceManager config={permissionResourceConfig} />
```

## File Structure

```
apps/frontend/src/
├── types/
│   ├── admin.ts              # Type definitions (THIS FILE)
│   ├── admin.example.ts      # Usage examples
│   └── admin.README.md       # Documentation (YOU ARE HERE)
├── config/
│   └── resources/            # Resource configurations (to be created)
│       ├── users.config.ts
│       ├── tenants.config.ts
│       ├── roles.config.ts
│       └── permissions.config.ts
├── components/
│   └── admin/
│       ├── ResourceManager/  # Generic CRUD component (to be created)
│       │   ├── ResourceManager.tsx
│       │   ├── ResourceTable.tsx
│       │   ├── ResourceActions.tsx
│       │   └── ResourceForm.tsx
│       └── [existing components]
└── pages/
    └── admin/
        ├── UsersPage.tsx     # Just renders <ResourceManager config={...} />
        ├── TenantsPage.tsx
        └── RolesPage.tsx
```

## Type System Architecture

### 1. Core Generic Types

```typescript
// Base entity requirement
type Entity = { id: string };

// Generic resource config
interface ResourceConfig<
  TEntity extends Entity,      // e.g., SafeUser, Role, Tenant
  TCreateInput,                // e.g., CreateUserDto
  TUpdateInput                 // e.g., UpdateUserDto
>
```

**Why Generics?**

- Full type safety across all operations
- TypeScript inference for form data, API responses, table columns
- Compile-time errors for invalid configurations

### 2. Configuration Sections

Each `ResourceConfig` has these sections:

#### A. Metadata (Required)

```typescript
metadata: {
  singular: 'User',
  plural: 'Users',
  icon: Users,
  description: 'Manage users and their roles',
  emptyMessage: 'No users found',
}
```

**Purpose**: Display information and UI labels

#### B. Permissions (Required)

```typescript
permissions: {
  create: ['users:create:all', 'users:create:own'],
  read: ['users:read:all', 'users:read:own'],
  update: ['users:update:all', 'users:update:own'],
  delete: ['users:delete:all', 'users:delete:own'],
  custom: {
    impersonate: ['impersonate:any', 'impersonate:own'],
  }
}
```

**Purpose**: Access control for operations and UI elements

#### C. Hooks (Required)

```typescript
hooks: {
  useList: useUsers,
  useGet: useUser,
  useCreate: useCreateUser,
  useUpdate: useUpdateUser,
  useDelete: useDeleteUser,
  custom: {
    useImpersonate: useImpersonateUser,
  }
}
```

**Purpose**: TanStack Query integration for data operations

#### D. Table (Required)

```typescript
table: {
  columns: [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user) => <UserEmailCell user={user} />,
    },
    {
      key: 'tenant',
      label: 'Tenant',
      visibleIf: (perms) => perms.includes('users:read:all'),
      render: (user) => user.tenant?.name,
    }
  ],
  defaultSort: { key: 'email', direction: 'asc' },
  rowsPerPage: 25,
}
```

**Purpose**: Table configuration with type-safe columns

**Key Features**:

- `visibleIf`: Permission-based column visibility
- `render`: Custom cell rendering with full entity type
- `sortable`: Enable sorting for column

#### E. Form (Required)

```typescript
form: {
  component: UserForm,
  defaultValues: { status: 'active' },
  validationSchema: userSchema,
  dialogSize: 'lg',
}
```

**Purpose**: Create/Edit form configuration

#### F. Custom Actions (Optional)

```typescript
customActions: [
  {
    id: 'impersonate',
    label: 'Impersonate',
    icon: UserCog,
    location: ['row'],
    permissions: ['impersonate:any'],
    confirmation: {
      title: 'Impersonate User',
      description: 'You will be logged in as this user',
    },
    handler: async (user, { useImpersonate }) => {
      const { mutateAsync } = useImpersonate();
      await mutateAsync(user.id);
    },
  },
];
```

**Purpose**: Entity-specific operations beyond CRUD

**Supported Locations**:

- `row`: In row action menu
- `bulk`: In bulk actions toolbar
- `header`: In page header

#### G. Delete Validation (Optional)

```typescript
deleteValidation: {
  canDelete: (role) => ({
    allowed: role.userCount === 0,
    reason: role.userCount > 0
      ? `Cannot delete role with ${role.userCount} users`
      : undefined,
    suggestedAction: 'Reassign users first',
  }),
  warningMessage: 'This action cannot be undone',
}
```

**Purpose**: Prevent invalid deletes with user-friendly messages

#### H. Search & Filters (Optional)

```typescript
search: {
  enabled: true,
  placeholder: 'Search users...',
  searchableFields: ['email', 'firstName', 'lastName'],
  debounceMs: 300,
},

filters: [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  }
]
```

**Purpose**: Data discovery and filtering

## TanStack Query Integration

### Type-Safe Hooks

The `ResourceHooks` interface ensures proper typing:

```typescript
interface ResourceHooks<TEntity, TCreateInput, TUpdateInput> {
  useList: (filters?) => UseQueryResult<TEntity[], Error>;
  useGet?: (id) => UseQueryResult<TEntity, Error>;
  useCreate: () => UseMutationResult<TEntity, Error, TCreateInput, unknown>;
  useUpdate: () => UseMutationResult<TEntity, Error, { id; data: TUpdateInput }, unknown>;
  useDelete: () => UseMutationResult<void, Error, string, unknown>;
}
```

### Example Hook Usage

```typescript
// In ResourceManager component
const { data, isLoading, error } = config.hooks.useList(filters);
const { mutate: createEntity } = config.hooks.useCreate();
const { mutate: updateEntity } = config.hooks.useUpdate();
const { mutate: deleteEntity } = config.hooks.useDelete();

// Type-safe mutation calls
createEntity(
  { email: 'user@example.com', ... }, // Typed as TCreateInput
  {
    onSuccess: (user) => { // user typed as TEntity
      toast.success(`${config.metadata.singular} created`);
    },
  }
);
```

## Permission-Based Rendering

### Column Visibility

```typescript
{
  key: 'tenant',
  label: 'Tenant',
  visibleIf: (permissions) => permissions.includes('users:read:all'),
  render: (user) => user.tenant?.name,
}
```

**How it works**:

1. `ResourceManager` gets current user permissions
2. Filters columns based on `visibleIf` function
3. Only renders visible columns

### Action Availability

```typescript
{
  id: 'suspend',
  permissions: ['tenants:suspend'],
  shouldShow: (tenant) => tenant.status === 'active',
}
```

**How it works**:

1. Check user has required permissions
2. Check entity-specific condition (`shouldShow`)
3. Only render action if both pass

## Form Integration

### Form Component Contract

All form components must implement:

```typescript
interface FormProps<TEntity, TFormData> {
  entity?: TEntity; // Undefined for create, entity for edit
  open: boolean;
  onClose: () => void;
  onSuccess?: (entity: TEntity) => void;
  initialData?: TFormData;
}
```

### Example Form Component

```typescript
export const UserForm: React.FC<FormProps<SafeUser, CreateUserDto>> = ({
  entity,
  open,
  onClose,
  onSuccess,
}) => {
  const { mutate: createUser } = useCreateUser();
  const { mutate: updateUser } = useUpdateUser();

  const handleSubmit = (data: CreateUserDto) => {
    if (entity) {
      updateUser(
        { id: entity.id, data },
        { onSuccess: (user) => { onSuccess?.(user); onClose(); } }
      );
    } else {
      createUser(
        data,
        { onSuccess: (user) => { onSuccess?.(user); onClose(); } }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Form fields */}
    </Dialog>
  );
};
```

## Custom Actions

### Action Handler Pattern

```typescript
{
  id: 'suspend',
  handler: async (tenant, { useSuspend }) => {
    const { mutateAsync } = useSuspend();
    await mutateAsync(tenant.id);
  },
}
```

**Parameters**:

- `tenant`: Single entity or array (for bulk actions)
- `{ useSuspend }`: Custom hooks from `hooks.custom`

**Return**: Promise (enables loading states)

### Confirmation Dialog

```typescript
confirmation: {
  title: 'Suspend Tenant',
  description: (tenant) => `Suspend "${tenant.name}"?`,
  confirmText: 'Suspend',
  variant: 'destructive',
}
```

**Features**:

- Dynamic messages with entity data
- Destructive variant for dangerous operations
- Bulk operation count display

## Delete Validation

### Validation Function

```typescript
canDelete: (role: RoleWithStats) => ({
  allowed: role.userCount === 0,
  reason: role.userCount > 0 ? `Cannot delete role with ${role.userCount} users` : undefined,
  suggestedAction: 'Reassign users to another role first',
});
```

**Return Type**:

```typescript
{
  allowed: boolean;
  reason?: string;
  suggestedAction?: string;
}
```

### UI Integration

```typescript
// In ResourceManager
const validation = config.deleteValidation?.canDelete(entity);

if (!validation.allowed) {
  toast.error(validation.reason);
  if (validation.suggestedAction) {
    toast.info(validation.suggestedAction);
  }
  return;
}
```

## Implementation Roadmap

### Phase 1: Core Types ✅ (THIS PR)

- [x] Define `ResourceConfig` and all supporting types
- [x] Create usage examples
- [x] Write comprehensive documentation

### Phase 2: ResourceManager Component (NEXT)

- [ ] Create `ResourceManager` wrapper component
- [ ] Implement `ResourceTable` with permission filtering
- [ ] Implement `ResourceActions` with custom action support
- [ ] Implement `ResourceForm` dialog management

### Phase 3: Resource Configurations

- [ ] Create `users.config.ts` (migrate from UserManagement)
- [ ] Create `tenants.config.ts` (migrate from tenant code)
- [ ] Create `roles.config.ts`
- [ ] Create `permissions.config.ts`

### Phase 4: Page Migration

- [ ] Update admin pages to use ResourceManager
- [ ] Remove old management components
- [ ] Add tests for ResourceManager

### Phase 5: Advanced Features

- [ ] Implement search and filtering
- [ ] Implement bulk operations
- [ ] Implement export functionality
- [ ] Add pagination support

## Benefits Summary

### 1. Reduced Code Duplication

- **Before**: 500+ lines per resource (UserManagement, TenantManagement, etc.)
- **After**: ~150 lines config + shared 300-line ResourceManager

### 2. Type Safety

- Full TypeScript inference throughout
- Compile-time errors for misconfigurations
- IntelliSense support for all config properties

### 3. Consistency

- All admin pages use same patterns
- Uniform UX across resources
- Shared validation and error handling

### 4. Maintainability

- Single source of truth per resource (config file)
- Easy to add/modify features
- Clear separation of concerns

### 5. Extensibility

- Add new resource = create config file
- Custom actions without touching base code
- Optional features as needed

### 6. Developer Experience

- Declarative configuration (easy to read)
- Clear type errors and autocomplete
- Self-documenting code

## Usage Examples

See `admin.example.ts` for complete working examples of:

- User management with impersonation
- Tenant management with suspend/activate
- Role management with relationship validation

## Testing Strategy

### Type Testing

```typescript
// Compile-time type checks
import type { ResourceConfig } from '@/types/admin';
import type { SafeUser } from '@ftry/shared/types';

// Should compile
const validConfig: ResourceConfig<SafeUser, CreateUserDto, UpdateUserDto> = {
  // ... valid config
};

// Should NOT compile
const invalidConfig: ResourceConfig<SafeUser, CreateUserDto, UpdateUserDto> = {
  metadata: { singular: 123 }, // ❌ Type error
};
```

### Runtime Testing

```typescript
describe('ResourceManager', () => {
  it('renders table with correct columns', () => {
    render(<ResourceManager config={userResourceConfig} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('filters columns based on permissions', () => {
    // Mock user without global permissions
    render(<ResourceManager config={userResourceConfig} />);
    expect(screen.queryByText('Tenant')).not.toBeInTheDocument();
  });

  it('executes custom actions', async () => {
    render(<ResourceManager config={userResourceConfig} />);
    await userEvent.click(screen.getByText('Impersonate'));
    expect(mockImpersonate).toHaveBeenCalled();
  });
});
```

## Related Documentation

- `apps/frontend/src/types/admin.ts` - Type definitions
- `apps/frontend/src/types/admin.example.ts` - Usage examples
- `apps/frontend/src/lib/admin/admin.api.ts` - API client
- `apps/frontend/src/hooks/useAdminData.ts` - TanStack Query hooks
- `libs/shared/types/src/lib/admin/permissions.ts` - Permission constants

## Questions?

This is a design document. Implementation will happen in subsequent PRs:

1. This PR: Type definitions only
2. Next PR: ResourceManager component
3. Final PR: Migrate existing admin pages

---

**Last Updated**: 2025-10-10
**Status**: Design Phase - Types Defined ✅
**Next Step**: Implement ResourceManager component
