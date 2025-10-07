import { BarChart3 } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function ReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View business analytics and reports</p>
      </div>

      <PagePlaceholder
        icon={BarChart3}
        title="Reports & Analytics"
        description="Business insights, charts, and reports will be displayed here"
      />
    </div>
  );
}
