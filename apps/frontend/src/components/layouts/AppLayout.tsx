import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DevAuthTools } from '@/components/common/DevAuthTools';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar />
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64')}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      <DevAuthTools />
    </div>
  );
}
