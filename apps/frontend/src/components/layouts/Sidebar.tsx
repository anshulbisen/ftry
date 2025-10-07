import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  UserCircle,
  Scissors,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store';
import { ROUTES } from '@/constants/routes';
import { type NavItem } from '@/types';

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: ROUTES.APP.DASHBOARD,
    icon: BarChart3,
  },
  {
    title: 'Appointments',
    href: ROUTES.APP.APPOINTMENTS,
    icon: Calendar,
  },
  {
    title: 'Clients',
    href: ROUTES.APP.CLIENTS,
    icon: Users,
  },
  {
    title: 'Staff',
    href: ROUTES.APP.STAFF,
    icon: UserCircle,
  },
  {
    title: 'Services',
    href: ROUTES.APP.SERVICES,
    icon: Scissors,
  },
  {
    title: 'Billing',
    href: ROUTES.APP.BILLING,
    icon: Receipt,
  },
  {
    title: 'Reports',
    href: ROUTES.APP.REPORTS,
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: ROUTES.APP.SETTINGS,
    icon: Settings,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">FTRY</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapsed}
          className={cn('h-8 w-8', sidebarCollapsed && 'mx-auto')}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                sidebarCollapsed && 'justify-center',
              )}
              title={sidebarCollapsed ? item.title : undefined}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              {!sidebarCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
