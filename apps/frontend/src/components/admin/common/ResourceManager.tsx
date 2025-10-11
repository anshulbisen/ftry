/**
 * ResourceManager Component
 *
 * Generic admin CRUD interface component driven by ResourceConfig.
 * Replaces duplicated *Management components with a declarative configuration approach.
 *
 * @features
 * - Permission-gated CRUD operations
 * - Configurable table with custom columns
 * - Search and filtering (when configured)
 * - Custom actions beyond standard CRUD
 * - Delete validation with user-friendly messages
 * - Form dialog management (create/edit)
 * - Full TypeScript generics for type safety
 *
 * @example
 * ```tsx
 * <ResourceManager config={userResourceConfig} />
 * ```
 *
 * @see apps/frontend/src/types/admin.ts - Type definitions
 * @see apps/frontend/src/types/admin.README.md - Architecture documentation
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Input } from '@/components/ui/input';
import { DataTable } from './DataTable';
import { PermissionGate } from './PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import type { ResourceConfig, Entity, CustomAction } from '@/types/admin';

/**
 * ResourceManager Props
 */
export interface ResourceManagerProps<TEntity extends Entity, TCreateInput, TUpdateInput> {
  /** Resource configuration object defining all CRUD behavior */
  config: ResourceConfig<TEntity, TCreateInput, TUpdateInput>;
}

/**
 * ResourceManager Component
 *
 * Core wrapper component that provides complete CRUD functionality
 * based on a ResourceConfig object.
 */
export function ResourceManager<
  TEntity extends Entity,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>,
>({ config }: ResourceManagerProps<TEntity, TCreateInput, TUpdateInput>) {
  // Hooks
  const { permissions, hasAnyPermission } = usePermissions();

  // State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<TEntity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<TEntity | null>(null);
  const [customActionState, setCustomActionState] = useState<{
    action: CustomAction<TEntity>;
    entity: TEntity;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data using config hooks
  const { data: entities = [], isLoading, error } = config.hooks.useList();

  // Mutations
  const { mutate: createEntity, isPending: isCreating } = config.hooks.useCreate();
  const { mutate: updateEntity, isPending: isUpdating } = config.hooks.useUpdate();
  const { mutate: deleteEntity, isPending: isDeleting } = config.hooks.useDelete();

  // Filter columns based on visibility permissions
  const visibleColumns = useMemo(() => {
    return config.table.columns.filter((col) => {
      if (!col.meta?.visibleIf) return true;
      return col.meta.visibleIf(permissions);
    });
  }, [config.table.columns, permissions]);

  // Table columns are already pure ColumnDef objects with typed meta
  const tableColumns = useMemo<Array<ColumnDef<TEntity>>>(() => {
    // Columns are already pure ColumnDef<TEntity> objects
    // TanStack Table ignores the meta property for internal processing
    const dataColumns: Array<ColumnDef<TEntity>> = [...visibleColumns];

    // Add actions column if user has update/delete permissions or custom actions
    const hasUpdatePerm = config.permissions.update
      ? hasAnyPermission(config.permissions.update)
      : false;
    const hasDeletePerm = config.permissions.delete
      ? hasAnyPermission(config.permissions.delete)
      : false;
    const hasRowActions =
      config.customActions?.some((action) => action.location.includes('row')) ?? false;

    if (hasUpdatePerm || hasDeletePerm || hasRowActions) {
      const actionsColumn: ColumnDef<TEntity> = {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => renderRowActions(row.original),
        enableSorting: false,
      };
      dataColumns.push(actionsColumn);
    }

    return dataColumns;
  }, [visibleColumns, config.permissions, config.customActions, hasAnyPermission]);

  /**
   * Render row action menu
   */
  const renderRowActions = useCallback(
    (entity: TEntity) => {
      const hasUpdatePerm = config.permissions.update
        ? hasAnyPermission(config.permissions.update)
        : false;
      const hasDeletePerm = config.permissions.delete
        ? hasAnyPermission(config.permissions.delete)
        : false;

      // Filter custom actions for row location
      const rowCustomActions =
        config.customActions?.filter((action) => {
          // Must be in 'row' location
          if (!action.location.includes('row')) return false;

          // Check permissions
          if (action.permissions && !hasAnyPermission(action.permissions)) {
            return false;
          }

          // Check conditional visibility
          if (action.shouldShow && !action.shouldShow(entity)) {
            return false;
          }

          return true;
        }) ?? [];

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasUpdatePerm && (
              <DropdownMenuItem onClick={() => handleEdit(entity)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {hasDeletePerm && (
              <DropdownMenuItem onClick={() => handleDelete(entity)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
            {rowCustomActions.length > 0 && (hasUpdatePerm || hasDeletePerm) && (
              <DropdownMenuSeparator />
            )}
            {rowCustomActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={async () => handleCustomAction(action, entity)}
                className={action.variant === 'destructive' ? 'text-destructive' : undefined}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [config.permissions, config.customActions, hasAnyPermission],
  );

  /**
   * Handle create button click
   */
  const handleCreate = useCallback(() => {
    setShowCreateDialog(true);
  }, []);

  /**
   * Handle edit action
   */
  const handleEdit = useCallback((entity: TEntity) => {
    setEditingEntity(entity);
  }, []);

  /**
   * Handle delete action
   */
  const handleDelete = useCallback(
    (entity: TEntity) => {
      // Run delete validation if configured
      if (config.deleteValidation) {
        const validation = config.deleteValidation.canDelete(entity);
        if (!validation.allowed) {
          toast.error(validation.reason || 'Cannot delete this item');
          if (validation.suggestedAction) {
            toast.info(validation.suggestedAction);
          }
          return;
        }
      }

      setDeletingEntity(entity);
    },
    [config.deleteValidation],
  );

  /**
   * Confirm delete operation
   */
  const confirmDelete = useCallback(() => {
    if (!deletingEntity) return;

    deleteEntity(deletingEntity.id, {
      onSuccess: () => {
        toast.success(`${config.metadata.singular} deleted successfully`);
        setDeletingEntity(null);
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete ${config.metadata.singular.toLowerCase()}: ${error.message}`);
      },
    });
  }, [deletingEntity, deleteEntity, config.metadata]);

  /**
   * Handle custom action execution
   */
  const handleCustomAction = useCallback(
    async (action: CustomAction<TEntity>, entity: TEntity) => {
      // Show confirmation dialog if configured
      if (action.confirmation) {
        setCustomActionState({ action, entity });
        return;
      }

      // Execute action directly
      try {
        await action.handler(entity, config.hooks.custom || {});
        toast.success(`${action.label} completed successfully`);
      } catch (error) {
        toast.error(`Failed to ${action.label.toLowerCase()}: ${(error as Error).message}`);
      }
    },
    [config.hooks.custom],
  );

  /**
   * Confirm custom action execution
   */
  const confirmCustomAction = useCallback(async () => {
    if (!customActionState) return;

    const { action, entity } = customActionState;

    try {
      await action.handler(entity, config.hooks.custom || {});
      toast.success(`${action.label} completed successfully`);
      setCustomActionState(null);
    } catch (error) {
      toast.error(`Failed to ${action.label.toLowerCase()}: ${(error as Error).message}`);
    }
  }, [customActionState, config.hooks.custom]);

  /**
   * Close form dialog
   */
  const handleCloseForm = useCallback(() => {
    setShowCreateDialog(false);
    setEditingEntity(null);
  }, []);

  /**
   * Handle form success
   */
  const handleFormSuccess = useCallback(
    (entity: TEntity) => {
      toast.success(
        `${config.metadata.singular} ${editingEntity ? 'updated' : 'created'} successfully`,
      );
      handleCloseForm();
    },
    [config.metadata, editingEntity, handleCloseForm],
  );

  // Get form dialog title
  const getDialogTitle = useCallback(() => {
    if (config.form.getDialogTitle) {
      return config.form.getDialogTitle(editingEntity || undefined);
    }
    return editingEntity ? `Edit ${config.metadata.singular}` : `Add ${config.metadata.singular}`;
  }, [config.form, config.metadata, editingEntity]);

  // Get custom action confirmation details
  const getCustomActionConfirmation = useCallback(() => {
    if (!customActionState) return null;

    const { action, entity } = customActionState;
    const conf = action.confirmation!;

    return {
      title: typeof conf.title === 'function' ? conf.title(entity) : conf.title,
      description:
        typeof conf.description === 'function' ? conf.description(entity) : conf.description,
      confirmText: conf.confirmText || 'Confirm',
      cancelText: conf.cancelText || 'Cancel',
      variant: conf.variant || 'default',
    };
  }, [customActionState]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{config.metadata.loadingMessage || 'Loading...'}</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">
          {config.metadata.errorMessagePrefix || 'Failed to load data'}: {error.message}
        </p>
      </div>
    );
  }

  // Render form component
  const FormComponent = config.form.component;
  const isFormOpen = showCreateDialog || !!editingEntity;

  // Custom action confirmation
  const actionConfirmation = getCustomActionConfirmation();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {config.metadata.icon && <config.metadata.icon className="h-6 w-6 text-foreground" />}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {config.metadata.plural}
            </h1>
          </div>
          {config.metadata.description && (
            <p className="text-muted-foreground mt-1">{config.metadata.description}</p>
          )}
        </div>
        {config.permissions.create && (
          <PermissionGate permissions={config.permissions.create}>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add {config.metadata.singular}
            </Button>
          </PermissionGate>
        )}
      </div>

      {/* Search */}
      {config.search?.enabled && (
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder={
              config.search.placeholder || `Search ${config.metadata.plural.toLowerCase()}...`
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={entities}
        columns={tableColumns}
        loading={isLoading}
        emptyMessage={
          config.metadata.emptyMessage || `No ${config.metadata.plural.toLowerCase()} found`
        }
        searchableFields={config.search?.searchableFields}
        enableSorting={config.table.columns.some((col) => col.meta?.sortable)}
        enableFiltering={config.search?.enabled}
        enablePagination={true}
        pageSize={config.table.rowsPerPage || 10}
        onRowClick={config.table.onRowClick}
      />

      {/* Create/Edit Form Dialog */}
      {isFormOpen && (
        <FormComponent
          entity={editingEntity || undefined}
          open={isFormOpen}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          initialData={config.form.defaultValues}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingEntity && (
        <AlertDialog open={!!deletingEntity} onOpenChange={() => setDeletingEntity(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {config.deleteValidation?.warningMessage
                  ? typeof config.deleteValidation.warningMessage === 'function'
                    ? config.deleteValidation.warningMessage(deletingEntity)
                    : config.deleteValidation.warningMessage
                  : `This will permanently delete this ${config.metadata.singular.toLowerCase()}. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Custom Action Confirmation Dialog */}
      {actionConfirmation && (
        <AlertDialog open={!!customActionState} onOpenChange={() => setCustomActionState(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionConfirmation.title}</AlertDialogTitle>
              <AlertDialogDescription>{actionConfirmation.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{actionConfirmation.cancelText}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCustomAction}
                className={
                  actionConfirmation.variant === 'destructive'
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : undefined
                }
              >
                {actionConfirmation.confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

/**
 * Display name for debugging
 */
ResourceManager.displayName = 'ResourceManager';
