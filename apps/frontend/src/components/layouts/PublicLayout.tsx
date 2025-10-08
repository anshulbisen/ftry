import { Outlet } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { DevAuthTools } from '@/components/common/DevAuthTools';

export function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Simple header for public pages */}
      <header className="fixed top-0 z-30 flex h-16 w-full items-center border-b border-border bg-background px-6">
        <div className="flex items-center gap-2">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">FTRY</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex min-h-screen items-center justify-center pt-16">
        <Outlet />
      </main>

      <DevAuthTools />
    </div>
  );
}
