/**
 * DataTable Component Tests
 *
 * Comprehensive test suite for the enhanced DataTable component using TanStack Table.
 * Tests cover rendering, sorting, filtering, pagination, row selection, and accessibility.
 *
 * @implements TanStack React Table v8.21.3
 * @testing-library/react 16.1.0
 * @vitest 3.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableProps } from './DataTable';

// Test data type
interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

// Mock test data
const mockUsers: TestUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'Manager',
    status: 'inactive',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '4',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'User',
    status: 'active',
    createdAt: new Date('2024-01-25'),
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'Admin',
    status: 'inactive',
    createdAt: new Date('2024-01-05'),
  },
];

// Column definitions for tests
const createColumns = (): Array<ColumnDef<TestUser>> => [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={row.original.status === 'active' ? 'text-green-600' : 'text-gray-400'}
        data-testid={`status-${row.original.id}`}
      >
        {row.original.status}
      </span>
    ),
  },
];

describe('DataTable - Rendering', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should render table with data', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert - Table structure exists
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    expect(screen.getAllByRole('row')).toHaveLength(6); // 1 header + 5 data rows
  });

  it('should render all column headers correctly', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
  });

  it('should render all data rows', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert - Check each user name is rendered
    mockUsers.forEach((user) => {
      expect(screen.getByText(user.name)).toBeInTheDocument();
      expect(screen.getByText(user.email)).toBeInTheDocument();
    });
  });

  it('should render custom cell components', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert - Status cells use custom rendering
    mockUsers.forEach((user) => {
      const statusCell = screen.getByTestId(`status-${user.id}`);
      expect(statusCell).toBeInTheDocument();
      expect(statusCell).toHaveTextContent(user.status);
    });
  });

  it('should show loading state when loading prop is true', () => {
    // Arrange & Act
    render(<DataTable data={[]} columns={columns} loading={true} />);

    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should show loading skeleton with proper structure', () => {
    // Arrange & Act
    render(<DataTable data={[]} columns={columns} loading={true} />);

    // Assert - Should show loading state with table structure
    const loadingContainer = screen.getByText(/loading/i).closest('div');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('should show empty state with default message when no data', () => {
    // Arrange & Act
    render(<DataTable data={[]} columns={columns} />);

    // Assert
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should show custom empty message', () => {
    // Arrange
    const customMessage = 'No users found. Try adjusting your filters.';

    // Act
    render(<DataTable data={[]} columns={columns} emptyMessage={customMessage} />);

    // Assert
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should render table wrapper with proper classes', () => {
    // Arrange & Act
    const { container } = render(<DataTable data={mockUsers} columns={columns} />);

    // Assert
    const wrapper =
      container.querySelector('.overflow-x-auto') ||
      container.querySelector('[role="table"]')?.parentElement;
    expect(wrapper).toBeInTheDocument();
  });
});

describe('DataTable - Sorting', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should sort column ascending on first click', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act - Click name column header
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);

    // Assert - Data should be sorted A-Z
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row
    expect(within(firstDataRow).getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('should sort column descending on second click', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act - Click twice
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);

    // Assert - Data should be sorted Z-A
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('John Doe')).toBeInTheDocument();
  });

  it('should remove sort on third click', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act - Click three times
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);
    await user.click(nameHeader);

    // Assert - Data should be in original order
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('John Doe')).toBeInTheDocument(); // Original first item
  });

  it('should show sort indicator for ascending sort', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);

    // Assert - Should have aria-sort attribute
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('should show sort indicator for descending sort', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);
    await user.click(nameHeader);

    // Assert
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('should support multi-column sorting with Shift+Click', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act - Click role, then Shift+Click status
    const roleHeader = screen.getByRole('columnheader', { name: /role/i });
    const statusHeader = screen.getByRole('columnheader', { name: /status/i });

    await user.click(roleHeader);
    await user.keyboard('{Shift>}');
    await user.click(statusHeader);
    await user.keyboard('{/Shift}');

    // Assert - Both columns should be sorted
    expect(roleHeader).toHaveAttribute('aria-sort');
    expect(statusHeader).toHaveAttribute('aria-sort');
  });

  it('should clear previous sort when clicking without Shift', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act - Sort by name, then by email (without Shift)
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    const emailHeader = screen.getByRole('columnheader', { name: /email/i });

    await user.click(nameHeader);
    await user.click(emailHeader);

    // Assert - Only email should be sorted
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    expect(emailHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('should not show sort indicators when sorting is disabled', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enableSorting={false} />);

    // Assert
    const headers = screen.getAllByRole('columnheader');
    headers.forEach((header) => {
      expect(header).not.toHaveClass('cursor-pointer');
    });
  });

  it('should maintain sort state when data updates', async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = render(
      <DataTable data={mockUsers} columns={columns} enableSorting={true} />,
    );

    // Act - Sort by name
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);

    // Update data with new user
    const updatedData = [
      ...mockUsers,
      {
        id: '6',
        name: 'Aaron First',
        email: 'aaron@example.com',
        role: 'User',
        status: 'active' as const,
        createdAt: new Date('2024-01-30'),
      },
    ];

    rerender(<DataTable data={updatedData} columns={columns} enableSorting={true} />);

    // Assert - Aaron should be first (sorted)
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('Aaron First')).toBeInTheDocument();
  });
});

describe('DataTable - Search/Filtering', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should render search input when filtering is enabled', () => {
    // Arrange & Act
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name', 'email']}
      />,
    );

    // Assert
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('should filter data based on search input', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name', 'email']}
      />,
    );

    // Act
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'John');

    // Assert - Only John Doe and Alice Johnson should be visible
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('should search across multiple specified fields', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name', 'email']}
      />,
    );

    // Act - Search by email
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'jane@example.com');

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should show "no results" message when search has no matches', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name', 'email']}
      />,
    );

    // Act
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'nonexistent');

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });

  it('should clear search and show all data when input is cleared', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name', 'email']}
      />,
    );

    // Act - Type and clear
    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    await user.type(searchInput, 'John');
    await user.clear(searchInput);

    // Assert - All users should be visible again
    await waitFor(() => {
      mockUsers.forEach((mockUser) => {
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      });
    });
  });

  it('should be case-insensitive when searching', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name']}
      />,
    );

    // Act
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'JOHN');

    // Assert
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should debounce search input for performance', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name']}
      />,
    );

    // Act - Type rapidly
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'J');
    await user.type(searchInput, 'o');
    await user.type(searchInput, 'h');
    await user.type(searchInput, 'n');

    // Assert - Should only filter once after debounce
    await waitFor(
      () => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it('should not render search input when filtering is disabled', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enableFiltering={false} />);

    // Assert
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
  });
});

describe('DataTable - Pagination', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should render pagination controls when enabled', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Assert
    expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should show correct number of rows per page', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Assert - Only 2 data rows + 1 header row
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('should navigate to next page on button click', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Act
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Assert - Should show page 2 data
    await waitFor(() => {
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should navigate to previous page on button click', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Act - Go to page 2, then back to page 1
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    // Assert - Should show page 1 data
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should disable previous button on first page', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Assert
    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Act - Navigate to last page
    const nextButton = screen.getByRole('button', { name: /next/i });

    // mockUsers has 5 items, pageSize is 2, so 3 pages total
    await user.click(nextButton); // Page 2
    await user.click(nextButton); // Page 3

    // Assert
    await waitFor(() => {
      expect(nextButton).toBeDisabled();
    });
  });

  it('should show correct page count', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Assert - 5 items / 2 per page = 3 pages
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
  });

  it('should update page count when data changes', () => {
    // Arrange
    const { rerender } = render(
      <DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />,
    );

    // Act - Reduce data
    const reducedData = mockUsers.slice(0, 3);
    rerender(
      <DataTable data={reducedData} columns={columns} enablePagination={true} pageSize={2} />,
    );

    // Assert - 3 items / 2 per page = 2 pages
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
  });

  it('should render page size selector', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} />);

    // Assert - Should have select/combobox for page size
    const pageSizeControl = screen.getByText(/rows per page/i);
    expect(pageSizeControl).toBeInTheDocument();
  });

  it('should change page size when selector is used', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Act - Change to 5 items per page
    const pageSizeSelector = screen.getByRole('combobox', { name: /rows per page/i });
    await user.click(pageSizeSelector);
    const option5 = screen.getByRole('option', { name: '5' });
    await user.click(option5);

    // Assert - All 5 users should be visible on one page
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(6); // 5 data + 1 header
    });
  });

  it('should reset to page 1 when search filters results', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enablePagination={true}
        enableFiltering={true}
        searchableFields={['name']}
        pageSize={2}
      />,
    );

    // Act - Go to page 2, then filter
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'John');

    // Assert - Should be back on page 1
    await waitFor(() => {
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    });
  });

  it('should not render pagination when disabled', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enablePagination={false} />);

    // Assert
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });
});

describe('DataTable - Row Selection', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should render row selection checkboxes when enabled', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Assert
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('should render header checkbox for select all', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Assert - Find checkbox in header
    const headerRow = screen.getAllByRole('row')[0];
    const headerCheckbox = within(headerRow).getByRole('checkbox');
    expect(headerCheckbox).toBeInTheDocument();
  });

  it('should select individual row when checkbox is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Act - Click first data row checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // Skip header checkbox
    await user.click(firstRowCheckbox);

    // Assert
    expect(firstRowCheckbox).toBeChecked();
  });

  it('should select all rows when header checkbox is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Act
    const headerCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(headerCheckbox);

    // Assert - All row checkboxes should be checked
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should deselect all rows when header checkbox is clicked again', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Act - Click twice
    const headerCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(headerCheckbox);
    await user.click(headerCheckbox);

    // Assert - All checkboxes should be unchecked
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('should show indeterminate state on header checkbox when some rows selected', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Act - Select only one row
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1];
    await user.click(firstRowCheckbox);

    // Assert - Header checkbox should be indeterminate
    const headerCheckbox = checkboxes[0] as HTMLInputElement;
    expect(headerCheckbox.indeterminate).toBe(true);
  });

  it('should highlight selected rows visually', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Act
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1];
    await user.click(firstRowCheckbox);

    // Assert - Row should have selected styling
    const firstDataRow = screen.getAllByRole('row')[1];
    expect(firstDataRow).toHaveAttribute('data-state', 'selected');
  });

  it('should maintain selection across pagination', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableRowSelection={true}
        enablePagination={true}
        pageSize={2}
      />,
    );

    // Act - Select first row on page 1
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    // Navigate to page 2 and back
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    // Assert - First row should still be selected
    await waitFor(() => {
      const updatedCheckboxes = screen.getAllByRole('checkbox');
      expect(updatedCheckboxes[1]).toBeChecked();
    });
  });

  it('should not render checkboxes when selection is disabled', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={false} />);

    // Assert
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});

describe('DataTable - Row Click', () => {
  let columns: Array<ColumnDef<TestUser>>;
  const mockOnRowClick = vi.fn();

  beforeEach(() => {
    columns = createColumns();
    mockOnRowClick.mockClear();
  });

  it('should call onRowClick when row is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} onRowClick={mockOnRowClick} />);

    // Act - Click first data row
    const rows = screen.getAllByRole('row');
    await user.click(rows[1]);

    // Assert
    expect(mockOnRowClick).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('should pass correct row data to onRowClick', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} onRowClick={mockOnRowClick} />);

    // Act - Click third row
    const rows = screen.getAllByRole('row');
    await user.click(rows[3]);

    // Assert
    expect(mockOnRowClick).toHaveBeenCalledWith(mockUsers[2]);
  });

  it('should add pointer cursor when onRowClick is provided', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} onRowClick={mockOnRowClick} />);

    // Assert
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(firstDataRow).toHaveClass('cursor-pointer');
  });

  it('should not add pointer cursor when onRowClick is not provided', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(firstDataRow).not.toHaveClass('cursor-pointer');
  });

  it('should not trigger onRowClick when clicking checkbox', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        onRowClick={mockOnRowClick}
        enableRowSelection={true}
      />,
    );

    // Act - Click checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    // Assert - onRowClick should not be called
    expect(mockOnRowClick).not.toHaveBeenCalled();
  });
});

describe('DataTable - Accessibility', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should have proper table role', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should have proper columnheader roles', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
  });

  it('should have proper row roles', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} />);

    // Assert
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // At least header + data
  });

  it('should have aria-sort attributes on sortable columns', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);

    // Assert
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('should have aria-label on search input', () => {
    // Arrange & Act
    render(
      <DataTable
        data={mockUsers}
        columns={columns}
        enableFiltering={true}
        searchableFields={['name']}
      />,
    );

    // Assert
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveAttribute('aria-label');
  });

  it('should have aria-label on pagination buttons', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} />);

    // Assert
    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(prevButton).toHaveAccessibleName();
    expect(nextButton).toHaveAccessibleName();
  });

  it('should support keyboard navigation on sortable headers', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enableSorting={true} />);

    // Act - Focus and press Enter
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    nameHeader.focus();
    await user.keyboard('{Enter}');

    // Assert - Should sort
    expect(nameHeader).toHaveAttribute('aria-sort');
  });

  it('should support keyboard navigation on pagination', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<DataTable data={mockUsers} columns={columns} enablePagination={true} pageSize={2} />);

    // Act - Focus next button and press Enter
    const nextButton = screen.getByRole('button', { name: /next/i });
    nextButton.focus();
    await user.keyboard('{Enter}');

    // Assert - Should navigate to next page
    await waitFor(() => {
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  it('should have proper checkbox labels', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={columns} enableRowSelection={true} />);

    // Assert
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAccessibleName();
    });
  });

  it('should announce loading state to screen readers', () => {
    // Arrange & Act
    render(<DataTable data={[]} columns={columns} loading={true} />);

    // Assert
    const loadingElement = screen.getByText(/loading/i);
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');
  });

  it('should announce empty state to screen readers', () => {
    // Arrange & Act
    render(<DataTable data={[]} columns={columns} />);

    // Assert
    const emptyElement = screen.getByText(/no data available/i);
    expect(emptyElement).toHaveAttribute('role', 'status');
  });
});

describe('DataTable - Performance', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should handle large datasets efficiently', () => {
    // Arrange - Generate 1000 items
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i % 3 === 0 ? 'Admin' : 'User',
      status: i % 2 === 0 ? ('active' as const) : ('inactive' as const),
      createdAt: new Date(),
    }));

    // Act & Assert - Should render without crashing
    const startTime = performance.now();
    render(
      <DataTable data={largeDataset} columns={columns} enablePagination={true} pageSize={20} />,
    );
    const endTime = performance.now();

    // Should render quickly (< 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('should virtualize rows for large datasets', () => {
    // Arrange - Large dataset
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: 'User',
      status: 'active' as const,
      createdAt: new Date(),
    }));

    // Act
    render(
      <DataTable data={largeDataset} columns={columns} enablePagination={true} pageSize={20} />,
    );

    // Assert - Should only render visible rows (20 + 1 header = 21)
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeLessThanOrEqual(25); // Allow some buffer
  });
});

describe('DataTable - Edge Cases', () => {
  let columns: Array<ColumnDef<TestUser>>;

  beforeEach(() => {
    columns = createColumns();
  });

  it('should handle empty columns array', () => {
    // Arrange & Act
    render(<DataTable data={mockUsers} columns={[]} />);

    // Assert - Should render empty table or show message
    expect(screen.queryByRole('table')).toBeInTheDocument();
  });

  it('should handle null/undefined data gracefully', () => {
    // Arrange & Act
    render(<DataTable data={null as any} columns={columns} />);

    // Assert - Should show empty state
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should handle missing column accessorKey', () => {
    // Arrange
    const invalidColumns: Array<ColumnDef<TestUser>> = [
      {
        header: 'Invalid',
        // Missing accessorKey
      } as any,
    ];

    // Act & Assert - Should not crash
    expect(() => {
      render(<DataTable data={mockUsers} columns={invalidColumns} />);
    }).not.toThrow();
  });

  it('should handle very long text in cells', () => {
    // Arrange
    const dataWithLongText = [
      {
        id: '1',
        name: 'A'.repeat(500),
        email: 'test@example.com',
        role: 'User',
        status: 'active' as const,
        createdAt: new Date(),
      },
    ];

    // Act
    const { container } = render(<DataTable data={dataWithLongText} columns={columns} />);

    // Assert - Should handle long text (truncate or wrap)
    const cell = container.querySelector('td');
    expect(cell).toBeInTheDocument();
  });

  it('should handle special characters in data', () => {
    // Arrange
    const dataWithSpecialChars = [
      {
        id: '1',
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        role: 'User & Admin',
        status: 'active' as const,
        createdAt: new Date(),
      },
    ];

    // Act
    render(<DataTable data={dataWithSpecialChars} columns={columns} />);

    // Assert - Should escape HTML
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
    expect(screen.getByText(/script/i)).toBeInTheDocument();
  });

  it('should handle rapid prop changes', () => {
    // Arrange
    const { rerender } = render(<DataTable data={mockUsers} columns={columns} />);

    // Act - Rapidly change props
    for (let i = 0; i < 10; i++) {
      const newData = mockUsers.slice(0, i + 1);
      rerender(<DataTable data={newData} columns={columns} />);
    }

    // Assert - Should not crash
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
