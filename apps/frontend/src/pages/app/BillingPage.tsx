import { Receipt } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function BillingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage invoices and payments</p>
      </div>

      <PagePlaceholder
        icon={Receipt}
        title="Billing & Invoices"
        description="POS system, invoices, and payment tracking will be displayed here"
      />
    </div>
  );
}
