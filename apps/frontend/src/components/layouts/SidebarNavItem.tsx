import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  title: string;
  href: string;
  icon?: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}

export const SidebarNavItem = memo<SidebarNavItemProps>(
  ({ title, href, icon: Icon, isActive, isCollapsed, isMobile = false, onClick }) => {
    const handleClick = useCallback(() => {
      onClick?.();
    }, [onClick]);

    return (
      <Link
        to={href}
        onClick={handleClick}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          isCollapsed && !isMobile && 'justify-center',
        )}
        title={isCollapsed && !isMobile ? title : undefined}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        {(!isCollapsed || isMobile) && <span>{title}</span>}
      </Link>
    );
  },
);

SidebarNavItem.displayName = 'SidebarNavItem';
