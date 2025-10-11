import { useEffect } from 'react';
import { useUIStore } from '@/store';

/**
 * Custom hook to apply theme changes to the DOM
 *
 * Separates theme side effects from Zustand store for better React practices:
 * - DOM manipulation happens in React lifecycle (useEffect)
 * - Store remains pure state management
 * - System theme preference changes are automatically detected
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useThemeEffect(); // Call once at root level
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useThemeEffect(): void {
  const { theme } = useUIStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const applySystemTheme = () => {
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      };

      // Apply initial system theme
      applySystemTheme();

      // Listen for system theme changes
      mediaQuery.addEventListener('change', applySystemTheme);

      // Cleanup listener on unmount or theme change
      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    }

    // Apply explicit light/dark theme
    root.classList.add(theme);
  }, [theme]);
}
