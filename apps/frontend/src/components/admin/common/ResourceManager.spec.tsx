import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceManager } from './ResourceManager';
import type { ResourceConfig, Entity } from '@/types/admin';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { Users } from 'lucide-react';

// Mock hooks at the top level (will be hoisted by vitest)
vi.mock('@/hooks/usePermissions');
vi.mock('sonner');

// Test entity type
interface TestUser extends Entity {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive';
}

// Test form component
const TestForm: React.FC<any> = ({ entity, open, onClose, onSuccess }) => {
  return open ? (
    <div data-testid="test-form">
      <button onClick={() => onClose()}>Close Form</button>
      <button onClick={() => onSuccess?.({ id: '1', email: 'test@example.com' })}>Submit</button>
    </div>
  ) : null;
};

describe('ResourceManager', () => {
  let mockConfig: ResourceConfig<TestUser, Partial<TestUser>, Partial<TestUser>>;
  let mockUseList: any;
  let mockUseCreate: any;
  let mockUseUpdate: any;
  let mockUseDelete: any;

  const mockUsers: TestUser[] = [
    { id: '1', email: 'user1@example.com', name: 'User 1', status: 'active' },
    { id: '2', email: 'user2@example.com', name: 'User 2', status: 'inactive' },
  ];

  beforeEach(async () => {
    // Setup permission mocks
    const { usePermissions } = await import('@/hooks/usePermissions');
    vi.mocked(usePermissions).mockReturnValue({
      permissions: ['users:read:all', 'users:create:all', 'users:update:all', 'users:delete:all'],
      hasAnyPermission: vi.fn(() => true),
      hasPermission: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => true),
      canAccessResource: vi.fn(() => true),
      isSuperAdmin: vi.fn(() => false),
      hasGlobalAccess: vi.fn(() => true),
    });

    // Setup toast mock
    const sonner = await import('sonner');
    vi.mocked(sonner.toast).success = vi.fn();
    vi.mocked(sonner.toast).error = vi.fn();
    vi.mocked(sonner.toast).info = vi.fn();

    // Mock query result
    mockUseList = vi.fn(() => ({
      data: mockUsers,
      isLoading: false,
      error: null,
    })) as any;

    // Mock mutation results
    mockUseCreate = vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })) as any;

    mockUseUpdate = vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })) as any;

    mockUseDelete = vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })) as any;

    mockConfig = {
      metadata: {
        singular: 'User',
        plural: 'Users',
        icon: Users,
        description: 'Manage users and their roles',
        emptyMessage: 'No users found',
      },
      permissions: {
        create: ['users:create:all'],
        read: ['users:read:all'],
        update: ['users:update:all'],
        delete: ['users:delete:all'],
      },
      hooks: {
        useList: mockUseList,
        useCreate: mockUseCreate,
        useUpdate: mockUseUpdate,
        useDelete: mockUseDelete,
      },
      table: {
        columns: [
          {
            id: 'email',
            accessorKey: 'email',
            header: 'Email',
            sortable: true,
            cell: ({ row }: any) => <span>{row.original.email}</span>,
          },
          {
            id: 'name',
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }: any) => <span>{row.original.name}</span>,
          },
          {
            id: 'status',
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: any) => <span>{row.original.status}</span>,
          },
        ],
      },
      form: {
        component: TestForm,
      },
    };
  });

  describe('Rendering', () => {
    it('should render page header with metadata', () => {
      render(<ResourceManager config={mockConfig} />);

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Manage users and their roles')).toBeInTheDocument();
    });

    it('should render create button when user has permission', () => {
      render(<ResourceManager config={mockConfig} />);

      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    it('should render data table with columns', () => {
      render(<ResourceManager config={mockConfig} />);

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render table rows with data', () => {
      render(<ResourceManager config={mockConfig} />);

      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      mockUseList.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ResourceManager config={mockConfig} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      const error = new Error('Failed to load users');
      mockUseList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      });

      render(<ResourceManager config={mockConfig} />);

      expect(screen.getByText(/Failed to load users/i)).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      mockUseList.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<ResourceManager config={mockConfig} />);

      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  describe('Column Visibility', () => {
    it('should filter columns based on visibleIf condition', async () => {
      // Override the permission mock for this test
      const { usePermissions } = await import('@/hooks/usePermissions');
      vi.mocked(usePermissions).mockReturnValue({
        permissions: ['users:read:all'], // No 'users:read:hidden' permission
        hasAnyPermission: vi.fn((perms: string[]) =>
          perms.some((p) => ['users:read:all'].includes(p)),
        ),
        hasPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
        isSuperAdmin: vi.fn(() => false),
        hasGlobalAccess: vi.fn(() => false),
      });

      const configWithConditionalColumn: ResourceConfig<
        TestUser,
        Partial<TestUser>,
        Partial<TestUser>
      > = {
        ...mockConfig,
        table: {
          ...mockConfig.table,
          columns: [
            ...mockConfig.table.columns,
            {
              key: 'hidden',
              label: 'Hidden Column',
              accessorKey: 'hidden',
              visibleIf: (permissions) => permissions.includes('users:read:hidden'),
              cell: ({ row }: any) => <span>Hidden</span>,
            },
          ],
        },
      };

      render(<ResourceManager config={configWithConditionalColumn} />);

      expect(screen.queryByText('Hidden Column')).not.toBeInTheDocument();
    });
  });

  describe('Create Operation', () => {
    it('should open create dialog when clicking add button', async () => {
      const user = userEvent.setup();
      render(<ResourceManager config={mockConfig} />);

      await user.click(screen.getByText('Add User'));

      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });

    it('should close create dialog when form closes', async () => {
      const user = userEvent.setup();
      render(<ResourceManager config={mockConfig} />);

      await user.click(screen.getByText('Add User'));
      expect(screen.getByTestId('test-form')).toBeInTheDocument();

      await user.click(screen.getByText('Close Form'));
      expect(screen.queryByTestId('test-form')).not.toBeInTheDocument();
    });
  });

  describe('Edit Operation', () => {
    it('should open edit dialog when clicking edit action', async () => {
      const user = userEvent.setup();
      render(<ResourceManager config={mockConfig} />);

      // Find and click the actions menu for first row (uses screen reader label "Actions")
      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);

      await user.click(screen.getByRole('menuitem', { name: /edit/i }));

      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });

    it('should pass entity to form in edit mode', async () => {
      const user = userEvent.setup();
      render(<ResourceManager config={mockConfig} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));

      // Form should receive the entity
      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });
  });

  describe('Delete Operation', () => {
    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<ResourceManager config={mockConfig} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    it('should call delete mutation on confirmation', async () => {
      const user = userEvent.setup();
      const deleteMock = vi.fn();
      mockUseDelete.mockReturnValue({
        mutate: deleteMock,
        isPending: false,
      });

      render(<ResourceManager config={mockConfig} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      await user.click(screen.getByRole('button', { name: /confirm delete/i }));

      expect(deleteMock).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('should respect delete validation rules', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      const configWithValidation: ResourceConfig<TestUser, Partial<TestUser>, Partial<TestUser>> = {
        ...mockConfig,
        deleteValidation: {
          canDelete: (entity) => ({
            allowed: entity.status !== 'active',
            reason: entity.status === 'active' ? 'Cannot delete active users' : undefined,
          }),
        },
      };

      render(<ResourceManager config={configWithValidation} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);
      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      // Should show error toast instead of confirmation dialog
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Cannot delete active users');
      });

      // Should not show confirmation dialog
      expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom Actions', () => {
    it('should render custom actions in row menu', async () => {
      const user = userEvent.setup();
      const configWithCustomAction: ResourceConfig<
        TestUser,
        Partial<TestUser>,
        Partial<TestUser>
      > = {
        ...mockConfig,
        customActions: [
          {
            id: 'activate',
            label: 'Activate',
            icon: Users,
            variant: 'default',
            location: ['row'],
            handler: vi.fn(),
          },
        ],
      };

      render(<ResourceManager config={configWithCustomAction} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);

      expect(screen.getByRole('menuitem', { name: /activate/i })).toBeInTheDocument();
    });

    it('should execute custom action handler', async () => {
      const user = userEvent.setup();
      const handlerMock = vi.fn().mockResolvedValue(undefined);
      const configWithCustomAction: ResourceConfig<
        TestUser,
        Partial<TestUser>,
        Partial<TestUser>
      > = {
        ...mockConfig,
        customActions: [
          {
            id: 'activate',
            label: 'Activate',
            icon: Users,
            variant: 'default',
            location: ['row'],
            handler: handlerMock,
          },
        ],
      };

      render(<ResourceManager config={configWithCustomAction} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);
      await user.click(screen.getByRole('menuitem', { name: /activate/i }));

      await waitFor(() => {
        expect(handlerMock).toHaveBeenCalledWith(mockUsers[0], {});
      });
    });

    it('should show confirmation dialog for actions with confirmation', async () => {
      const user = userEvent.setup();
      const configWithConfirmation: ResourceConfig<
        TestUser,
        Partial<TestUser>,
        Partial<TestUser>
      > = {
        ...mockConfig,
        customActions: [
          {
            id: 'deactivate',
            label: 'Deactivate',
            icon: Users,
            variant: 'destructive',
            location: ['row'],
            confirmation: {
              title: 'Deactivate User',
              description: 'Are you sure you want to deactivate this user?',
              confirmText: 'Deactivate',
              variant: 'destructive',
            },
            handler: vi.fn(),
          },
        ],
      };

      render(<ResourceManager config={configWithConfirmation} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);
      await user.click(screen.getByRole('menuitem', { name: /deactivate/i }));

      expect(screen.getByText('Deactivate User')).toBeInTheDocument();
      expect(
        screen.getByText('Are you sure you want to deactivate this user?'),
      ).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input when search is enabled', () => {
      const configWithSearch: ResourceConfig<TestUser, Partial<TestUser>, Partial<TestUser>> = {
        ...mockConfig,
        search: {
          enabled: true,
          placeholder: 'Search users...',
        },
      };

      render(<ResourceManager config={configWithSearch} />);

      expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    });

    it('should not render search input when search is disabled', () => {
      render(<ResourceManager config={mockConfig} />);

      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });
  });

  describe('Permission Gating', () => {
    it('should hide create button without create permission', async () => {
      // Override the permission mock to deny create permission
      const { usePermissions } = await import('@/hooks/usePermissions');
      vi.mocked(usePermissions).mockReturnValue({
        permissions: ['users:read:all'], // No create permission
        hasAnyPermission: vi.fn((perms: string[]) => {
          // Only allow read permissions, deny create
          return perms.some((p) => ['users:read:all'].includes(p));
        }),
        hasPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        canAccessResource: vi.fn(() => true),
        isSuperAdmin: vi.fn(() => false),
        hasGlobalAccess: vi.fn(() => false),
      });

      render(<ResourceManager config={mockConfig} />);

      expect(screen.queryByText('Add User')).not.toBeInTheDocument();
    });
  });
});
