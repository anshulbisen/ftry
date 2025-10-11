import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PagePlaceholderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export const PagePlaceholder = memo<PagePlaceholderProps>(
  ({ icon: Icon, title, description, className, children }) => {
    return (
      <div className={cn('flex min-h-[60vh] flex-col items-center justify-center', className)}>
        <div className="text-center">
          {Icon && (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          )}
          <h1 className="mb-2 text-2xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    );
  },
);

PagePlaceholder.displayName = 'PagePlaceholder';
