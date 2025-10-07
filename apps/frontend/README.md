# Frontend App - React 19 + Vite + shadcn/ui

This is the frontend application for the ftry Salon & Spa Management SaaS platform, built with React 19, Vite, and shadcn/ui component library.

## Tech Stack

- **React**: 19.0.0 (latest stable)
- **Vite**: 7.x (build tool and dev server)
- **Tailwind CSS**: 4.1.14 (utility-first CSS framework)
- **shadcn/ui**: Component library built on Radix UI
- **TypeScript**: 5.9.2
- **Testing**: Vitest

## shadcn/ui Setup

### Overview

This app uses **shadcn/ui** - a collection of re-usable components built with Radix UI and Tailwind CSS. Unlike traditional component libraries, shadcn/ui components are copied directly into your project, giving you full control and ownership.

### Configuration

The project is configured for shadcn/ui in an **Nx monorepo context**:

- **`/components.json`** (root) - shadcn configuration with monorepo paths
- **`/tsconfig.json`** (root) - Minimal tsconfig for shadcn CLI compatibility
- **`apps/frontend/src/lib/utils.ts`** - `cn()` utility for merging class names
- **`apps/frontend/src/styles.css`** - Tailwind CSS with theme variables

### Path Aliases

Components use the `@/` alias which resolves to `apps/frontend/src/`:

```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

Configured in:

- `apps/frontend/vite.config.ts` - Vite path resolution
- `apps/frontend/tsconfig.json` - TypeScript path mapping

### Adding Components

Use the shadcn CLI from the **project root**:

```bash
# Add a single component
bunx shadcn@latest add button

# Add multiple components
bunx shadcn@latest add button card dialog

# List available components
bunx shadcn@latest add
```

**Important**: Always run from the project root, not from `apps/frontend/`. The CLI uses the root `components.json` which contains monorepo-aware paths.

### Using Components

Components are added to `apps/frontend/src/components/ui/` and can be imported directly:

```tsx
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return (
    <div>
      <Button>Click me</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  );
}
```

### Available Variants & Sizes

The Button component includes:

**Variants:**

- `default` - Primary button with shadow
- `secondary` - Secondary styling
- `outline` - Border with transparent background
- `destructive` - For delete/dangerous actions
- `ghost` - Minimal hover effect
- `link` - Link-styled button

**Sizes:**

- `default` - Standard height (h-9)
- `sm` - Small (h-8)
- `lg` - Large (h-10)
- `icon` - Square for icon-only buttons (h-9 w-9)

### Customizing Components

Since components live in your codebase, you can:

1. **Modify directly** - Edit files in `src/components/ui/`
2. **Extend variants** - Add new variants to the CVA configuration
3. **Compose** - Create higher-level components using base components

Example of extending Button:

```tsx
// src/components/custom-button.tsx
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

### Theme & Styling

The app uses Tailwind CSS v4 with CSS variables for theming:

**Light Mode** (default):

- Background: white
- Foreground: near-black
- Primary: dark neutral

**Dark Mode**:

- Add `class="dark"` to any parent element
- Variables automatically switch to dark mode values

Theme variables are defined in `apps/frontend/src/styles.css` and can be customized:

```css
@theme {
  --color-primary: 0 0% 9%;
  --color-primary-foreground: 0 0% 98%;
  /* ... more variables ... */
}
```

### React 19 Compatibility

This setup is fully compatible with React 19. All shadcn/ui dependencies support React 19:

- ✅ `@radix-ui/react-*` - React 19 support added
- ✅ `lucide-react` - Compatible with React 19
- ✅ `class-variance-authority` - No React peer dependency
- ✅ `tailwind-merge` - No React peer dependency

### Icon Library

We use **Lucide React** for icons:

```tsx
import { Check, X, ChevronRight } from 'lucide-react';

<Button>
  <Check /> Success
</Button>;
```

Browse icons at: https://lucide.dev/icons

### Utility Function: `cn()`

The `cn()` utility merges Tailwind classes intelligently:

```tsx
import { cn } from '@/lib/utils';

// Handles conditional classes
<div className={cn('base-class', isActive && 'active-class', 'override-class')} />;

// Resolves conflicts (last wins)
cn('p-4', 'p-8'); // → "p-8"
```

Built with:

- `clsx` - Conditional class names
- `tailwind-merge` - Deduplicates and resolves conflicts

## Development Commands

```bash
# Start dev server (from project root)
nx serve frontend

# Build for production
nx build frontend

# Run tests
nx test frontend

# Run linting
nx lint frontend

# Type check
nx typecheck frontend

# Run all quality checks
bun run check-all
```

## File Structure

```
apps/frontend/
├── src/
│   ├── app/                    # React components & routes
│   │   ├── app.tsx             # Main app component
│   │   └── ...
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   │       └── button.tsx
│   ├── lib/
│   │   └── utils.ts            # cn() utility
│   ├── main.tsx                # App entry point
│   └── styles.css              # Tailwind CSS with theme
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config (references)
├── tsconfig.app.json           # App-specific TypeScript config
└── project.json                # Nx project configuration
```

## Nx Integration

This app is part of an Nx monorepo. Key points:

- **Non-buildable library**: This is an application, not a library
- **Affected commands**: Nx only rebuilds/tests what changed
- **Build caching**: Nx caches build outputs for speed
- **Shared dependencies**: Uses workspace-level dependencies

See the main `CLAUDE.md` and `.nx/NX_ARCHITECTURE.md` for more on Nx patterns.

## Best Practices

### Component Organization

1. **UI components** → `src/components/ui/` (from shadcn)
2. **Feature components** → `src/app/` or create feature libraries
3. **Shared components** → Consider extracting to `libs/shared/ui-*`

### Styling Guidelines

1. Use Tailwind utility classes for styling
2. Use the `cn()` utility for conditional classes
3. Extend theme variables in `styles.css` for brand colors
4. Avoid inline styles; prefer Tailwind utilities

### Type Safety

1. Always use TypeScript
2. Leverage component prop types (e.g., `ButtonProps`)
3. Use `type` imports for types: `import { type ButtonProps }`

### Performance

1. Use `React.lazy()` for code splitting
2. Leverage Vite's automatic code splitting
3. Keep components small and focused
4. Use `React.memo()` judiciously

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [React 19 Docs](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## Troubleshooting

### Import path errors

If you see errors like `Cannot find module '@/components/ui/button'`:

1. Check `vite.config.ts` has the `@` alias configured
2. Check `tsconfig.json` has the `@/*` path mapping
3. Restart your IDE's TypeScript server

### Component not found after adding

1. Verify the component was added to `apps/frontend/src/components/ui/`
2. Check that the import path uses `@/` alias
3. Check for TypeScript errors in the component file

### Tailwind classes not working

1. Ensure `styles.css` is imported in `main.tsx`
2. Check that Tailwind plugin is in `vite.config.ts`
3. Verify theme variables are defined in `styles.css`

### Monorepo-specific issues

If shadcn CLI fails:

1. Always run from project root (not `apps/frontend/`)
2. Ensure `components.json` exists at project root
3. Check that paths in `components.json` point to `apps/frontend/src/...`
