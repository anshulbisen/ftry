import { memo, useMemo, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  LogOut,
  Bell,
  User,
  Shield,
  UserCog,
  Building,
  Key,
  Sun,
  Moon,
  Monitor,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { useUIStore, useAuthStore } from '@/store';
import { ROUTES } from '@/constants/routes';
import { type NavItem } from '@/types';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarSection } from './SidebarSection';

const getNavigationItems = (hasAdminAccess: boolean): NavItem[] => {
  const baseItems: NavItem[] = [
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
  ];

  // Add admin section for users with admin permissions
  if (hasAdminAccess) {
    baseItems.push({
      title: 'Admin',
      href: '',
      icon: Shield,
      isSection: true,
      children: [
        {
          title: 'Users',
          href: ROUTES.APP.ADMIN_USERS,
          icon: UserCog,
        },
        {
          title: 'Tenants',
          href: ROUTES.APP.ADMIN_TENANTS,
          icon: Building,
        },
        {
          title: 'Roles',
          href: ROUTES.APP.ADMIN_ROLES,
          icon: Shield,
        },
        {
          title: 'Permissions',
          href: ROUTES.APP.ADMIN_PERMISSIONS,
          icon: Key,
        },
      ],
    });
  }

  baseItems.push({
    title: 'Settings',
    href: ROUTES.APP.SETTINGS,
    icon: Settings,
  });

  return baseItems;
};

interface SidebarProps {
  isMobile?: boolean;
}

export const Sidebar = memo<SidebarProps>(({ isMobile = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, sidebarOpen, toggleSidebarCollapsed, setSidebarOpen, theme, setTheme } =
    useUIStore();
  const { user, logout, hasAnyPermission } = useAuthStore();

  // State for collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Memoize navigation items based on user permissions
  const navigationItems = useMemo(() => {
    // Check if user has any admin permissions
    const hasAdminAccess = hasAnyPermission([
      'users:read:all',
      'users:read:own',
      'tenants:read:all',
      'tenants:read:own',
      'roles:read:all',
      'roles:read:own',
      'permissions:read',
    ]);

    const items = getNavigationItems(hasAdminAccess);
    return items;
  }, [hasAnyPermission, user]);

  // Toggle section collapse
  const toggleSection = useCallback((sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  }, []);

  // Memoize isActive check
  const isActive = useCallback(
    (href: string) => {
      if (!href) return false; // Skip section headers
      return location.pathname === href || location.pathname.startsWith(href + '/');
    },
    [location.pathname],
  );

  // Memoize logout handler
  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.PUBLIC.LOGIN);
  }, [logout, navigate]);

  // Memoize nav click handler
  const handleNavClick = useCallback(() => {
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-background transition-all duration-300',
        isMobile
          ? // Mobile: drawer behavior
            sidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full'
          : // Desktop: collapse behavior
            sidebarCollapsed
            ? 'w-16'
            : 'w-64',
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {(!sidebarCollapsed || isMobile) && (
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">FTRY</span>
          </div>
        )}
        {/* Only show collapse button on desktop */}
        {!isMobile && (
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
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navigationItems.map((item, index) => {
          const active = isActive(item.href);

          // Render section header with collapsible children
          if (item.isSection && item.children) {
            const isSectionCollapsed = collapsedSections[item.title] ?? false;
            const hasActiveChild = item.children.some((child) => isActive(child.href));

            return (
              <div key={`section-${index}`} className="space-y-1">
                {/* Section Header - Clickable */}
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-between px-3 py-2 text-sm font-semibold',
                    sidebarCollapsed && 'justify-center',
                    hasActiveChild && 'bg-accent/50',
                  )}
                  onClick={() => toggleSection(item.title)}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
                    {!sidebarCollapsed && (
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {item.title}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        isSectionCollapsed && '-rotate-90',
                      )}
                    />
                  )}
                </Button>

                {/* Section Children - Collapsible */}
                {!sidebarCollapsed && !isSectionCollapsed && (
                  <div className="ml-2 space-y-1 border-l border-border pl-2">
                    {item.children.map((child) => (
                      <SidebarNavItem
                        key={child.href}
                        title={child.title}
                        href={child.href}
                        icon={child.icon as LucideIcon | undefined}
                        isActive={isActive(child.href)}
                        isCollapsed={false}
                        isMobile={isMobile}
                        onClick={handleNavClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Render regular section header (without children)
          if (item.isSection) {
            return (
              <SidebarSection
                key={`section-${index}`}
                title={item.title}
                icon={item.icon as LucideIcon | undefined}
                isCollapsed={sidebarCollapsed}
              />
            );
          }

          // Render navigation item
          return (
            <SidebarNavItem
              key={item.href}
              title={item.title}
              href={item.href}
              icon={item.icon as LucideIcon | undefined}
              isActive={active}
              isCollapsed={sidebarCollapsed}
              isMobile={isMobile}
              onClick={handleNavClick}
            />
          );
        })}
      </nav>

      {/* Bottom Section: Notifications & User Menu */}
      <div className="border-t border-border p-2 space-y-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'relative w-full',
                sidebarCollapsed ? 'justify-center px-2' : 'justify-start',
              )}
            >
              <Bell className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span className="ml-3 text-foreground">Notifications</span>}
              {/* Notification badge */}
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-80 mb-2">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 text-sm text-muted-foreground">
              <p className="py-4 text-center">No new notifications</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn('w-full', sidebarCollapsed ? 'justify-center px-2' : 'justify-start')}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.firstName?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3 flex-1 overflow-hidden text-left">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.firstName} {user?.lastName || user?.email || 'User'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium text-foreground">
                  {user?.firstName} {user?.lastName || user?.email || 'User'}
                </p>
                <p className="text-xs font-normal text-muted-foreground">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(ROUTES.APP.SETTINGS_PROFILE)}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(ROUTES.APP.SETTINGS)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                {theme === 'system' && <Monitor className="mr-2 h-4 w-4" />}
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
