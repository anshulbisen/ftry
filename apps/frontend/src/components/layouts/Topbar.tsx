import { Bell, Search, Menu, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore, useAuthStore } from '@/store';
import { ROUTES } from '@/constants/routes';

export function Topbar() {
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.PUBLIC.LOGIN);
  };

  return (
    <header
      className={cn(
        'fixed top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64',
      )}
      style={{ width: sidebarCollapsed ? 'calc(100% - 4rem)' : 'calc(100% - 16rem)' }}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search - placeholder for future implementation */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-9 w-64 rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Notifications - placeholder */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User menu - simple dropdown using native HTML */}
        <div className="relative group">
          <Button variant="ghost" className="gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline-block">{user?.name || 'User'}</span>
          </Button>

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-48 scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
            <div className="rounded-md border border-border bg-background shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => navigate(ROUTES.APP.SETTINGS_PROFILE)}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={() => navigate(ROUTES.APP.SETTINGS)}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
