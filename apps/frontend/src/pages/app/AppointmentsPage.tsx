import { Calendar } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function AppointmentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">Manage your salon appointments</p>
      </div>

      <PagePlaceholder
        icon={Calendar}
        title="Appointments Management"
        description="Calendar view and appointment list will be displayed here"
      />
    </div>
  );
}
