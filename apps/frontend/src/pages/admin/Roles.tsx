import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { roleApi, permissionApi } from '@ftry/frontend/auth';
import { getErrorMessage } from '@ftry/shared/utils';
import type { Role, Permission } from '@ftry/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { Plus, MoreVertical, Edit, Trash, Shield } from 'lucide-react';

interface RoleWithUserCount extends Role {
  usersCount?: number;
}

interface GroupedPermissions {
  [resource: string]: Permission[];
}

export function Roles() {
  const { isSuperAdmin } = useAuthStore();
  const [roles, setRoles] = useState<RoleWithUserCount[]>([]);
  const [, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithUserCount | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        roleApi.getRoles(),
        permissionApi.getPermissions(),
      ]);
      // APIs already return PaginatedResponse, extract the data arrays
      const rolesData = rolesResponse.data;
      const permissionsData = permissionsResponse.data;
      setRoles(rolesData);
      setPermissions(permissionsData);

      // Group permissions by resource
      const grouped = permissionsData.reduce((acc: GroupedPermissions, permission: Permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        const resourcePermissions = acc[permission.resource];
        if (resourcePermissions) {
          resourcePermissions.push(permission);
        }
        return acc;
      }, {} as GroupedPermissions);
      setGroupedPermissions(grouped);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load roles and permissions'));
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleWithUserCount) => {
    if (role.isSystem) {
      alert('System roles cannot be edited');
      return;
    }
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      if (editingRole) {
        await roleApi.updateRole(editingRole.id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
        alert('Role updated successfully');
      } else {
        await roleApi.createRole({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
        alert('Role created successfully');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setModalError(getErrorMessage(err, 'Failed to save role'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string, isSystem: boolean) => {
    if (isSystem) {
      alert('System roles cannot be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.'))
      return;

    try {
      await roleApi.deleteRole(roleId);
      alert('Role deleted successfully');
      loadData();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete role'));
    }
  };

  const togglePermission = (permissionName: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter((p) => p !== permissionName)
        : [...prev.permissions, permissionName],
    }));
  };

  const toggleResourcePermissions = (resource: string, checked: boolean) => {
    const permissions = groupedPermissions[resource];
    if (!permissions) return;

    const resourcePermissions = permissions.map((p) => p.name);
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...resourcePermissions])]
        : prev.permissions.filter((p) => !resourcePermissions.includes(p)),
    }));
  };

  const isResourceChecked = (resource: string) => {
    const permissions = groupedPermissions[resource];
    if (!permissions) return false;

    const resourcePermissions = permissions.map((p) => p.name);
    return resourcePermissions.every((p) => formData.permissions.includes(p));
  };

  const isResourceIndeterminate = (resource: string) => {
    const permissions = groupedPermissions[resource];
    if (!permissions) return false;

    const resourcePermissions = permissions.map((p) => p.name);
    const checkedCount = resourcePermissions.filter((p) => formData.permissions.includes(p)).length;
    return checkedCount > 0 && checkedCount < resourcePermissions.length;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadData} className="mt-4">
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
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="mt-2 text-muted-foreground">
            Define roles and assign permissions to control access
          </p>
        </div>
        {isSuperAdmin() && (
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{role.name.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-sm text-muted-foreground">
                      {role.description || 'No description'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.permissions.length} permissions</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.usersCount || 0} users</Badge>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge className="bg-blue-100 text-blue-700">System</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditModal(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {role.isSystem ? 'View Details' : 'Edit Role'}
                        </DropdownMenuItem>
                        {!role.isSystem && isSuperAdmin() && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteRole(role.id, role.isSystem)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? (editingRole.isSystem ? 'View Role' : 'Edit Role') : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole?.isSystem
                ? 'System roles cannot be modified. View permissions only.'
                : 'Define role name, description, and assign permissions'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {modalError && (
                <Alert variant="destructive">
                  <p className="text-sm">{modalError}</p>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="roleName">
                  Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Manager, Receptionist"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting || editingRole?.isSystem}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  placeholder="Brief description of this role"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting || editingRole?.isSystem}
                />
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="space-y-4 rounded-md border p-4">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`resource-${resource}`}
                          checked={isResourceChecked(resource)}
                          onCheckedChange={(checked) =>
                            toggleResourcePermissions(resource, checked as boolean)
                          }
                          disabled={isSubmitting || editingRole?.isSystem}
                          className={
                            isResourceIndeterminate(resource)
                              ? 'data-[state=checked]:bg-gray-400'
                              : ''
                          }
                        />
                        <Label
                          htmlFor={`resource-${resource}`}
                          className="text-sm font-semibold capitalize cursor-pointer"
                        >
                          {resource}
                        </Label>
                      </div>
                      <div className="ml-6 grid gap-2 sm:grid-cols-2">
                        {perms.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={formData.permissions.includes(permission.name)}
                              onCheckedChange={() => togglePermission(permission.name)}
                              disabled={isSubmitting || editingRole?.isSystem}
                            />
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {permission.action}
                              {permission.description && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({permission.description})
                                </span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                {editingRole?.isSystem ? 'Close' : 'Cancel'}
              </Button>
              {!editingRole?.isSystem && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
