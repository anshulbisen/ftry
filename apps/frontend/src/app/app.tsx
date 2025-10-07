import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { router } from '@/routes';
import { useUIStore } from '@/store';
import { DevAuthTools } from '@/components/common/DevAuthTools';

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

  return (
    <>
      <RouterProvider router={router} />
      {/* DevAuthTools only in browser, not in tests */}
      {typeof window !== 'undefined' && !import.meta.env.TEST && <DevAuthTools />}
    </>
  );
}

export default App;
