# DataTable Component - Implementation Requirements

**Status**: Tests Written - Ready for Implementation
**Test File**: `/Users/anshulbisen/projects/personal/ftry/apps/frontend/src/components/admin/common/DataTable.spec.tsx`
**Test Results**: 65 tests failing, 6 tests passing (basic edge cases)
**Lines of Test Code**: 1,115 lines

---

## Overview

The DataTable component requires a complete rewrite to use **@tanstack/react-table v8.21.3** with comprehensive features for sorting, filtering, pagination, and row selection. All tests have been written FIRST following TDD principles.

---

## Component API Requirements

### TypeScript Interface

```typescript
import { ColumnDef } from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[]; // TanStack Table column definitions
  loading?: boolean;
  emptyMessage?: string;
  searchableFields?: string[]; // Fields to search across
  onRowClick?: (item: T) => void;
  enableRowSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}
```

### Key Differences from Current Implementation

**CURRENT** (lines 14-27 in DataTable.tsx):

```typescript
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}
```

**REQUIRED**: Use TanStack Table's `ColumnDef` instead of custom Column interface.

---

## Feature Requirements

### 1. Rendering (10 tests)

#### Basic Rendering

- ✅ Render table with proper HTML table structure
- ✅ Render all column headers from `ColumnDef`
- ✅ Render all data rows
- ✅ Support custom cell rendering via `ColumnDef.cell`
- ✅ Render table wrapper with proper classes

#### Loading State

- ✅ Show loading state when `loading={true}`
- ✅ Display loading skeleton with table structure
- ✅ Hide table content during loading
- ✅ Add `aria-live="polite"` to loading element

#### Empty State

- ✅ Show "No data available" by default when `data={[]}`
- ✅ Show custom message via `emptyMessage` prop
- ✅ Add `role="status"` to empty state element
- ✅ Hide table when no data

**Implementation Tip**: Use shadcn/ui Table components as base primitives.

---

### 2. Sorting (14 tests)

#### Single Column Sorting

- ✅ Sort ascending on first click
- ✅ Sort descending on second click
- ✅ Clear sort on third click (return to original order)
- ✅ Display visual sort indicators (arrows/icons)
- ✅ Add `aria-sort="ascending"` or `"descending"` to sorted column header
- ✅ Make sortable headers clickable with pointer cursor

#### Multi-Column Sorting

- ✅ Support Shift+Click for multi-column sorting
- ✅ Clear previous sort when clicking without Shift
- ✅ Maintain multiple sort states simultaneously

#### Sort State Management

- ✅ Maintain sort state when data updates
- ✅ Apply sort to new data automatically
- ✅ Disable sorting when `enableSorting={false}`

**Implementation Tip**: Use TanStack Table's `getSortedRowModel()` and column sort state.

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableSorting: enableSorting,
  enableMultiSort: true,
});
```

---

### 3. Search/Filtering (8 tests)

#### Search Input

- ✅ Render search input when `enableFiltering={true}`
- ✅ Placeholder text: "Search..."
- ✅ Add `aria-label` for accessibility

#### Search Functionality

- ✅ Filter data based on search input
- ✅ Search across all fields specified in `searchableFields` prop
- ✅ Case-insensitive search
- ✅ Show "No results found" when search has no matches
- ✅ Clear search restores all data

#### Performance

- ✅ Debounce search input (300-500ms recommended)
- ✅ Avoid re-filtering on every keystroke

**Implementation Tip**: Use TanStack Table's global filtering feature.

```typescript
const [globalFilter, setGlobalFilter] = useState('');

const table = useReactTable({
  data,
  columns,
  state: {
    globalFilter,
  },
  onGlobalFilterChange: setGlobalFilter,
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: 'includesString',
});
```

For custom filtering across specific fields:

```typescript
const filteredData = useMemo(() => {
  if (!globalFilter || !searchableFields) return data;

  return data.filter((row) =>
    searchableFields.some((field) =>
      String(row[field as keyof T])
        .toLowerCase()
        .includes(globalFilter.toLowerCase()),
    ),
  );
}, [data, globalFilter, searchableFields]);
```

---

### 4. Pagination (13 tests)

#### Pagination Controls

- ✅ Render pagination controls when `enablePagination={true}`
- ✅ Display "Page X of Y" text
- ✅ Render Previous/Next buttons
- ✅ Add `aria-label` to pagination buttons

#### Page Navigation

- ✅ Navigate to next page on Next button click
- ✅ Navigate to previous page on Previous button click
- ✅ Disable Previous button on first page
- ✅ Disable Next button on last page
- ✅ Show correct page count

#### Page Size Selector

- ✅ Render page size selector (combobox)
- ✅ Options: [5, 10, 20, 50, 100]
- ✅ Label: "Rows per page"
- ✅ Change rows displayed when size changes

#### Pagination Behavior

- ✅ Show correct number of rows per page
- ✅ Update page count when data changes
- ✅ Reset to page 1 when search filters results
- ✅ Maintain selection across pages

**Implementation Tip**: Use TanStack Table's pagination feature.

```typescript
const table = useReactTable({
  data,
  columns,
  state: {
    pagination: {
      pageIndex: 0,
      pageSize: pageSize || 10,
    },
  },
  getPaginationRowModel: getPaginationRowModel(),
  manualPagination: false,
});
```

Pagination UI:

```typescript
<div className="flex items-center justify-between">
  <Button
    onClick={() => table.previousPage()}
    disabled={!table.getCanPreviousPage()}
    aria-label="Previous page"
  >
    Previous
  </Button>

  <span>
    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
  </span>

  <Button
    onClick={() => table.nextPage()}
    disabled={!table.getCanNextPage()}
    aria-label="Next page"
  >
    Next
  </Button>
</div>
```

---

### 5. Row Selection (9 tests)

#### Selection Checkboxes

- ✅ Render checkboxes when `enableRowSelection={true}`
- ✅ Add checkbox column as first column
- ✅ Render header checkbox for "Select All"
- ✅ Add `aria-label` to all checkboxes

#### Selection Behavior

- ✅ Select individual row on checkbox click
- ✅ Check/uncheck row checkbox
- ✅ Select all rows on header checkbox click
- ✅ Deselect all rows on second header click
- ✅ Show indeterminate state when some rows selected

#### Visual Feedback

- ✅ Highlight selected rows with `data-state="selected"`
- ✅ Apply visual styling (background color change)

#### Selection State

- ✅ Maintain selection across pagination
- ✅ Persist selection when navigating between pages

**Implementation Tip**: Use TanStack Table's row selection feature.

```typescript
const [rowSelection, setRowSelection] = useState({});

const columns = useMemo<ColumnDef<T>[]>(() => {
  if (!enableRowSelection) return baseColumns;

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
    },
    ...baseColumns,
  ];
}, [enableRowSelection, baseColumns]);

const table = useReactTable({
  data,
  columns,
  state: {
    rowSelection,
  },
  onRowSelectionChange: setRowSelection,
  enableRowSelection: true,
  getCoreRowModel: getCoreRowModel(),
});
```

---

### 6. Row Click (5 tests)

- ✅ Call `onRowClick(item)` when row is clicked
- ✅ Pass correct row data to callback
- ✅ Add `cursor-pointer` class when `onRowClick` is provided
- ✅ Add hover effect (`hover:bg-muted/50`)
- ✅ Do NOT trigger `onRowClick` when clicking checkbox

**Implementation Tip**:

```typescript
<TableRow
  onClick={onRowClick ? (e) => {
    // Don't trigger if clicking checkbox
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
    onRowClick(row.original);
  } : undefined}
  className={cn(
    onRowClick && 'cursor-pointer hover:bg-muted/50',
    row.getIsSelected() && 'bg-muted'
  )}
  data-state={row.getIsSelected() ? 'selected' : undefined}
>
```

---

### 7. Accessibility (11 tests)

#### Semantic HTML

- ✅ Use proper `<table>` element with `role="table"`
- ✅ Use `<th>` with `role="columnheader"`
- ✅ Use `<tr>` with `role="row"`
- ✅ Use `<thead>`, `<tbody>` elements

#### ARIA Attributes

- ✅ Add `aria-sort` to sorted column headers
- ✅ Add `aria-label` to search input
- ✅ Add `aria-label` to pagination buttons
- ✅ Add `aria-label` to checkboxes
- ✅ Add `aria-live="polite"` to loading state
- ✅ Add `role="status"` to empty state

#### Keyboard Navigation

- ✅ Support Enter key on sortable headers
- ✅ Support Tab navigation
- ✅ Support Enter/Space on pagination buttons
- ✅ Focus management for interactive elements

**Accessible Name Requirements**:

- Header checkbox: "Select all"
- Row checkboxes: "Select row {index}"
- Search input: "Search table"
- Previous button: "Previous page"
- Next button: "Next page"

---

### 8. Performance (2 tests)

#### Large Datasets

- ✅ Handle 1000+ items efficiently
- ✅ Render in < 1 second
- ✅ Use pagination to limit rendered rows
- ✅ Virtualize rows when pagination is disabled (optional enhancement)

#### Optimization Techniques

- Use `useMemo` for computed values
- Use `useCallback` for event handlers
- Avoid unnecessary re-renders
- Consider React.memo for row components if needed

**Implementation Tip**:

```typescript
const columns = useMemo(() => createColumns(), []);
const data = useMemo(() => fetchedData, [fetchedData]);

const handleRowClick = useCallback(
  (row: T) => {
    onRowClick?.(row);
  },
  [onRowClick],
);
```

---

### 9. Edge Cases (6 tests)

- ✅ Handle empty `columns={[]}` array
- ✅ Handle `data={null}` or `data={undefined}`
- ✅ Handle missing `accessorKey` in column definition
- ✅ Handle very long text in cells (truncate or wrap)
- ✅ Handle special characters (HTML escaping)
- ✅ Handle rapid prop changes without crashing

---

## Styling Requirements

### Use shadcn/ui Components

Import and use the following shadcn components:

```typescript
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
```

### Required CSS Classes

**Table Container**:

```css
.overflow-x-auto - horizontal scroll for responsive
.w-full - full width
```

**Selected Row**:

```css
data-state="selected" - attribute for selected rows
.bg-muted - background for selected rows
```

**Sortable Header**:

```css
.cursor-pointer - pointer on sortable headers
.select-none - prevent text selection
.hover:bg-muted/50 - hover effect
```

**Clickable Row**:

```css
.cursor-pointer - pointer on clickable rows
.hover:bg-muted/50 - hover effect
```

**Sort Indicators**:
Use Lucide React icons:

```typescript
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

// In column header
{column.getIsSorted() === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
{column.getIsSorted() === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
{!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
```

---

## Component Structure

### Recommended File Organization

```typescript
// DataTable.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
// ... imports

export interface DataTableProps<T> { /* ... */ }

export function DataTable<T>({
  data,
  columns,
  loading,
  emptyMessage,
  searchableFields,
  onRowClick,
  enableRowSelection,
  enableSorting,
  enableFiltering,
  enablePagination,
  pageSize = 10,
}: DataTableProps<T>) {
  // State
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  // Memoize columns with selection
  const tableColumns = useMemo(() => {
    // Add selection column if enabled
  }, [columns, enableRowSelection]);

  // Filter data if searchableFields provided
  const filteredData = useMemo(() => {
    // Custom filtering logic
  }, [data, globalFilter, searchableFields]);

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
    enableRowSelection,
    enableMultiSort: true,
  });

  // Loading state
  if (loading) {
    return (
      <div aria-live="polite" className="text-center py-8">
        Loading...
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div role="status" className="text-center py-8 text-muted-foreground">
        {emptyMessage || 'No data available'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      {enableFiltering && (
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          aria-label="Search table"
          className="max-w-sm"
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        header.column.getToggleSortingHandler()?.(e as any);
                      }
                    }}
                    className={cn(
                      enableSorting && header.column.getCanSort() && 'cursor-pointer select-none',
                    )}
                    aria-sort={
                      header.column.getIsSorted()
                        ? header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={(e) => {
                  if (onRowClick && !(e.target as HTMLElement).closest('[role="checkbox"]')) {
                    onRowClick(row.original);
                  }
                }}
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
    </div>
  );
}
```

---

## Testing Strategy

### Run Tests After Implementation

```bash
# Run only DataTable tests
nx test frontend --testNamePattern="DataTable"

# Run with coverage
nx test frontend --testNamePattern="DataTable" --coverage

# Watch mode during development
nx test frontend --testNamePattern="DataTable" --watch
```

### Expected Results After Implementation

- All 71 tests should pass (65 currently failing + 6 passing)
- No TypeScript errors
- No console warnings
- Coverage > 80%

---

## Dependencies Required

All dependencies are already installed:

```json
{
  "@tanstack/react-table": "^8.21.3",
  "@tanstack/react-virtual": "^3.13.12",
  "lucide-react": "^0.545.0",
  "@radix-ui/react-checkbox": "^1.3.3",
  "@radix-ui/react-select": "^2.2.6"
}
```

shadcn/ui components needed (check if already installed):

- Table ✅ (already exists)
- Button ✅
- Input ✅
- Checkbox ✅
- Select ✅

---

## Implementation Checklist

- [ ] Replace custom `Column<T>` interface with TanStack's `ColumnDef<T>`
- [ ] Add TanStack Table core setup with `useReactTable`
- [ ] Implement sorting with visual indicators
- [ ] Implement global filtering with debounce
- [ ] Implement pagination with controls
- [ ] Implement row selection with checkboxes
- [ ] Add loading state with skeleton
- [ ] Add empty state with custom message
- [ ] Add all accessibility attributes (aria-sort, aria-label, etc.)
- [ ] Add keyboard navigation support
- [ ] Handle row click with checkbox exclusion
- [ ] Add responsive styling
- [ ] Optimize performance with useMemo/useCallback
- [ ] Handle all edge cases (null data, empty columns, etc.)
- [ ] Run tests and fix any failures
- [ ] Verify TypeScript types
- [ ] Test with large datasets (1000+ items)

---

## Next Steps

1. **Implement the component** following this specification
2. **Run tests frequently** to ensure requirements are met
3. **Fix failing tests** one by one
4. **Refactor** for code quality while keeping tests green
5. **Document usage** in component comments/JSDoc
6. **Create examples** showing how to use with real data

---

## Success Criteria

✅ All 71 tests passing
✅ No TypeScript errors
✅ No console warnings
✅ Proper accessibility (ARIA attributes)
✅ Responsive design
✅ Performance optimized
✅ Code follows project conventions

---

**Generated**: 2025-10-10
**Test-Driven Development**: Tests written FIRST ✅
**Ready for Implementation**: YES ✅
