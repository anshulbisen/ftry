import { memo } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarSectionProps {
  title: string;
  icon?: LucideIcon;
  isCollapsed: boolean;
}

export const SidebarSection = memo<SidebarSectionProps>(({ title, icon: Icon, isCollapsed }) => {
  return (
    <div className={cn('mt-4 px-3 py-2', isCollapsed ? 'border-t border-border' : '')}>
      {!isCollapsed && Icon && (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
        </div>
      )}
    </div>
  );
});

SidebarSection.displayName = 'SidebarSection';
