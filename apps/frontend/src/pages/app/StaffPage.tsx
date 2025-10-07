import { UserCircle } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function StaffPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Staff</h1>
        <p className="text-muted-foreground">Manage your team members</p>
      </div>

      <PagePlaceholder
        icon={UserCircle}
        title="Staff Management"
        description="Staff list, schedules, and profiles will be displayed here"
      />
    </div>
  );
}
