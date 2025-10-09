import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store';
import { userApi } from '@/lib/auth';
import { getErrorMessage } from '@ftry/shared/utils';
import type { SafeUser } from '@ftry/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VirtualList } from '@/components/common';
import { UserCard } from '@/components/admin/UserCard';
import { InviteUserModal } from '@/components/modals/InviteUserModal';
import { Search, UserPlus } from 'lucide-react';

export function Users() {
  const { isSuperAdmin, isTenantAdmin, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const canInviteUsers = isSuperAdmin() || isTenantAdmin();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter, roleFilter]);

  const loadUsers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await userApi.getUsers();
      setUsers(response.data);
      setTotalUsers(response.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = (): void => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role.name === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  // Memoize handlers to prevent unnecessary re-renders
  const handleEditUser = useCallback((userId: string) => {
    alert('Edit functionality coming soon');
  }, []);

  const handleDeactivateUser = useCallback(
    async (userId: string) => {
      if (!confirm('Are you sure you want to deactivate this user?')) return;

      try {
        await userApi.updateUser(userId, { status: 'inactive' });
        alert('User deactivated successfully');
        loadUsers();
      } catch (err: unknown) {
        alert(getErrorMessage(err, 'Failed to deactivate user'));
      }
    },
    [loadUsers],
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      if (!confirm('Are you sure you want to delete this user? This action cannot be undone.'))
        return;

      try {
        await userApi.deleteUser(userId);
        alert('User deleted successfully');
        loadUsers();
      } catch (err: unknown) {
        alert(getErrorMessage(err, 'Failed to delete user'));
      }
    },
    [loadUsers],
  );

  // Use virtual list for better performance with large user lists
  const virtualListHeight = useMemo(() => {
    const itemCount = Math.min(filteredUsers.length, 10); // Show max 10 items at once
    return Math.min(itemCount * 72, 720); // 72px per item, max 720px
  }, [filteredUsers.length]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadUsers} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="mt-2 text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        {canInviteUsers && (
          <Button onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="tenant_owner">Tenant Owner</SelectItem>
            <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User List with Virtual Scrolling */}
      <div className="rounded-md border bg-card">
        {filteredUsers.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            No users found
          </div>
        ) : (
          <VirtualList
            items={filteredUsers}
            height={virtualListHeight}
            itemHeight={72}
            className="rounded-md"
            renderItem={(user) => (
              <UserCard
                user={user}
                currentUserId={currentUser?.id}
                isSuperAdmin={isSuperAdmin()}
                onEdit={handleEditUser}
                onDeactivate={handleDeactivateUser}
                onDelete={handleDeleteUser}
              />
            )}
          />
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        {filteredUsers.length !== totalUsers && ` (filtered from ${totalUsers} total)`}
      </div>

      {/* Invite User Modal */}
      <InviteUserModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={loadUsers}
      />
    </div>
  );
}
