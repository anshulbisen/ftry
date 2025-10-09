import React, { useState } from 'react';
import { Plus, MoreVertical, Edit, Trash2, UserCog } from 'lucide-react';
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
import { useUsers, useDeleteUser } from '@/hooks/useAdminData';
import { UserForm } from './UserForm';
import type { SafeUser } from '@ftry/shared/types';
import type { UserListItem } from '@/lib/admin';

/**
 * UserManagement Component
 *
 * Manages users with permission-based access control.
 * Features:
 * - List users with tenant/role information
 * - Create/edit users (permission-gated)
 * - Delete users with confirmation
 * - Impersonate users (permission-gated)
 * - Responsive table with actions
 */
export const UserManagement: React.FC = () => {
  const { hasPermission, hasGlobalAccess } = usePermissions();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);

  // Fetch users (automatically scoped by backend)
  const { data: users = [], isLoading, error } = useUsers();

  // Mutations
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  // Check if user can see tenant column
  const showTenantColumn = hasGlobalAccess('users', 'read');

  // Handle delete user
  const handleDelete = (user: UserListItem) => {
    setDeletingUser(user);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;

    deleteUser(deletingUser.id, {
      onSuccess: () => {
        toast.success('User deleted successfully');
        setDeletingUser(null);
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete user: ${error.message}`);
      },
    });
  };

  // Handle edit user
  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
  };

  // Handle impersonate user
  const handleImpersonate = (user: UserListItem) => {
    // TODO: Implement impersonation logic
    toast.info(`Impersonate feature coming soon for ${user.email}`);
  };

  // Table columns
  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (user: UserListItem) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{user.email}</span>
          <span className="text-xs text-muted-foreground">
            {user.firstName} {user.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: UserListItem) => <Badge variant="outline">{user.role.name}</Badge>,
    },
    ...(showTenantColumn
      ? [
          {
            key: 'tenant',
            label: 'Tenant',
            render: (user: UserListItem) => (
              <span className="text-sm">{user.tenant?.name || 'System'}</span>
            ),
          },
        ]
      : []),
    {
      key: 'status',
      label: 'Status',
      render: (user: UserListItem) => (
        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: UserListItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <PermissionGate permissions={['users:update:all', 'users:update:own']}>
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permissions={['users:delete:all', 'users:delete:own']}>
              <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permissions={['impersonate:any', 'impersonate:own']}>
              <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                <UserCog className="mr-2 h-4 w-4" />
                Impersonate
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
        <p className="text-destructive">Failed to load users: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>
        <PermissionGate permissions={['users:create:all', 'users:create:own']}>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </PermissionGate>
      </div>

      {/* Users Table */}
      <DataTable data={users} columns={columns} loading={isLoading} emptyMessage="No users found" />

      {/* Create/Edit User Dialog */}
      {(showCreateDialog || editingUser) && (
        <UserForm
          user={editingUser || undefined}
          open={showCreateDialog || !!editingUser}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user &quot;{deletingUser?.email}&quot;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
