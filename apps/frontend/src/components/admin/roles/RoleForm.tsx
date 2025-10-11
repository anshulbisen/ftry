import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermissions } from '@/hooks/usePermissions';
import { useAllPermissions, useCreateRole, useUpdateRole } from '@/hooks/useAdminData';
import type { RoleWithStats } from '@/lib/admin';

const roleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required'),
  type: z.enum(['system', 'tenant']).optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  role?: RoleWithStats;
  open: boolean;
  onClose: () => void;
}

export const RoleForm: React.FC<RoleFormProps> = ({ role, open, onClose }) => {
  const { hasPermission } = usePermissions();
  const isEditing = !!role;
  const canManageSystemRoles = hasPermission('roles:create:system');

  const { data: allPermissions = [], isLoading: loadingPermissions } = useAllPermissions();
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();

  // Group permissions by resource
  const groupedPermissions = allPermissions.reduce(
    (acc, permission) => {
      const { resource } = permission;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(permission);
      return acc;
    },
    {} as Record<string, typeof allPermissions>,
  );

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      permissions: role?.permissions || [],
      type: (role?.type as 'system' | 'tenant') || 'tenant',
    },
  });

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions,
        type: role.type as 'system' | 'tenant',
      });
    }
  }, [role, form]);

  const onSubmit = (values: RoleFormValues) => {
    if (isEditing) {
      updateRole(
        { id: role.id, data: values },
        {
          onSuccess: () => {
            toast.success('Role updated successfully');
            onClose();
          },
          onError: (error: Error) => {
            toast.error(`Failed to update role: ${error.message}`);
          },
        },
      );
    } else {
      createRole(values, {
        onSuccess: () => {
          toast.success('Role created successfully');
          onClose();
          form.reset();
        },
        onError: (error: Error) => {
          toast.error(`Failed to create role: ${error.message}`);
        },
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update role permissions.'
              : 'Create a new role with specific permissions.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Manager"
                      disabled={isPending || role?.isSystem}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Manages users and content"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permissions grouped by resource */}
            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <FormDescription>Select the permissions for this role</FormDescription>
                  {loadingPermissions ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4 mt-2 max-h-[300px] overflow-y-auto border rounded-md p-4">
                      {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                        <div key={resource} className="space-y-2">
                          <h4 className="font-medium text-sm capitalize">{resource}</h4>
                          <div className="grid grid-cols-1 gap-2 ml-4">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={permission.id}
                                  checked={field.value.includes(permission.name)}
                                  onCheckedChange={(checked) => {
                                    const updatedPermissions = checked
                                      ? [...field.value, permission.name]
                                      : field.value.filter((p) => p !== permission.name);
                                    field.onChange(updatedPermissions);
                                  }}
                                  disabled={isPending || (role?.isSystem && !canManageSystemRoles)}
                                />
                                <label htmlFor={permission.id} className="text-sm cursor-pointer">
                                  {permission.name}
                                  {permission.description && (
                                    <span className="text-muted-foreground ml-2">
                                      - {permission.description}
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || loadingPermissions}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'} Role
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
