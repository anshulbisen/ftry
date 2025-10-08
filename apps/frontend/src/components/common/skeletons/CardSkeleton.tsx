import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  className?: string;
}

/**
 * Skeleton component for card-based layouts
 * Displays placeholder animation while content loads
 */
export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6 space-y-4', className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
      </div>

      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
