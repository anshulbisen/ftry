import { memo } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const StatCard = memo<StatCardProps>(
  ({ title, value, change, icon: Icon, color, bgColor }) => {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-green-600">{change} from last month</p>
          </div>
          <div className={`${bgColor} rounded-lg p-3`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </Card>
    );
  },
);

StatCard.displayName = 'StatCard';
