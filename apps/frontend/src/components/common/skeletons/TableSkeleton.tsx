import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Skeleton component for table layouts
 * Displays placeholder animation while table data loads
 */
export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {/* Table Header */}
      <div className="border-b border-border bg-muted/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`header-${i}`} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-4 bg-muted animate-pulse rounded"
                  style={{
                    width: colIndex === 0 ? '80%' : '100%',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
