import React, { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTenant, useUpdateTenant } from '@/hooks/useAdminData';
import type { TenantWithStats } from '@/lib/admin';

const tenantFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  subscriptionPlan: z.string().optional(),
  maxUsers: z.number().int().positive().optional(),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

interface TenantFormProps {
  tenant?: TenantWithStats;
  open: boolean;
  onClose: () => void;
}

export const TenantForm: React.FC<TenantFormProps> = ({ tenant, open, onClose }) => {
  const isEditing = !!tenant;
  const { mutate: createTenant, isPending: isCreating } = useCreateTenant();
  const { mutate: updateTenant, isPending: isUpdating } = useUpdateTenant();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: tenant?.name || '',
      slug: tenant?.slug || '',
      description: tenant?.description || '',
      website: tenant?.website || '',
      subscriptionPlan: tenant?.subscriptionPlan || '',
      maxUsers: tenant?.maxUsers || undefined,
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description || '',
        website: tenant.website || '',
        subscriptionPlan: tenant.subscriptionPlan || '',
        maxUsers: tenant.maxUsers || undefined,
      });
    }
  }, [tenant, form]);

  const onSubmit = (values: TenantFormValues) => {
    if (isEditing) {
      updateTenant(
        { id: tenant.id, data: values },
        {
          onSuccess: () => {
            toast.success('Tenant updated successfully');
            onClose();
          },
          onError: (error: Error) => {
            toast.error(`Failed to update tenant: ${error.message}`);
          },
        },
      );
    } else {
      createTenant(values, {
        onSuccess: () => {
          toast.success('Tenant created successfully');
          onClose();
          form.reset();
        },
        onError: (error: Error) => {
          toast.error(`Failed to create tenant: ${error.message}`);
        },
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Tenant' : 'Create Tenant'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update tenant information.' : 'Add a new tenant to the system.'}
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
                    <Input placeholder="Acme Corporation" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-corp" disabled={isEditing || isPending} {...field} />
                  </FormControl>
                  <FormDescription>Unique identifier (lowercase, dashes only)</FormDescription>
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
                      placeholder="Brief description of the tenant"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://acme.com"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscriptionPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Users (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      disabled={isPending}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormDescription>Leave empty for unlimited</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'} Tenant
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
