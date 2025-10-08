import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { router } from '@/routes';
import { useUIStore, useAuthStore } from '@/store';
import { authApi } from '@ftry/frontend/auth';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { prefetchCsrfToken } from '@/lib/csrf';

export function App() {
  const { setTheme } = useUIStore();

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('ui-storage');
    if (savedTheme) {
      const { state } = JSON.parse(savedTheme);
      if (state?.theme) {
        setTheme(state.theme);
      }
    }
  }, [setTheme]);

  // Initialize and validate auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Prefetch CSRF token for future requests
      prefetchCsrfToken();

      const { isAuthenticated, setAuth, logout } = useAuthStore.getState();

      // If user appears authenticated, validate the session
      if (isAuthenticated) {
        try {
          // Attempt to fetch current user to validate session
          const user = await authApi.getCurrentUser();
          // Update user data in store (in case it changed)
          setAuth(user);
        } catch {
          // Session is invalid, clear auth state
          console.warn('Session validation failed, clearing auth state');
          logout();
        }
      }
    };

    initializeAuth();
  }, []);

  // Handle multi-tab auth synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if auth storage was cleared (logout in another tab)
      if (e.key === 'auth-storage' && !e.newValue) {
        console.log('Auth cleared in another tab, logging out...');
        useAuthStore.getState().logout();
      }
      // Check if auth storage was updated (login/refresh in another tab)
      else if (e.key === 'auth-storage' && e.newValue && !e.oldValue) {
        console.log('Auth updated in another tab, reloading...');
        window.location.reload(); // Reload to reinitialize with new auth state
      }
    };

    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
