import { Users } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function ClientsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-muted-foreground">Manage your client database</p>
      </div>

      <PagePlaceholder
        icon={Users}
        title="Client Management"
        description="Client list, profiles, and history will be displayed here"
      />
    </div>
  );
}
