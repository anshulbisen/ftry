# Frontend App - Claude Context

Quick reference for working in the frontend React app. See `README.md` for detailed documentation.

## Key Commands

```bash
# From project root
nx serve frontend              # Start dev server (localhost:3000)
nx build frontend              # Production build
nx test frontend               # Run tests
nx test frontend --watch       # Watch mode
nx lint frontend --fix         # Lint and fix
nx typecheck frontend          # Type check

# Add shadcn component (MUST run from project root, not this directory)
bunx shadcn@latest add button card dialog input
```

## Tech Stack

- **React 19.0.0** + **Vite 7** + **TypeScript 5.9.2**
- **UI**: shadcn/ui (copy-paste components, not npm package)
- **Styling**: Tailwind CSS 4.1.14 with CSS variables
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Path Aliases

Use `@/` for imports (configured in vite.config.ts + tsconfig.json):

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

## shadcn/ui Components

**IMPORTANT**: Always run shadcn CLI from **project root**, NOT from `apps/frontend/`:

```bash
# ✅ Correct
cd /Users/anshulbisen/projects/personal/ftry
bunx shadcn@latest add button

# ❌ Wrong
cd apps/frontend && bunx shadcn@latest add button
```

Components are copied to `src/components/ui/` and can be edited directly.

## File Organization

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (modify carefully)
│   ├── features/              # Feature components (create as needed)
│   └── shared/                # Shared components
├── lib/                       # Utils (cn() function, etc.)
├── api/                       # API integration (future)
└── hooks/                     # Custom React hooks
```

## Code Style

- **Components**: PascalCase, one per file (`AppointmentCard.tsx`)
- **Utils**: camelCase (`formatDate.ts`)
- **Always type props**: Use `interface ComponentProps { ... }`
- **Use type imports**: `import { type ButtonProps } from '@/components/ui/button'`
- **Avoid `any`**: Use proper types or `unknown`

## Common Patterns

**Conditional styling with cn():**

```tsx
import { cn } from '@/lib/utils';

<div className={cn('base-class', isActive && 'active-class')} />;
```

**Component with variants (shadcn pattern):**

```tsx
import { Button } from '@/components/ui/button';

<Button variant="outline" size="sm">
  Click
</Button>;
```

**Icons:**

```tsx
import { Calendar, Clock } from 'lucide-react';

<Button>
  <Calendar className="h-4 w-4" /> Schedule
</Button>;
```

## Testing

- Write tests next to components: `Button.tsx` + `Button.test.tsx`
- Test user behavior, not implementation
- Use `screen.getByRole()` over `getByTestId()`

## Workflow

- **Before committing**: Run `bun run check-all` (from root)
- **Path alias**: Always use `@/` imports, not relative paths
- **shadcn components**: Add from root, use `@/` imports
- **Tailwind theme**: Modify `src/styles.css` for brand colors
- **Keep components small**: Extract logic to hooks

## Troubleshooting

**Import errors (`Cannot find module '@/...'`)**:
→ Restart TS server (VS Code: Cmd+Shift+P → "Restart TS Server")

**shadcn component not added**:
→ Ensure running from project root, not `apps/frontend/`

**Tailwind classes not working**:
→ Check `src/styles.css` is imported in `main.tsx`

## Resources

- Detailed docs: `./README.md`
- Root guidelines: `/CLAUDE.md`
- shadcn components: https://ui.shadcn.com
- Lucide icons: https://lucide.dev
