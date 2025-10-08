import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { userApi, roleApi } from '@ftry/frontend/auth';
import { useAuthStore } from '@/store';
import { getErrorMessage } from '@ftry/shared/utils';
import type { Role } from '@ftry/shared/types';

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface TenantOption {
  id: string;
  name: string;
}

export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const { user: currentUser, isSuperAdmin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    tenantId: currentUser?.tenantId || '',
  });

  // Load roles and tenants
  useEffect(() => {
    if (open) {
      loadRoles();
      if (isSuperAdmin()) {
        loadTenants();
      }
    }
  }, [open]);

  const loadRoles = async () => {
    try {
      const response = await roleApi.getRoles();
      // getRoles already returns PaginatedResponse<Role>, extract the data array
      setRoles(response.data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const loadTenants = async () => {
    try {
      // TODO: Implement tenant API once available
      // For now, mock data
      setTenants([
        { id: '1', name: 'Glamour Salon' },
        { id: '2', name: 'Elite Spa' },
      ]);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Generate a temporary password
      const temporaryPassword =
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      await userApi.createUser({
        email: formData.email,
        password: temporaryPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        roleId: formData.roleId,
        tenantId: isSuperAdmin()
          ? formData.tenantId || undefined
          : currentUser?.tenantId || undefined,
      });

      // TODO: Send invitation email with temporary password
      alert(
        `User invited successfully!\n\nTemporary Password: ${temporaryPassword}\n\nIn production, this would be sent via email.`,
      );

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        roleId: '',
        tenantId: currentUser?.tenantId || '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to invite user. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Send an invitation to join your salon. They will receive an email with login
            credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <p className="text-sm">{error}</p>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name.replace('_', ' ')}
                      {role.description && (
                        <span className="text-xs text-muted-foreground"> - {role.description}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSuperAdmin() && (
              <div className="space-y-2">
                <Label htmlFor="tenant">
                  Salon/Tenant <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder="Select a salon" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
