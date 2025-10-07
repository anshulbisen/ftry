import { BarChart3 } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your salon management dashboard</p>
      </div>

      <PagePlaceholder
        icon={BarChart3}
        title="Dashboard Content"
        description="Analytics, charts, and quick stats will be displayed here"
      />
    </div>
  );
}
