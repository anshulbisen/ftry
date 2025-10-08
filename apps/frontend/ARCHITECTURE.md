# Frontend Architecture Guide

This document describes the architecture and organization of the FTRY frontend application.

## Tech Stack

- **React 19** - UI library
- **React Router v6** - Routing and navigation
- **Zustand** - State management
- **shadcn/ui** - Component library
- **Tailwind CSS v4** - Styling
- **TypeScript** - Type safety
- **Vite** - Build tool

## Folder Structure

```
src/
├── app/                    # Main App component
├── components/
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   ├── layouts/            # Layout components (Sidebar, Topbar, AppLayout)
│   ├── features/           # Feature-specific components (to be added)
│   └── common/             # Shared/reusable components
├── pages/
│   ├── public/             # Public pages (Login, Register, etc.)
│   └── app/                # Authenticated pages (Dashboard, Appointments, etc.)
├── routes/                 # Routing configuration and guards
├── store/                  # Zustand stores
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
├── constants/              # App constants (routes, config)
└── api/                    # API client (future)
```

## Core Concepts

### 1. Routing

The app uses React Router v6 with a centralized router configuration in `src/routes/index.tsx`.

**Route Types:**

- **Public routes**: Wrapped in `PublicLayout` (Login, Register, Landing)
- **Protected routes**: Wrapped in `AppLayout` with `ProtectedRoute` guard

**Route Guards:**

- `ProtectedRoute`: Redirects unauthenticated users to login
- `PublicRoute`: Redirects authenticated users to dashboard

**Usage:**

```typescript
import { ROUTES } from '@/constants/routes';
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(ROUTES.APP.DASHBOARD);
```

### 2. State Management

The app uses Zustand for state management with multiple stores:

**Auth Store** (`store/auth.store.ts`):

- User authentication state
- Login/logout actions
- Persisted to localStorage

**UI Store** (`store/ui.store.ts`):

- Sidebar state (open/collapsed)
- Theme preferences (light/dark/system)
- Persisted to localStorage

**Usage:**

```typescript
import { useAuthStore, useUIStore } from '@/store';

// In component
const { user, isAuthenticated, logout } = useAuthStore();
const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
```

### 3. Layouts

**AppLayout** (`components/layouts/AppLayout.tsx`):

- Main layout for authenticated pages
- Includes Sidebar + Topbar
- Uses React Router's `<Outlet />` for nested routes

**PublicLayout** (`components/layouts/PublicLayout.tsx`):

- Simple layout for public pages
- Minimal header with logo

**Sidebar** (`components/layouts/Sidebar.tsx`):

- Collapsible navigation menu
- Active route highlighting
- Icons from lucide-react

**Topbar** (`components/layouts/Topbar.tsx`):

- Search bar (placeholder)
- Notifications (placeholder)
- User menu with dropdown

### 4. Custom Hooks

**useAuth** (`hooks/useAuth.ts`):

- Convenient access to authentication
- Login, logout, register functions
- Currently uses mock data (replace with API calls)

**Usage:**

```typescript
import { useAuth } from '@/hooks';

const { user, isAuthenticated, login, logout } = useAuth();
```

### 5. TypeScript Types

All common types are defined in `types/index.ts`:

- User, AuthState
- UIState
- NavItem, Breadcrumb
- Appointment, Client, Staff, Service (placeholders)

### 6. Constants

**Route Constants** (`constants/routes.ts`):

- Centralized route definitions
- Type-safe navigation
- Helper function for dynamic routes

## Adding New Features

### Creating a New Page

1. Create page component in `src/pages/app/` or `src/pages/public/`
2. Add route constant to `src/constants/routes.ts`
3. Add route to `src/routes/index.tsx`
4. Update sidebar navigation in `src/components/layouts/Sidebar.tsx` (if needed)

Example:

```typescript
// 1. Create page
// src/pages/app/InventoryPage.tsx
export function InventoryPage() {
  return <div>Inventory Management</div>;
}

// 2. Add route constant
// src/constants/routes.ts
INVENTORY: '/app/inventory',

// 3. Add route
// src/routes/index.tsx
{
  path: ROUTES.APP.INVENTORY,
  element: <InventoryPage />,
}

// 4. Add to sidebar
// src/components/layouts/Sidebar.tsx
{
  title: 'Inventory',
  href: ROUTES.APP.INVENTORY,
  icon: Package,
}
```

### Creating a New Store

1. Create store file in `src/store/`
2. Export from `src/store/index.ts`

Example:

```typescript
// src/store/appointments.store.ts
import { create } from 'zustand';

interface AppointmentsStore {
  appointments: Appointment[];
  fetchAppointments: () => Promise<void>;
}

export const useAppointmentsStore = create<AppointmentsStore>((set) => ({
  appointments: [],
  fetchAppointments: async () => {
    // API call here
    set({ appointments: [] });
  },
}));

// src/store/index.ts
export { useAppointmentsStore } from './appointments.store';
```

### Adding shadcn/ui Components

Always run from project root:

```bash
bunx shadcn@latest add dialog card input
```

Components are added to `src/components/ui/` and can be customized.

## Styling Guidelines

- Use Tailwind utility classes
- Theme colors via CSS variables in `src/styles.css`
- Use `cn()` helper for conditional classes:

  ```typescript
  import { cn } from '@/lib/utils';

  <div className={cn('base-class', isActive && 'active-class')} />
  ```

## Best Practices

1. **Component Organization**:
   - Keep components small and focused
   - Use composition over complex props
   - Extract reusable logic to custom hooks

2. **State Management**:
   - Use Zustand for global state
   - Use React state for local component state
   - Persist important state to localStorage

3. **Routing**:
   - Always use route constants from `ROUTES`
   - Use `useNavigate()` for programmatic navigation
   - Keep route logic in route guards

4. **TypeScript**:
   - Define interfaces for all component props
   - Use `type` for unions, `interface` for objects
   - Export types from `types/index.ts`

5. **Performance**:
   - Use React.lazy() for code splitting (future)
   - Memoize expensive computations with useMemo
   - Use React.memo for expensive components

## Next Steps

1. **Authentication**: Replace mock auth with real API calls
2. **API Integration**: Set up API client in `src/api/`
3. **Forms**: Add react-hook-form for form management
4. **Data Fetching**: Consider React Query for server state
5. **Error Handling**: Add error boundaries and toast notifications
6. **Loading States**: Add loading skeletons and spinners
7. **Responsive Design**: Ensure mobile responsiveness
8. **E2E Testing**: Set up Playwright or Cypress

## Development Workflow

```bash
# Start dev server
nx serve frontend

# Run tests
nx test frontend

# Type check
nx run frontend:typecheck

# Lint
nx lint frontend --fix

# Build
nx build frontend

# Run all quality checks
bun run check-all
```

## Resources

- [React Router Documentation](https://reactrouter.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
