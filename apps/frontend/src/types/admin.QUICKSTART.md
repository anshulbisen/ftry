# Admin CRUD Type System - Quick Start Guide

**For**: Developers creating new admin resources
**Time to Read**: 5 minutes
**Implementation Time**: 20-30 minutes per resource

---

## TL;DR

Instead of creating a new `ResourceManagement.tsx` component, create a `resource.config.ts` configuration file and use the generic `ResourceManager` component.

```tsx
// ❌ OLD WAY - 300+ lines of duplicated code
export const UserManagement = () => { /* ... */ };

// ✅ NEW WAY - 150 lines of configuration
export const userResourceConfig: ResourceConfig<...> = { /* ... */ };

// In page component:
<ResourceManager config={userResourceConfig} />
```

---

## Quick Reference: ResourceConfig Structure

```typescript
import type { ResourceConfig } from '@/types/admin';

const myResourceConfig: ResourceConfig<
  MyEntity,      // Entity type (e.g., SafeUser, Role, Tenant)
  CreateInput,   // Create DTO type
  UpdateInput    // Update DTO type
> = {
  // 1. REQUIRED: Display metadata
  metadata: {
    singular: 'User',
    plural: 'Users',
    icon: Users,  // Lucide icon
    description: 'Manage users and their roles',
  },

  // 2. REQUIRED: Permissions for access control
  permissions: {
    create: ['users:create:all', 'users:create:own'],
    read: ['users:read:all', 'users:read:own'],
    update: ['users:update:all', 'users:update:own'],
    delete: ['users:delete:all', 'users:delete:own'],
  },

  // 3. REQUIRED: TanStack Query hooks
  hooks: {
    useList: useMyEntities,
    useCreate: useCreateMyEntity,
    useUpdate: useUpdateMyEntity,
    useDelete: useDeleteMyEntity,
  },

  // 4. REQUIRED: Table configuration
  table: {
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (entity) => <span>{entity.name}</span>,
      },
    ],
    defaultSort: { key: 'name', direction: 'asc' },
  },

  // 5. REQUIRED: Form configuration
  form: {
    component: MyEntityForm,
    defaultValues: { status: 'active' },
  },

  // 6. OPTIONAL: Custom actions
  customActions: [
    {
      id: 'approve',
      label: 'Approve',
      icon: CheckCircle,
      location: ['row'],
      handler: async (entity, { useApprove }) => {
        await useApprove().mutateAsync(entity.id);
      },
    },
  ],

  // 7. OPTIONAL: Delete validation
  deleteValidation: {
    canDelete: (entity) => ({
      allowed: entity.canDelete,
      reason: 'Entity is in use',
    }),
  },

  // 8. OPTIONAL: Search
  search: {
    enabled: true,
    placeholder: 'Search...',
  },

  // 9. OPTIONAL: Filters
  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ],
};
```

---

## Step-by-Step: Add New Resource

### 1. Create Hooks (if not exists)

```typescript
// apps/frontend/src/hooks/useAdminData.ts

export const useMyEntities = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin', 'my-entities', filters],
    queryFn: () => adminApi.myEntities.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateMyEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMyEntityDto) => adminApi.myEntities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'my-entities'] });
    },
  });
};

// Similar for useUpdate, useDelete...
```

### 2. Create Form Component

```typescript
// apps/frontend/src/components/admin/my-entity/MyEntityForm.tsx

import type { FormProps } from '@/types/admin';

export const MyEntityForm: React.FC<FormProps<MyEntity, CreateMyEntityDto>> = ({
  entity,
  open,
  onClose,
  onSuccess,
}) => {
  const { mutate: create } = useCreateMyEntity();
  const { mutate: update } = useUpdateMyEntity();

  const handleSubmit = (data: CreateMyEntityDto) => {
    if (entity) {
      update({ id: entity.id, data }, { onSuccess: (e) => onSuccess?.(e) });
    } else {
      create(data, { onSuccess: (e) => onSuccess?.(e) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entity ? 'Edit' : 'Create'} Entity</DialogTitle>
        </DialogHeader>
        {/* Form fields */}
        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
};
```

### 3. Create Config File

```typescript
// apps/frontend/src/config/resources/my-entity.config.ts

import { MyIcon } from 'lucide-react';
import type { ResourceConfig } from '@/types/admin';
import { useMyEntities, useCreateMyEntity, useUpdateMyEntity, useDeleteMyEntity } from '@/hooks/useAdminData';
import { MyEntityForm } from '@/components/admin/my-entity/MyEntityForm';

export const myEntityResourceConfig: ResourceConfig<MyEntity, CreateMyEntityDto, UpdateMyEntityDto> = {
  metadata: {
    singular: 'My Entity',
    plural: 'My Entities',
    icon: MyIcon,
    description: 'Manage my entities',
  },

  permissions: {
    create: ['my-entities:create'],
    read: ['my-entities:read'],
    update: ['my-entities:update'],
    delete: ['my-entities:delete'],
  },

  hooks: {
    useList: useMyEntities,
    useCreate: useCreateMyEntity,
    useUpdate: useUpdateMyEntity,
    useDelete: useDeleteMyEntity,
  },

  table: {
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
      },
      {
        key: 'status',
        label: 'Status',
        render: (entity) => <Badge>{entity.status}</Badge>,
      },
    ],
    defaultSort: { key: 'name', direction: 'asc' },
  },

  form: {
    component: MyEntityForm,
  },
};
```

### 4. Create Page Component

```typescript
// apps/frontend/src/pages/admin/MyEntitiesPage.tsx

import { ResourceManager } from '@/components/admin/ResourceManager';
import { myEntityResourceConfig } from '@/config/resources/my-entity.config';

export const MyEntitiesPage: React.FC = () => {
  return <ResourceManager config={myEntityResourceConfig} />;
};
```

### 5. Add to Routing

```typescript
// apps/frontend/src/routes/index.tsx

import { MyEntitiesPage } from '@/pages/admin/MyEntitiesPage';

// Add route
{
  path: 'my-entities',
  element: <MyEntitiesPage />,
}
```

**Done!** You now have a complete admin CRUD interface.

---

## Common Patterns

### Pattern 1: Permission-Based Column Visibility

```typescript
columns: [
  {
    key: 'tenant',
    label: 'Tenant',
    visibleIf: (permissions) => permissions.includes('users:read:all'),
    render: (user) => user.tenant?.name,
  },
];
```

### Pattern 2: Custom Row Actions

```typescript
customActions: [
  {
    id: 'suspend',
    label: 'Suspend',
    icon: XCircle,
    variant: 'destructive',
    location: ['row'],
    permissions: ['tenants:suspend'],
    confirmation: {
      title: 'Suspend Tenant',
      description: (tenant) => `Suspend "${tenant.name}"?`,
      confirmText: 'Suspend',
      variant: 'destructive',
    },
    handler: async (tenant, { useSuspend }) => {
      const { mutateAsync } = useSuspend();
      await mutateAsync(tenant.id);
    },
    shouldShow: (tenant) => tenant.status === 'active',
  },
];
```

### Pattern 3: Relationship-Based Delete Validation

```typescript
deleteValidation: {
  canDelete: (role) => {
    if (role.userCount > 0) {
      return {
        allowed: false,
        reason: `Cannot delete role with ${role.userCount} users`,
        suggestedAction: 'Reassign users to another role first',
      };
    }
    return { allowed: true };
  },
  warningMessage: 'Deleting a role is permanent and cannot be undone.',
}
```

### Pattern 4: Search and Filter

```typescript
search: {
  enabled: true,
  placeholder: 'Search users by name or email...',
  searchableFields: ['email', 'firstName', 'lastName'],
  debounceMs: 300,
},

filters: [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  {
    key: 'roleId',
    label: 'Role',
    type: 'select',
    optionsLoader: async () => {
      const roles = await adminApi.getRoles();
      return roles.map(r => ({ label: r.name, value: r.id }));
    },
  },
]
```

---

## TypeScript Tips

### Tip 1: Let TypeScript Infer

```typescript
// ✅ Good - Let TypeScript infer from hooks
const config: ResourceConfig<SafeUser, CreateUserDto, UpdateUserDto> = {
  hooks: {
    useList: useUsers, // TypeScript knows the return type
  },
};

// ❌ Avoid - Don't wrap hooks unnecessarily
hooks: {
  useList: (filters) => useUsers(filters), // Breaks type inference
}
```

### Tip 2: Use Type Imports

```typescript
import type { ResourceConfig, TableColumn } from '@/types/admin';
import type { SafeUser } from '@ftry/shared/types';
```

### Tip 3: Extract Column Definitions

```typescript
// For complex columns, extract to constant
const USER_COLUMNS: TableColumn<SafeUser>[] = [
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (user) => <UserEmailCell user={user} />,
  },
  // ... more columns
];

const config: ResourceConfig<SafeUser> = {
  // ...
  table: {
    columns: USER_COLUMNS,
  },
};
```

---

## Troubleshooting

### Error: Type mismatch in hooks

**Problem**: Hook return type doesn't match ResourceHooks interface

**Solution**: Check your hook returns exactly `UseQueryResult<TEntity[], Error>`

```typescript
// ❌ Wrong - returns undefined
const useUsers = () => useQuery({ queryKey: ['users'] });

// ✅ Correct - explicit return type
const useUsers = (filters?: ResourceFilters): UseQueryResult<SafeUser[], Error> => {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminApi.users.getAll(filters),
  });
};
```

### Error: Column render function type error

**Problem**: Entity type in render function is `any`

**Solution**: Add explicit type to columns array

```typescript
// ❌ Wrong - entity is any
const columns = [
  {
    /* ... */
  },
];

// ✅ Correct - entity is typed
const columns: TableColumn<SafeUser>[] = [
  {
    key: 'email',
    render: (user) => user.email, // user is SafeUser
  },
];
```

### IntelliSense not working

**Problem**: No autocomplete in config

**Solution**: Add explicit type annotation

```typescript
// ❌ No IntelliSense
const config = { /* ... */ };

// ✅ Full IntelliSense
const config: ResourceConfig<SafeUser, CreateUserDto, UpdateUserDto> = {
  metadata: { // <- IntelliSense shows all fields
```

---

## Full Example

See `admin.example.ts` for complete working examples:

- User management with impersonation
- Tenant management with suspend/activate
- Role management with relationship validation

---

## Need Help?

1. **Types Reference**: `apps/frontend/src/types/admin.ts`
2. **Full Examples**: `apps/frontend/src/types/admin.example.ts`
3. **Architecture Guide**: `apps/frontend/src/types/admin.README.md`
4. **Benefits Analysis**: `apps/frontend/src/types/admin.BENEFITS.md`
5. **Design Summary**: `apps/frontend/src/types/DESIGN_SUMMARY.md`

---

**Next**: Implement ResourceManager component (Phase 2)
