# Frontend Architecture

React 19 application with modern tooling, type-safe API client, and configuration-based admin interfaces.

## Tech Stack

- **React**: 19.0.0 with concurrent features
- **Build Tool**: Vite 7 (fast HMR, optimized production builds)
- **Router**: React Router 7.9.4
- **Styling**: Tailwind CSS 4.1.14 + shadcn/ui components
- **State Management**: Zustand (client) + TanStack Query (server)
- **Testing**: Vitest + React Testing Library

## Project Structure

```
apps/frontend/src/
├── components/          # UI components (consolidated from libs)
│   ├── ui/             # shadcn/ui components
│   ├── layouts/        # Layout components (Sidebar, Header)
│   ├── admin/          # Admin CRUD components
│   │   ├── common/     # ResourceManager, DataTable, PermissionGate
│   │   ├── users/      # User-specific components
│   │   ├── roles/      # Role-specific components
│   │   └── tenants/    # Tenant-specific components
│   └── features/       # Feature-specific components
│
├── pages/              # Route components
│   ├── admin/          # Admin pages (UsersPage, RolesPage)
│   ├── auth/           # Auth pages (Login, Register)
│   └── Dashboard.tsx   # Main dashboard
│
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication state
│   ├── usePermissions.ts  # Permission checking
│   └── useAdminData.ts # TanStack Query hooks for admin API
│
├── config/             # Configuration files
│   └── admin/          # Admin resource configurations
│       ├── users.config.tsx
│       ├── roles.config.tsx
│       ├── permissions.config.tsx
│       └── tenants.config.tsx
│
├── lib/                # Utilities
│   ├── utils.ts        # cn() utility
│   └── admin/          # Admin API client
│       └── admin.api.ts
│
├── routes/             # React Router configuration
│   └── index.tsx       # Route definitions
│
├── stores/             # Zustand stores
│   └── authStore.ts    # Auth state
│
└── main.tsx            # Entry point
```

## Recent Consolidation (2025-10-11)

Frontend libraries were consolidated into `apps/frontend/src/components/` to reduce complexity. Future extraction will be based on proven reuse patterns.

**Before**: `libs/frontend/feature-*`, `libs/frontend/ui-*`
**After**: `apps/frontend/src/components/`

## Key Patterns

### Configuration-Based Admin CRUD

**93% code reduction** using ResourceManager pattern.

**Example** (`config/admin/users.config.tsx`):

```typescript
export const userConfig: ResourceConfig<UserListItem, CreateDto, UpdateDto> = {
  metadata: {
    singular: 'User',
    plural: 'Users',
    icon: Users,
  },
  permissions: {
    create: ['users:create:all', 'users:create:own'],
    read: ['users:read:all', 'users:read:own'],
    update: ['users:update:all', 'users:update:own'],
    delete: ['users:delete:all', 'users:delete:own'],
  },
  hooks: {
    useList: useUsers,
    useCreate: useCreateUser,
    useUpdate: useUpdateUser,
    useDelete: useDeleteUser,
  },
  table: {
    columns: [...],
    defaultSort: { key: 'email', direction: 'asc' },
  },
  form: {
    component: UserForm,
  },
};
```

**Usage** (`pages/admin/UsersPage.tsx`):

```typescript
import { ResourceManager } from '@/components/admin/common/ResourceManager';
import { userConfig } from '@/config/admin/users.config';

export const UsersPage = () => <ResourceManager config={userConfig} />;
```

**See**: [Admin CRUD Architecture](./admin-crud.md)

### TanStack Query for API Calls

```typescript
// hooks/useAdminData.ts
export const useUsers = (filters?: FilterDto) => {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminApi.users.list(filters),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => adminApi.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};
```

### Permission-Based Rendering

```typescript
import { PermissionGate } from '@/components/admin/common/PermissionGate';

<PermissionGate permissions={['users:create:all', 'users:create:own']}>
  <Button onClick={handleCreate}>Create User</Button>
</PermissionGate>
```

### shadcn/ui Components

**Install from project root**:

```bash
bunx shadcn@latest add button card dialog
```

**Usage**:

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

<Card>
  <Button variant="outline" size="sm">Click Me</Button>
</Card>
```

## State Management Strategy

### Server State: TanStack Query

Use for API data (users, roles, tenants):

- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

### Client State: Zustand

Use for UI state (sidebar open, theme):

```typescript
// stores/authStore.ts
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

## Routing

React Router 7 with lazy-loaded routes:

```typescript
// routes/index.tsx
const routes = [
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'admin',
        children: [
          { path: 'users', lazy: () => import('../pages/admin/UsersPage') },
          { path: 'roles', lazy: () => import('../pages/admin/RolesPage') },
        ],
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
];
```

## Development Workflow

```bash
# Start dev server
nx serve frontend  # http://localhost:3000

# Run tests
nx test frontend --watch

# Type check
nx typecheck frontend

# Lint and fix
nx lint frontend --fix
```

## Next Steps

- [Admin CRUD Architecture](./admin-crud.md) - ResourceManager pattern
- [Backend Architecture](./backend.md) - API endpoints
- [Creating Admin Resources](../guides/admin-crud-quick-start.md) - 30-minute guide

---

**Last Updated**: 2025-10-11
**Consolidation Date**: 2025-10-11
