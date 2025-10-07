import { Scissors } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function ServicesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-muted-foreground">Manage your salon services</p>
      </div>

      <PagePlaceholder
        icon={Scissors}
        title="Services Management"
        description="Service list, pricing, and categories will be displayed here"
      />
    </div>
  );
}
