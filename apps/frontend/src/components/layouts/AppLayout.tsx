import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/store';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="relative min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar isMobile={isMobile} />

      {/* Mobile header with menu button */}
      {isMobile && (
        <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center border-b border-border bg-background px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="mr-2"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">FTRY</h1>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          isMobile ? 'ml-0 pt-16' : sidebarCollapsed ? 'ml-16' : 'ml-64',
        )}
      >
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
