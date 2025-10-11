/**
 * ThemeSwitcher Component
 *
 * Provides a dropdown menu to switch between light, dark, and system themes.
 * Theme preference is persisted via Zustand store and localStorage.
 */

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

interface ThemeSwitcherProps {
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
}

export function ThemeSwitcher({ collapsed = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useUIStore();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5 shrink-0" />;
      case 'dark':
        return <Moon className="h-5 w-5 shrink-0" />;
      case 'system':
        return <Monitor className="h-5 w-5 shrink-0" />;
      default:
        return <Monitor className="h-5 w-5 shrink-0" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('w-full', collapsed ? 'justify-center px-2' : 'justify-start')}
          aria-label="Toggle theme"
        >
          {getThemeIcon()}
          {!collapsed && <span className="ml-3">Theme</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-40 mb-2">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
        >
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
