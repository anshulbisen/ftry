import { useAuthStore } from '@/store';
import { Card } from '@/components/ui/card';
import { Users, Calendar, Receipt, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Total Appointments',
      value: '156',
      change: '+12%',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Clients',
      value: '342',
      change: '+8%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Revenue',
      value: '₹45,230',
      change: '+23%',
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Growth',
      value: '18%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || user?.email?.split('@')[0]}!
        </h1>
        <p className="mt-2 text-muted-foreground">Here's what's happening with your salon today.</p>
        {user?.role && (
          <p className="mt-1 text-sm text-muted-foreground">
            Role: <span className="font-medium">{user.role.name?.replace('_', ' ')}</span>
            {user.tenant && (
              <>
                {' '}
                | Salon: <span className="font-medium">{user.tenant.name}</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-green-600">{stat.change} from last month</p>
                </div>
                <div className={`${stat.bgColor} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="p-6 md:col-span-4">
          <h3 className="text-lg font-semibold">Recent Appointments</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Haircut - John Doe</p>
                <p className="text-sm text-muted-foreground">Today, 10:00 AM</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Confirmed
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Spa Treatment - Jane Smith</p>
                <p className="text-sm text-muted-foreground">Today, 2:00 PM</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Pending
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">Hair Coloring - Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Tomorrow, 11:00 AM</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Confirmed
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-3">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-4 space-y-3">
            <button className="w-full rounded-md bg-primary px-4 py-3 text-left text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              New Appointment
            </button>
            <button className="w-full rounded-md bg-secondary px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-secondary/80">
              Add Client
            </button>
            <button className="w-full rounded-md bg-secondary px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-secondary/80">
              Generate Report
            </button>
            <button className="w-full rounded-md bg-secondary px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-secondary/80">
              View Schedule
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
