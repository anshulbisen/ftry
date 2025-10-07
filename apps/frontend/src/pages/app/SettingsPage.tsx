import { Settings } from 'lucide-react';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your application preferences</p>
      </div>

      <PagePlaceholder
        icon={Settings}
        title="Application Settings"
        description="Profile, business, and notification settings will be displayed here"
      />
    </div>
  );
}
