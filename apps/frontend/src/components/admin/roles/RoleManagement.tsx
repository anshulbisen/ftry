import React, { useState } from 'react';
import { Plus, MoreVertical, Edit, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useRoles, useDeleteRole } from '@/hooks/useAdminData';
import { RoleForm } from './RoleForm';
import type { RoleWithStats } from '@/lib/admin';

export const RoleManagement: React.FC = () => {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithStats | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleWithStats | null>(null);

  const { data: roles = [], isLoading, error } = useRoles();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();

  const handleDelete = () => {
    if (!deletingRole) return;
    if (deletingRole.userCount > 0) {
      toast.error('Cannot delete role with assigned users');
      return;
    }
    deleteRole(deletingRole.id, {
      onSuccess: () => {
        toast.success('Role deleted successfully');
        setDeletingRole(null);
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete role: ${error.message}`);
      },
    });
  };

  const canEditRole = (role: RoleWithStats) => {
    if (role.type === 'system') {
      return hasPermission('roles:update:system');
    }
    return hasPermission('roles:update:tenant');
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (role: RoleWithStats) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{role.name}</span>
            {role.description && (
              <span className="text-xs text-muted-foreground">{role.description}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (role: RoleWithStats) => (
        <Badge variant={role.type === 'system' ? 'default' : 'secondary'}>{role.type}</Badge>
      ),
    },
    {
      key: 'permissionCount',
      label: 'Permissions',
      render: (role: RoleWithStats) => (
        <span className="text-sm">{role.permissionCount || role.permissions.length}</span>
      ),
    },
    {
      key: 'userCount',
      label: 'Users',
      render: (role: RoleWithStats) => <span className="text-sm">{role.userCount || 0}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (role: RoleWithStats) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEditRole(role) && (
              <DropdownMenuItem onClick={() => setEditingRole(role)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <PermissionGate permissions={['roles:delete']}>
              <DropdownMenuItem
                onClick={() => setDeletingRole(role)}
                className="text-destructive"
                disabled={role.isSystem || role.userCount > 0}
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
        <p className="text-destructive">Failed to load roles: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions</p>
        </div>
        <PermissionGate permissions={['roles:create:system', 'roles:create:tenant']}>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </PermissionGate>
      </div>

      <DataTable data={roles} columns={columns} loading={isLoading} emptyMessage="No roles found" />

      {(showCreateDialog || editingRole) && (
        <RoleForm
          role={editingRole || undefined}
          open={showCreateDialog || !!editingRole}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingRole(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role &quot;{deletingRole?.name}&quot;.
              {deletingRole?.userCount && deletingRole.userCount > 0
                ? ' This role has assigned users and cannot be deleted.'
                : ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || (deletingRole?.userCount || 0) > 0}
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
