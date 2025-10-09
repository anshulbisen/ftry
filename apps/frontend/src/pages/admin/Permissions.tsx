import { useState, useEffect } from 'react';
import { permissionApi } from '@/lib/auth';
import { getErrorMessage } from '@ftry/shared/utils';
import type { Permission } from '@ftry/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Shield, Info } from 'lucide-react';

interface GroupedPermissions {
  [resource: string]: Permission[];
}

export function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await permissionApi.getPermissions();
      // getPermissions already returns PaginatedResponse<Permission>, extract the data array
      const data = response.data;
      setPermissions(data);

      // Group permissions by resource
      const grouped = data.reduce((acc: GroupedPermissions, permission: Permission) => {
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
      setError(getErrorMessage(err, 'Failed to load permissions'));
    } finally {
      setIsLoading(false);
    }
  };

  const filterPermissions = (perms: Permission[]) => {
    if (!searchQuery) return perms;
    const query = searchQuery.toLowerCase();
    return perms.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.resource.toLowerCase().includes(query) ||
        p.action.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    );
  };

  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce(
    (acc, [resource, perms]) => {
      const filtered = filterPermissions(perms);
      if (filtered.length > 0) {
        acc[resource] = filtered;
      }
      return acc;
    },
    {} as GroupedPermissions,
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadPermissions} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permission Reference</h1>
        <p className="mt-2 text-muted-foreground">
          View all available permissions in the system. These are assigned to roles.
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Read-Only Reference</p>
            <p className="mt-1 text-sm text-blue-700">
              Permissions cannot be created or modified directly. They are defined at the system
              level. To grant permissions, assign them to roles in the Role Management page.
            </p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search permissions by name, resource, or action..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Permissions</p>
              <p className="text-2xl font-bold">{permissions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resource Categories</p>
              <p className="text-2xl font-bold">{Object.keys(groupedPermissions).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Filtered Results</p>
              <p className="text-2xl font-bold">
                {Object.values(filteredGroupedPermissions).flat().length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Permissions by Resource */}
      <div className="space-y-6">
        {Object.entries(filteredGroupedPermissions).map(([resource, perms]) => (
          <Card key={resource} className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold capitalize">{resource}</h2>
              <Badge variant="secondary" className="ml-2">
                {perms.length} permissions
              </Badge>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perms.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                          {permission.name}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {permission.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {permission.description || 'No description available'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ))}

        {Object.keys(filteredGroupedPermissions).length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No permissions found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search query</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
