import { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks';

/**
 * Development tool to quickly test authentication
 * Remove or disable in production
 */
export function DevAuthTools() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();

  // Only show in development
  if (import.meta.env.PROD) return null;

  const handleQuickLogin = async () => {
    await login('dev@ftry.com', 'dev123');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-110"
        title="Dev Auth Tools"
      >
        <Bug className="h-5 w-5" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">🔧 Dev Auth Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Auth Status */}
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="mb-1 font-medium">Status</p>
              <p className="text-muted-foreground">
                {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}
              </p>
              {user && (
                <div className="mt-2 space-y-1 text-xs">
                  <p>Name: {user.name}</p>
                  <p>Email: {user.email}</p>
                  <p>Role: {user.role}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              {!isAuthenticated ? (
                <Button onClick={handleQuickLogin} size="sm" className="w-full">
                  Quick Login
                </Button>
              ) : (
                <Button onClick={logout} size="sm" variant="destructive" className="w-full">
                  Logout
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              This panel is only visible in development mode
            </p>
          </div>
        </div>
      )}
    </>
  );
}
