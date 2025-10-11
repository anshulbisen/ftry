# Admin CRUD Quick Start Guide

**Goal**: Create a new admin resource interface in 30 minutes or less.

**Prerequisites**:

- TanStack Query hooks exist for your resource
- Backend API endpoints are ready
- Entity type is defined

## Step-by-Step: Create New Resource

### Step 1: Create TanStack Query Hooks (5 min)

```typescript
// apps/frontend/src/hooks/useAdminData.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin/admin.api';
import { toast } from 'sonner';
import type { ResourceFilters } from '@/types/admin';

// List hook
export const useAppointments = (filters?: ResourceFilters) => {
  return useQuery({
    queryKey: ['admin', 'appointments', filters],
    queryFn: () => adminApi.appointments.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create hook
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentDto) => adminApi.appointments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] });
      toast.success('Appointment created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create appointment: ${error.message}`);
    },
  });
};

// Update hook
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDto }) =>
      adminApi.appointments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] });
      toast.success('Appointment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update appointment: ${error.message}`);
    },
  });
};

// Delete hook
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.appointments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] });
      toast.success('Appointment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete appointment: ${error.message}`);
    },
  });
};
```

### Step 2: Create Form Component (10 min)

```typescript
// apps/frontend/src/components/admin/appointments/AppointmentForm.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAppointment, useUpdateAppointment } from '@/hooks/useAdminData';
import type { FormProps } from '@/types/admin';
import type { Appointment, CreateAppointmentDto } from '@/lib/admin/admin.api';

// Validation schema
const appointmentSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  serviceId: z.string().min(1, 'Service is required'),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const AppointmentForm: React.FC<FormProps<Appointment, CreateAppointmentDto>> = ({
  entity,
  open,
  onClose,
  onSuccess,
}) => {
  const { mutate: createAppointment, isPending: isCreating } = useCreateAppointment();
  const { mutate: updateAppointment, isPending: isUpdating } = useUpdateAppointment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: entity || {
      clientName: '',
      serviceId: '',
      startTime: '',
      duration: 60,
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    if (entity) {
      // Update existing
      updateAppointment(
        { id: entity.id, data },
        {
          onSuccess: (updated) => {
            onSuccess?.(updated);
            onClose();
            reset();
          },
        }
      );
    } else {
      // Create new
      createAppointment(data, {
        onSuccess: (created) => {
          onSuccess?.(created);
          onClose();
          reset();
        },
      });
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entity ? 'Edit Appointment' : 'Create Appointment'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              {...register('clientName')}
              placeholder="Enter client name"
              disabled={isPending}
            />
            {errors.clientName && (
              <p className="text-sm text-destructive">{errors.clientName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceId">Service</Label>
            <Input
              id="serviceId"
              {...register('serviceId')}
              placeholder="Select service"
              disabled={isPending}
            />
            {errors.serviceId && (
              <p className="text-sm text-destructive">{errors.serviceId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              {...register('startTime')}
              disabled={isPending}
            />
            {errors.startTime && (
              <p className="text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              {...register('duration', { valueAsNumber: true })}
              placeholder="60"
              disabled={isPending}
            />
            {errors.duration && (
              <p className="text-sm text-destructive">{errors.duration.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : entity ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

### Step 3: Create Configuration File (10 min)

```typescript
// apps/frontend/src/config/admin/appointments.config.tsx

import { Calendar, Clock } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { AppointmentForm } from '@/components/admin/appointments/AppointmentForm';
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from '@/hooks/useAdminData';
import type { ResourceConfig, TableColumn } from '@/types/admin';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '@/lib/admin/admin.api';

const columnHelper = createColumnHelper<Appointment>();

export const appointmentConfig: ResourceConfig<
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto
> = {
  // ========== Metadata ==========
  metadata: {
    singular: 'Appointment',
    plural: 'Appointments',
    icon: Calendar,
    description: 'Manage salon appointments and bookings',
    emptyMessage: 'No appointments found',
    loadingMessage: 'Loading appointments...',
    errorMessagePrefix: 'Failed to load appointments',
  },

  // ========== Permissions ==========
  permissions: {
    create: ['appointments:create:all', 'appointments:create:own'],
    read: ['appointments:read:all', 'appointments:read:own'],
    update: ['appointments:update:all', 'appointments:update:own'],
    delete: ['appointments:delete:all', 'appointments:delete:own'],
  },

  // ========== Hooks ==========
  hooks: {
    useList: (filters) => useAppointments(filters),
    useCreate: () => useCreateAppointment(),
    useUpdate: () => useUpdateAppointment(),
    useDelete: () => useDeleteAppointment(),
  },

  // ========== Table ==========
  table: {
    columns: [
      {
        ...columnHelper.accessor('clientName', {
          id: 'clientName',
          header: 'Client',
          cell: ({ row }) => (
            <span className="font-medium">{row.original.clientName}</span>
          ),
          enableSorting: true,
        }),
        sortable: true,
      } as TableColumn<Appointment>,

      {
        ...columnHelper.accessor('service.name', {
          id: 'service',
          header: 'Service',
          cell: ({ row }) => <Badge variant="outline">{row.original.service.name}</Badge>,
          enableSorting: true,
        }),
        sortable: true,
      } as TableColumn<Appointment>,

      {
        ...columnHelper.accessor('startTime', {
          id: 'startTime',
          header: 'Start Time',
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(row.original.startTime).toLocaleString()}</span>
            </div>
          ),
          enableSorting: true,
        }),
        sortable: true,
      } as TableColumn<Appointment>,

      {
        ...columnHelper.accessor('status', {
          id: 'status',
          header: 'Status',
          cell: ({ row }) => {
            const statusColor = {
              pending: 'secondary',
              confirmed: 'default',
              completed: 'success',
              cancelled: 'destructive',
            }[row.original.status] || 'secondary';

            return <Badge variant={statusColor}>{row.original.status}</Badge>;
          },
          enableSorting: true,
        }),
        sortable: true,
      } as TableColumn<Appointment>,
    ],
    defaultSort: {
      key: 'startTime',
      direction: 'asc',
    },
    rowsPerPage: 10,
    selectable: false,
  },

  // ========== Form ==========
  form: {
    component: AppointmentForm,
    dialogSize: 'default',
    getDialogTitle: (appointment) =>
      appointment ? `Edit Appointment - ${appointment.clientName}` : 'Create Appointment',
  },

  // ========== Search ==========
  search: {
    enabled: true,
    placeholder: 'Search appointments by client name...',
    searchableFields: ['clientName', 'service.name'],
    debounceMs: 300,
    minChars: 2,
  },

  // ========== Delete Validation ==========
  deleteValidation: {
    canDelete: (appointment) => ({
      allowed: appointment.status !== 'completed',
      reason:
        appointment.status === 'completed'
          ? 'Cannot delete completed appointments'
          : undefined,
    }),
    warningMessage: (appointment) =>
      `This will permanently delete the appointment for ${appointment.clientName}. This action cannot be undone.`,
  },
};
```

### Step 4: Create Page Component (2 min)

```typescript
// apps/frontend/src/pages/admin/AppointmentsPage.tsx

import React from 'react';
import { ResourceManager } from '@/components/admin/common/ResourceManager';
import { appointmentConfig } from '@/config/admin/appointments.config';

export const AppointmentsPage: React.FC = () => {
  return <ResourceManager config={appointmentConfig} />;
};
```

### Step 5: Add to Routing (3 min)

```typescript
// apps/frontend/src/routes/admin.tsx

import { AppointmentsPage } from '@/pages/admin/AppointmentsPage';

export const adminRoutes = [
  // ... existing routes
  {
    path: 'appointments',
    element: <AppointmentsPage />,
  },
];
```

### Step 6: Test (5 min)

```bash
# Start dev server
nx serve frontend

# Manual testing checklist:
# [ ] Page loads at /admin/appointments
# [ ] Table displays appointment data
# [ ] Click "Add Appointment" - form opens
# [ ] Fill form and save - appointment created
# [ ] Click edit in actions menu - form opens with data
# [ ] Update and save - appointment updated
# [ ] Click delete in actions menu - confirmation shows
# [ ] Confirm delete - appointment removed
# [ ] Search filters results
# [ ] Sort columns work
# [ ] Cannot delete completed appointments
```

## Common Patterns

### Pattern 1: Custom Action (e.g., Cancel Appointment)

```typescript
// In appointments.config.tsx

import { XCircle } from 'lucide-react';

customActions: [
  {
    id: 'cancel',
    label: 'Cancel Appointment',
    icon: XCircle,
    variant: 'destructive',
    location: ['row'],
    permissions: ['appointments:cancel:all', 'appointments:cancel:own'],
    confirmation: {
      title: 'Cancel Appointment',
      description: (appointment) =>
        `Cancel appointment for ${appointment.clientName}? This will notify the client.`,
      confirmText: 'Cancel Appointment',
      variant: 'destructive',
    },
    handler: async (appointment, { useCancelAppointment }) => {
      const { mutateAsync } = useCancelAppointment();
      await mutateAsync(appointment.id);
    },
    shouldShow: (appointment) =>
      appointment.status === 'pending' || appointment.status === 'confirmed',
  },
],
```

### Pattern 2: Permission-Based Column Visibility

```typescript
// Show staff member column only to managers
{
  ...columnHelper.accessor('staffMember.name', {
    id: 'staffMember',
    header: 'Staff Member',
    cell: ({ row }) => row.original.staffMember?.name || 'Unassigned',
  }),
  sortable: true,
  visibleIf: (permissions) =>
    permissions.includes('appointments:read:all') ||
    permissions.includes('staff:read:all'),
} as TableColumn<Appointment>,
```

### Pattern 3: Relationship-Based Delete Validation

```typescript
deleteValidation: {
  canDelete: (appointment) => {
    // Can't delete if payment exists
    if (appointment.paymentId) {
      return {
        allowed: false,
        reason: 'Cannot delete appointment with existing payment',
        suggestedAction: 'Refund payment first, then delete appointment',
      };
    }

    // Can't delete if in progress
    if (appointment.status === 'in_progress') {
      return {
        allowed: false,
        reason: 'Cannot delete appointment that is in progress',
      };
    }

    return { allowed: true };
  },
  warningMessage: (appointment) =>
    `Delete appointment for ${appointment.clientName}? Client will be notified.`,
}
```

### Pattern 4: Complex Cell Rendering

```typescript
{
  ...columnHelper.display({
    id: 'clientInfo',
    header: 'Client',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm">
          {row.original.clientName}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.clientPhone}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.clientEmail}
        </span>
      </div>
    ),
  }),
  sortable: false,
} as TableColumn<Appointment>,
```

### Pattern 5: Status Badge with Color

```typescript
{
  ...columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const statusConfig = {
        pending: { variant: 'secondary', label: 'Pending' },
        confirmed: { variant: 'default', label: 'Confirmed' },
        in_progress: { variant: 'default', label: 'In Progress' },
        completed: { variant: 'success', label: 'Completed' },
        cancelled: { variant: 'destructive', label: 'Cancelled' },
        no_show: { variant: 'outline', label: 'No Show' },
      };

      const config = statusConfig[row.original.status] || statusConfig.pending;

      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
    enableSorting: true,
  }),
  sortable: true,
} as TableColumn<Appointment>,
```

## Troubleshooting

### Issue: Type Error in Columns

**Error**: `Type 'ColumnDef<Appointment>' is not assignable to type 'TableColumn<Appointment>'`

**Solution**: Cast to `TableColumn<Appointment>` after spreading:

```typescript
{
  ...columnHelper.accessor('name', { ... }),
  sortable: true,
} as TableColumn<Appointment>
```

### Issue: Hook Not Found

**Error**: `Cannot find name 'useAppointments'`

**Solution**: Export hook from `useAdminData.ts`:

```typescript
// apps/frontend/src/hooks/useAdminData.ts
export const useAppointments = (filters?: ResourceFilters) => { ... };
```

### Issue: Form Not Saving

**Problem**: Form submits but data not saved

**Checklist**:

1. Check mutation hook returns correct structure
2. Verify onSuccess callback invalidates queries
3. Check API endpoint is correct
4. Check form data matches DTO structure
5. Check network tab for API errors

### Issue: Permission Not Working

**Problem**: Button shows but should be hidden

**Solution**: Check permission string matches exactly:

```typescript
// ❌ Wrong
permissions: {
  create: ['appointment:create'];
}

// ✅ Correct (must match backend permission)
permissions: {
  create: ['appointments:create:all'];
}
```

### Issue: Column Not Showing

**Problem**: Column defined but not visible in table

**Checklist**:

1. Check column has `id` property
2. Check `visibleIf` is not filtering it out
3. Check accessor path is correct
4. Check entity type includes the field

## Template Files

### Minimal Configuration Template

```typescript
import { Icon } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { MyForm } from '@/components/admin/my-resource/MyForm';
import {
  useMyResources,
  useCreateMyResource,
  useUpdateMyResource,
  useDeleteMyResource,
} from '@/hooks/useAdminData';
import type { ResourceConfig, TableColumn } from '@/types/admin';
import type { MyResource, CreateMyResourceDto, UpdateMyResourceDto } from '@/lib/admin/admin.api';

const columnHelper = createColumnHelper<MyResource>();

export const myResourceConfig: ResourceConfig<
  MyResource,
  CreateMyResourceDto,
  UpdateMyResourceDto
> = {
  metadata: {
    singular: 'Resource',
    plural: 'Resources',
    icon: Icon,
    description: 'Manage resources',
  },

  permissions: {
    create: ['resources:create:all'],
    read: ['resources:read:all'],
    update: ['resources:update:all'],
    delete: ['resources:delete:all'],
  },

  hooks: {
    useList: (filters) => useMyResources(filters),
    useCreate: () => useCreateMyResource(),
    useUpdate: () => useUpdateMyResource(),
    useDelete: () => useDeleteMyResource(),
  },

  table: {
    columns: [
      {
        ...columnHelper.accessor('name', {
          id: 'name',
          header: 'Name',
          enableSorting: true,
        }),
        sortable: true,
      } as TableColumn<MyResource>,
    ],
    defaultSort: { key: 'name', direction: 'asc' },
    rowsPerPage: 10,
  },

  form: {
    component: MyForm,
    dialogSize: 'default',
  },

  search: {
    enabled: true,
    placeholder: 'Search resources...',
  },
};
```

## Next Steps

After creating your resource:

1. **Add tests**:

   ```bash
   # Create test file
   touch apps/frontend/src/config/admin/appointments.config.spec.tsx
   ```

2. **Add to navigation**:

   ```typescript
   // Add menu item in admin layout
   { icon: Calendar, label: 'Appointments', href: '/admin/appointments' }
   ```

3. **Update documentation**:

   ```bash
   # Document any custom patterns used
   # Update this quick start with lessons learned
   ```

4. **Get code review**:
   ```bash
   git add .
   git commit -m "feat(admin): add appointments resource"
   git push -u origin feature/appointments-admin
   gh pr create
   ```

## Reference

- **Architecture**: `/docs/ADMIN_CRUD_ARCHITECTURE.md`
- **Type System**: `/apps/frontend/src/types/admin.ts`
- **Example Config**: `/apps/frontend/src/config/admin/users.config.tsx`
- **ResourceManager**: `/apps/frontend/src/components/admin/common/ResourceManager.tsx`
- **DataTable**: `/apps/frontend/src/components/admin/common/DataTable.tsx`

---

**Time to Complete**: 30 minutes (with practice: 20 minutes)
**Maintainability**: High (config-based, type-safe, reusable)
**Code Reduction**: 75-93% compared to legacy approach
