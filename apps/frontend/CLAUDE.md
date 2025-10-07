# Frontend App - CLAUDE.md

This file provides guidance to Claude Code when working with the **frontend application** in this Nx monorepo.

For project-wide guidelines, see the root `/CLAUDE.md`.

---

## App Overview

This is the **frontend application** for the ftry Salon & Spa Management SaaS platform. It provides the customer-facing and admin interfaces for salon owners, staff, and clients.

**Purpose**: Web-based UI for appointment booking, client management, POS, staff scheduling, and business analytics.

**Target Users**:

- Salon owners (admin dashboard)
- Salon staff (scheduling, client lookup)
- Customers (online booking - future)

**Current Status**: Initial setup complete with shadcn/ui component library integrated.

---

## Tech Stack (Frontend-Specific)

- **Framework**: React 19.0.0 (latest stable)
- **Build Tool**: Vite 7.x (fast dev server, optimized builds)
- **UI Components**: shadcn/ui (copy-paste component library)
- **Styling**: Tailwind CSS 4.1.14 with CSS variables
- **Primitives**: Radix UI (accessible, unstyled components)
- **Icons**: Lucide React
- **Routing**: React Router 6.29.0
- **State Management**: (TBD - Context API, Zustand, or Redux Toolkit)
- **Forms**: (TBD - React Hook Form recommended)
- **HTTP Client**: Axios 1.6.0
- **Testing**: Vitest + React Testing Library
- **Type Checking**: TypeScript 5.9.2

---

## File Structure

```
apps/frontend/
├── src/
│   ├── app/                          # React components & application logic
│   │   ├── app.tsx                   # Main app component (routing root)
│   │   ├── app.module.css            # App-level styles (if needed)
│   │   ├── app.spec.tsx              # App tests
│   │   └── nx-welcome.tsx            # Nx welcome screen (can be removed)
│   │
│   ├── components/                   # React components
│   │   └── ui/                       # shadcn/ui components (copy-pasted)
│   │       └── button.tsx            # Example: Button component
│   │
│   ├── lib/                          # Utility functions and helpers
│   │   └── utils.ts                  # cn() function for Tailwind class merging
│   │
│   ├── assets/                       # Static assets (images, fonts, etc.)
│   ├── styles.css                    # Global styles + Tailwind + theme variables
│   └── main.tsx                      # App entry point (renders React app)
│
├── public/                           # Public static files (served as-is)
├── index.html                        # HTML template
├── vite.config.ts                    # Vite configuration
├── vitest.config.ts                  # Vitest test configuration (if separate)
├── tsconfig.json                     # TypeScript configuration (references)
├── tsconfig.app.json                 # App-specific TypeScript config
├── tsconfig.spec.json                # Test-specific TypeScript config
├── project.json                      # Nx project configuration
├── README.md                         # Comprehensive frontend documentation
└── CLAUDE.md                         # This file (Claude Code context)
```

---

## Key Concepts

### Path Aliases

The project uses the `@/` alias for clean imports:

```tsx
// ✅ GOOD - Use @ alias
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ❌ BAD - Avoid relative paths
import { Button } from '../../components/ui/button';
```

**Configuration:**

- `vite.config.ts`: `alias: { '@': path.resolve(__dirname, './src') }`
- `tsconfig.json`: `paths: { "@/*": ["./src/*"] }`

---

### shadcn/ui Components

**What is shadcn/ui?**
shadcn/ui is NOT a traditional npm package. Components are **copied** into your project (`src/components/ui/`), giving you full ownership and customization.

**Adding Components:**

```bash
# IMPORTANT: Run from PROJECT ROOT, not from apps/frontend/
cd /Users/anshulbisen/projects/personal/ftry
bunx shadcn@latest add button card dialog input
```

**Why from root?**

- The `components.json` file is at the project root
- It contains monorepo-aware paths pointing to `apps/frontend/src/`

**Using Components:**

```tsx
import { Button } from '@/components/ui/button';

export function MyFeature() {
  return (
    <div>
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  );
}
```

**Available Button Variants:**

- `default` - Primary button
- `secondary` - Secondary button
- `outline` - Border button
- `destructive` - Danger button
- `ghost` - Minimal button
- `link` - Link-styled button

**Available Sizes:**

- `default` - h-9 (standard)
- `sm` - h-8 (small)
- `lg` - h-10 (large)
- `icon` - h-9 w-9 (square for icons)

**Customizing Components:**

Since components are in your codebase, you can:

1. Edit directly: `src/components/ui/button.tsx`
2. Add variants: Extend the CVA configuration
3. Create wrappers: Build higher-level components

Example:

```tsx
// src/components/loading-button.tsx
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
}

export function LoadingButton({ isLoading, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
```

---

### The `cn()` Utility

The `cn()` function merges Tailwind classes intelligently:

```tsx
import { cn } from '@/lib/utils';

// Conditional classes
<div className={cn('base-class', isActive && 'active-class', isPrimary && 'primary-class')} />;

// Resolves conflicts (last wins)
cn('p-4 text-sm', 'p-8'); // → "p-8 text-sm"

// Component with className prop
interface CardProps {
  className?: string;
}

function Card({ className }: CardProps) {
  return <div className={cn('rounded-lg border p-4', className)} />;
}

// Usage
<Card className="bg-blue-100" />; // Base classes + custom
```

**When to use:**

- Conditional styling based on props/state
- Merging base classes with user-provided className
- Resolving Tailwind class conflicts

---

### Styling with Tailwind CSS v4

**Theme Variables:**

The app uses CSS variables defined in `src/styles.css`:

```css
@theme {
  --color-primary: 0 0% 9%;
  --color-primary-foreground: 0 0% 98%;
  --color-background: 0 0% 100%;
  --color-foreground: 0 0% 3.9%;
  /* ... more variables */
}
```

**Using theme colors:**

```tsx
<div className="bg-primary text-primary-foreground">
  Primary colored div
</div>

<button className="bg-secondary hover:bg-secondary/80">
  Secondary button with hover
</button>
```

**Dark Mode:**

Add `className="dark"` to any parent element to enable dark mode:

```tsx
function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* All children will use dark mode variables */}
      <Button onClick={() => setDarkMode(!darkMode)}>Toggle Dark Mode</Button>
    </div>
  );
}
```

**Customizing the theme:**

1. Edit `src/styles.css`
2. Modify variables in `@theme` block or `.dark` selector
3. Add brand-specific colors:

```css
@theme {
  /* Add your brand colors */
  --color-brand: 280 100% 50%;
  --color-brand-foreground: 0 0% 100%;
}
```

4. Use them:

```tsx
<Button className="bg-[hsl(var(--color-brand))]">Brand Button</Button>
```

---

## Development Guidelines

### Component Organization

```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components (don't edit casually)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── dialog.tsx
│   │
│   ├── features/              # Feature-specific components (create as needed)
│   │   ├── appointments/
│   │   ├── clients/
│   │   └── billing/
│   │
│   └── shared/                # Shared/common components
│       ├── layout/
│       ├── navigation/
│       └── forms/
```

**Guidelines:**

- **ui/**: shadcn/ui components - modify carefully, changes affect all usage
- **features/**: Feature-specific components - organize by feature domain
- **shared/**: Reusable components used across multiple features

### Naming Conventions

**Components:**

- PascalCase: `AppointmentCard.tsx`, `ClientList.tsx`
- One component per file
- File name matches component name

**Utilities:**

- camelCase: `formatDate.ts`, `validateEmail.ts`

**Types:**

- PascalCase: `type User = { ... }`
- Use `interface` for objects, `type` for unions/intersections

**Example:**

```tsx
// src/components/features/appointments/AppointmentCard.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date-utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: () => void;
}

export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  return (
    <Card>
      <h3>{appointment.serviceName}</h3>
      <p>{formatDateTime(appointment.dateTime)}</p>
      {onCancel && (
        <Button variant="destructive" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </Card>
  );
}
```

---

### TypeScript Best Practices

1. **Always type component props:**

```tsx
// ✅ GOOD
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ BAD
function Button({ label, onClick, disabled }) {
  // No types!
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

2. **Use type imports:**

```tsx
import { type ButtonProps } from '@/components/ui/button';
import { type VariantProps } from 'class-variance-authority';
```

3. **Avoid `any`:**

```tsx
// ❌ BAD
function processData(data: any) { ... }

// ✅ GOOD
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}

// ✅ BETTER - Use proper types
interface UserData {
  id: string;
  name: string;
}

function processData(data: UserData) { ... }
```

---

### React Best Practices

1. **Keep components small and focused:**
   - One responsibility per component
   - Extract logic into hooks
   - Compose complex UIs from simple components

2. **Use custom hooks for logic:**

```tsx
// src/hooks/useAppointments.ts
export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch appointments
  }, []);

  return { appointments, loading };
}

// Usage
function AppointmentList() {
  const { appointments, loading } = useAppointments();

  if (loading) return <div>Loading...</div>;

  return <div>{/* Render appointments */}</div>;
}
```

3. **Memoize expensive computations:**

```tsx
const sortedAppointments = useMemo(
  () => appointments.sort((a, b) => a.date - b.date),
  [appointments]
);
```

4. **Use `React.memo()` for expensive renders (sparingly):**

```tsx
export const AppointmentCard = React.memo(function AppointmentCard({ appointment }) {
  // Component will only re-render if appointment changes
  return <Card>...</Card>;
});
```

---

## Testing

### Test Files Location

- Component tests: Next to the component file
  - `AppointmentCard.tsx`
  - `AppointmentCard.test.tsx` or `AppointmentCard.spec.tsx`

- Integration tests: `tests/` directory

### Running Tests

```bash
# Run tests for frontend only
nx test frontend

# Run tests in watch mode
nx test frontend --watch

# Run tests with coverage
nx test frontend --coverage

# Run specific test file
nx test frontend --testFile=AppointmentCard.test.tsx
```

### Writing Tests

**Example component test:**

```tsx
// src/components/features/appointments/AppointmentCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentCard } from './AppointmentCard';

describe('AppointmentCard', () => {
  it('renders appointment details', () => {
    const appointment = {
      id: '1',
      serviceName: 'Haircut',
      dateTime: new Date('2025-10-10T10:00:00'),
    };

    render(<AppointmentCard appointment={appointment} />);

    expect(screen.getByText('Haircut')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const handleCancel = vi.fn();
    const appointment = {
      /* ... */
    };

    render(<AppointmentCard appointment={appointment} onCancel={handleCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(handleCancel).toHaveBeenCalledOnce();
  });
});
```

**Testing guidelines:**

- Test user behavior, not implementation details
- Use `screen.getByRole()` and `screen.getByText()` over `getByTestId()`
- Mock external dependencies (API calls, etc.)
- Aim for high coverage on business-critical components

---

## Development Commands

```bash
# Start dev server (from project root)
nx serve frontend
# → http://localhost:3000

# Build for production
nx build frontend
# → Output: dist/apps/frontend/

# Run tests
nx test frontend

# Run linting
nx lint frontend

# Fix linting issues
nx lint frontend --fix

# Type check
nx typecheck frontend

# Run all quality checks
bun run check-all
```

---

## Common Tasks

### Adding a New Feature Component

1. Create component file:

```bash
mkdir -p src/components/features/appointments
touch src/components/features/appointments/AppointmentList.tsx
```

2. Create the component:

```tsx
// src/components/features/appointments/AppointmentList.tsx
import { Card } from '@/components/ui/card';

interface AppointmentListProps {
  appointments: Appointment[];
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <Card key={apt.id}>{apt.serviceName}</Card>
      ))}
    </div>
  );
}
```

3. Add tests:

```bash
touch src/components/features/appointments/AppointmentList.test.tsx
```

4. Use in your app:

```tsx
import { AppointmentList } from '@/components/features/appointments/AppointmentList';
```

---

### Adding a shadcn/ui Component

1. Browse available components: https://ui.shadcn.com/docs/components

2. Add from PROJECT ROOT:

```bash
cd /Users/anshulbisen/projects/personal/ftry
bunx shadcn@latest add card
```

3. Component is added to `src/components/ui/card.tsx`

4. Use it:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content here</p>
  </CardContent>
</Card>;
```

---

### Adding Icons

Use Lucide React: https://lucide.dev/icons

```bash
# Icons are already installed (lucide-react)
```

```tsx
import { Calendar, Clock, User, Settings } from 'lucide-react';

<Button>
  <Calendar /> Schedule Appointment
</Button>

<div className="flex items-center gap-2">
  <Clock className="h-4 w-4" />
  <span>10:00 AM</span>
</div>
```

---

## State Management (Future)

**Current**: Local state with `useState`

**Recommended for future:**

- **Zustand**: Lightweight, simple, great for small to medium apps
- **Context API**: Built-in, good for theme, auth, user data
- **Redux Toolkit**: If complex state management needed

**Example with Zustand (when added):**

```tsx
// src/stores/useAppointmentStore.ts
import { create } from 'zustand';

interface AppointmentStore {
  appointments: Appointment[];
  addAppointment: (apt: Appointment) => void;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  appointments: [],
  addAppointment: (apt) =>
    set((state) => ({
      appointments: [...state.appointments, apt],
    })),
}));

// Usage
function AppointmentList() {
  const appointments = useAppointmentStore((state) => state.appointments);
  return <div>{/* render appointments */}</div>;
}
```

---

## API Integration (Future)

**HTTP Client**: Axios is installed

**Recommended structure:**

```
src/
├── api/
│   ├── client.ts            # Axios instance with base config
│   ├── appointments.ts      # Appointment API calls
│   ├── clients.ts           # Client API calls
│   └── billing.ts           # Billing API calls
```

**Example:**

```tsx
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  headers: {
    'Content-Type': 'application/json',
  },
});

// src/api/appointments.ts
import { apiClient } from './client';

export async function getAppointments() {
  const { data } = await apiClient.get('/appointments');
  return data;
}

export async function createAppointment(appointment: CreateAppointmentDto) {
  const { data } = await apiClient.post('/appointments', appointment);
  return data;
}

// Usage in component
function AppointmentList() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    getAppointments().then(setAppointments);
  }, []);

  return <div>{/* render */}</div>;
}
```

---

## Environment Variables

**Vite env variables** must be prefixed with `VITE_`:

```bash
# .env.local (create this file)
VITE_API_URL=http://localhost:3333
VITE_APP_NAME=ftry
```

```tsx
// Usage in code
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;

// TypeScript types (create if needed)
// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Performance Best Practices

1. **Code Splitting:**
   - Use `React.lazy()` for route-based splitting
   - Vite handles dynamic imports automatically

```tsx
const AppointmentPage = React.lazy(() => import('./pages/AppointmentPage'));

<Suspense fallback={<LoadingSpinner />}>
  <AppointmentPage />
</Suspense>;
```

2. **Image Optimization:**
   - Use WebP format
   - Lazy load images below the fold
   - Use appropriate sizes

3. **Bundle Size:**
   - Check build output: `nx build frontend`
   - Avoid importing entire libraries (use named imports)
   - Tree-shaking is automatic with Vite

---

## Troubleshooting

### Import path errors

**Problem:** `Cannot find module '@/components/ui/button'`

**Solution:**

1. Check `vite.config.ts` has alias configured
2. Check `tsconfig.json` has paths configured
3. Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")

### Component not found after `shadcn add`

**Problem:** Component wasn't added

**Solution:**

- Ensure you ran command from project root (not `apps/frontend/`)
- Check `components.json` exists at project root
- Verify paths in `components.json` point to `apps/frontend/src/`

### Tailwind classes not working

**Problem:** Classes not applying styles

**Solution:**

1. Check `src/styles.css` is imported in `main.tsx`
2. Verify Tailwind plugin in `vite.config.ts`
3. Check theme variables are defined in `src/styles.css`
4. Restart dev server

### Build fails with CSS errors

**Problem:** Tailwind v4 syntax errors

**Solution:**

- Ensure `@theme` block only contains CSS variables
- `.dark` selector must be OUTSIDE `@theme` block
- Use `@import 'tailwindcss'` syntax (not `@tailwind` directives)

---

## Resources & Links

**Project Documentation:**

- Root CLAUDE.md: `/CLAUDE.md` (project-wide guidelines)
- Frontend README: `./README.md` (detailed usage guide)
- Nx Architecture: `/.nx/NX_ARCHITECTURE.md`

**External Documentation:**

- [React 19 Docs](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Lucide Icons](https://lucide.dev/icons)
- [Vitest](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)

---

## Quick Reference

**Add shadcn component:**

```bash
cd /Users/anshulbisen/projects/personal/ftry
bunx shadcn@latest add button card dialog
```

**Import component:**

```tsx
import { Button } from '@/components/ui/button';
```

**Use cn() utility:**

```tsx
import { cn } from '@/lib/utils';
className={cn("base", condition && "extra")}
```

**Add Lucide icon:**

```tsx
import { Calendar } from 'lucide-react';
<Calendar className="h-4 w-4" />;
```

**Create feature component:**

```tsx
// src/components/features/[domain]/[ComponentName].tsx
interface ComponentNameProps { ... }
export function ComponentName(props: ComponentNameProps) { ... }
```

**Run dev server:**

```bash
nx serve frontend
```

---

## For Claude Code Agents

When working in this frontend app:

1. **Always use `@/` imports** for src files
2. **Add shadcn components from PROJECT ROOT** (not this directory)
3. **Use `cn()` for conditional Tailwind classes**
4. **Follow TypeScript best practices** - always type props and exports
5. **Keep components small** - extract logic into hooks
6. **Write tests** for new components
7. **Check README.md** for detailed examples and troubleshooting
8. **Use Lucide icons** instead of other icon libraries
9. **Follow Nx conventions** - this is an application, not a library
10. **Run quality checks** before committing: `bun run check-all`

**Key directories:**

- `src/components/ui/` - shadcn/ui components (modify carefully)
- `src/components/features/` - feature-specific components (create as needed)
- `src/lib/` - utility functions
- `src/api/` - API integration (future)

**Development workflow:**

1. Create component with TypeScript types
2. Write tests
3. Run `nx test frontend`
4. Use component in app
5. Run `bun run check-all` before committing

This app is part of an Nx monorepo. See root `/CLAUDE.md` for monorepo-wide conventions.
