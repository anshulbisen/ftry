import React, { useState } from 'react';
import { Plus, MoreVertical, Edit, Trash2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/common';
import { PermissionGate } from '@/components/admin/common';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useTenants,
  useDeleteTenant,
  useSuspendTenant,
  useActivateTenant,
} from '@/hooks/useAdminData';
import { TenantForm } from './TenantForm';
import type { TenantWithStats } from '@/lib/admin';

export const TenantManagement: React.FC = () => {
  const { hasPermission } = usePermissions();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantWithStats | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<TenantWithStats | null>(null);

  const { data: tenants = [], isLoading, error } = useTenants();
  const { mutate: deleteTenant, isPending: isDeleting } = useDeleteTenant();
  const { mutate: suspendTenant, isPending: isSuspending } = useSuspendTenant();
  const { mutate: activateTenant, isPending: isActivating } = useActivateTenant();

  const handleDelete = () => {
    if (!deletingTenant) return;
    deleteTenant(deletingTenant.id, {
      onSuccess: () => {
        toast.success('Tenant deleted successfully');
        setDeletingTenant(null);
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete tenant: ${error.message}`);
      },
    });
  };

  const handleSuspend = (tenant: TenantWithStats) => {
    suspendTenant(tenant.id, {
      onSuccess: () => toast.success('Tenant suspended'),
      onError: (error: Error) => toast.error(`Failed: ${error.message}`),
    });
  };

  const handleActivate = (tenant: TenantWithStats) => {
    activateTenant(tenant.id, {
      onSuccess: () => toast.success('Tenant activated'),
      onError: (error: Error) => toast.error(`Failed: ${error.message}`),
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (tenant: TenantWithStats) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{tenant.name}</span>
          <span className="text-xs text-muted-foreground">{tenant.slug}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (tenant: TenantWithStats) => (
        <Badge variant={tenant.status === 'active' ? 'default' : 'destructive'}>
          {tenant.status}
        </Badge>
      ),
    },
    {
      key: 'subscriptionPlan',
      label: 'Plan',
      render: (tenant: TenantWithStats) => (
        <span className="text-sm">{tenant.subscriptionPlan || 'Free'}</span>
      ),
    },
    {
      key: 'userCount',
      label: 'Users',
      render: (tenant: TenantWithStats) => (
        <span className="text-sm">
          {tenant.userCount} {tenant.maxUsers ? `/ ${tenant.maxUsers}` : ''}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (tenant: TenantWithStats) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <PermissionGate permissions={['tenants:update:all', 'tenants:update:own']}>
              <DropdownMenuItem onClick={() => setEditingTenant(tenant)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permissions={['tenants:suspend']}>
              <DropdownMenuSeparator />
              {tenant.status === 'active' ? (
                <DropdownMenuItem onClick={() => handleSuspend(tenant)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleActivate(tenant)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
            </PermissionGate>
            <PermissionGate permissions={['tenants:delete']}>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletingTenant(tenant)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </PermissionGate>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load tenants: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">Manage tenants and subscriptions</p>
        </div>
        <PermissionGate permissions={['tenants:create']}>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        data={tenants}
        columns={columns}
        loading={isLoading}
        emptyMessage="No tenants found"
      />

      {(showCreateDialog || editingTenant) && (
        <TenantForm
          tenant={editingTenant || undefined}
          open={showCreateDialog || !!editingTenant}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingTenant(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingTenant} onOpenChange={() => setDeletingTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingTenant?.name}&quot; and all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
