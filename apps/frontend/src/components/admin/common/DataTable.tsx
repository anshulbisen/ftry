/**
 * DataTable Component
 *
 * Enhanced data table component using @tanstack/react-table v8.21.3
 * with comprehensive features for sorting, filtering, pagination, and row selection.
 *
 * @features
 * - Column sorting (single and multi-column with Shift)
 * - Global search across searchableFields
 * - Pagination with size selector
 * - Row selection (optional)
 * - Loading states
 * - Empty states
 * - Row click handling
 * - Responsive design
 * - Full accessibility support (ARIA attributes)
 *
 * @performance
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - All callback props (onRowClick, etc.) should be wrapped in useCallback
 * - Expensive computations are internally memoized with useMemo
 *
 * @important All callback props must be memoized to prevent unnecessary re-renders:
 *
 * @example
 * ```tsx
 * // ✅ CORRECT - Memoized callback
 * const handleRowClick = useCallback((row: User) => {
 *   navigate(`/users/${row.id}`);
 * }, [navigate]);
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   onRowClick={handleRowClick}
 * />
 *
 * // ❌ WRONG - Inline function causes re-renders
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   onRowClick={(row) => navigate(`/users/${row.id}`)}
 * />
 * ```
 *
 * @implements TanStack React Table v8.21.3
 * @implements shadcn/ui components
 */

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
} from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/**
 * DataTable Props Interface
 */
export interface DataTableProps<T> {
  /** Array of data to display in the table */
  data: T[] | null | undefined;
  /** TanStack Table column definitions */
  columns: Array<ColumnDef<T>>;
  /** Show loading state */
  loading?: boolean;
  /** Custom message when no data is available */
  emptyMessage?: string;
  /** Fields to search across for global filtering */
  searchableFields?: string[];
  /** Callback when a row is clicked */
  onRowClick?: (item: T) => void;
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean;
  /** Enable column sorting */
  enableSorting?: boolean;
  /** Enable global filtering/search */
  enableFiltering?: boolean;
  /** Enable pagination controls */
  enablePagination?: boolean;
  /** Number of rows per page (default: 10) */
  pageSize?: number;
}

/**
 * Enhanced DataTable Component with TanStack Table
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'email', header: 'Email' },
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   enableSorting
 *   enableFiltering
 *   enablePagination
 *   searchableFields={['name', 'email']}
 *   onRowClick={(user) => console.log(user)}
 * />
 * ```
 */
export const DataTable = memo(function DataTable<T extends Record<string, unknown>>({
  data: rawData,
  columns: baseColumns,
  loading = false,
  emptyMessage = 'No data available',
  searchableFields = [],
  onRowClick,
  enableRowSelection = false,
  enableSorting = false,
  enableFiltering = false,
  enablePagination = false,
  pageSize: initialPageSize = 10,
}: DataTableProps<T>) {
  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Debounce global filter for performance
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);

    return () => clearTimeout(timeout);
  }, [globalFilter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedGlobalFilter]);

  // Normalize data (handle null/undefined)
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }
    return rawData;
  }, [rawData]);

  // Filter data based on searchableFields
  const filteredData = useMemo(() => {
    if (!debouncedGlobalFilter || searchableFields.length === 0) {
      return data;
    }

    const lowerFilter = debouncedGlobalFilter.toLowerCase();

    return data.filter((row) =>
      searchableFields.some((field) => {
        const value = row[field];
        return String(value ?? '')
          .toLowerCase()
          .includes(lowerFilter);
      }),
    );
  }, [data, debouncedGlobalFilter, searchableFields]);

  // Add selection column if enabled
  const columns = useMemo<Array<ColumnDef<T>>>(() => {
    if (!enableRowSelection) {
      return baseColumns;
    }

    const selectionColumn: ColumnDef<T> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          ref={(el) => {
            if (el) {
              const checkbox = el as unknown as HTMLInputElement;
              checkbox.indeterminate =
                table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectionColumn, ...baseColumns];
  }, [enableRowSelection, baseColumns]);

  // Handle row click (exclude checkbox clicks)
  const handleRowClick = useCallback(
    (row: T, event: React.MouseEvent<HTMLTableRowElement>) => {
      // Don't trigger row click if clicking checkbox
      const target = event.target as HTMLElement;
      if (
        target.closest('[role="checkbox"]') ||
        target.closest('button[role="checkbox"]') ||
        target.tagName === 'INPUT'
      ) {
        return;
      }

      onRowClick?.(row);
    },
    [onRowClick],
  );

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: debouncedGlobalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setDebouncedGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
    enableRowSelection,
    enableMultiSort: true,
    manualPagination: false,
  });

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground" aria-live="polite">
        Loading...
      </div>
    );
  }

  // Empty state (no data at all)
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" role="status">
        {emptyMessage}
      </div>
    );
  }

  // No results after filtering
  const hasNoResults = filteredData.length === 0 && debouncedGlobalFilter !== '';

  return (
    <div className="space-y-4">
      {/* Search Input */}
      {enableFiltering && (
        <div className="flex items-center">
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            aria-label="Search table"
            className="max-w-sm"
          />
        </div>
      )}

      {/* No Results Message */}
      {hasNoResults && (
        <div className="text-center py-8 text-muted-foreground" role="status">
          No results found
        </div>
      )}

      {/* Table */}
      {!hasNoResults && (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const canSort = enableSorting && header.column.getCanSort();
                      const sortDirection = header.column.getIsSorted();

                      return (
                        <TableHead
                          key={header.id}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          onKeyDown={(e) => {
                            if (canSort && e.key === 'Enter') {
                              const handler = header.column.getToggleSortingHandler();
                              if (handler) {
                                handler(e as React.KeyboardEvent<HTMLTableCellElement>);
                              }
                            }
                          }}
                          className={cn(canSort && 'cursor-pointer select-none hover:bg-muted/50')}
                          aria-sort={
                            sortDirection
                              ? sortDirection === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : undefined
                          }
                          tabIndex={canSort ? 0 : undefined}
                        >
                          <div className="flex items-center">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              <span className="ml-2">
                                {sortDirection === 'asc' && <ArrowUp className="h-4 w-4" />}
                                {sortDirection === 'desc' && <ArrowDown className="h-4 w-4" />}
                                {!sortDirection && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={onRowClick ? (e) => handleRowClick(row.original, e) : undefined}
                      className={cn(
                        onRowClick && 'cursor-pointer hover:bg-muted/50',
                        row.getIsSelected() && 'bg-muted',
                      )}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {enablePagination && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
                <Select
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="w-[70px]" aria-label="Rows per page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Previous page"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Next page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}) as <T extends Record<string, unknown>>(
  props: DataTableProps<T>,
) => React.JSX.Element & { displayName?: string };

(DataTable as unknown as { displayName: string }).displayName = 'DataTable';
