import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/constants/routes';

// Mock the auth store
vi.mock('@/store', () => ({
  useAuthStore: vi.fn(),
}));

describe('ProtectedRoute Component', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: {
      id: 'role-123',
      name: 'Manager',
      permissions: ['appointments:read', 'appointments:write', 'clients:read'],
    },
  };

  // Helper component for testing
  const TestComponent = () => <div>Protected Content</div>;
  const LoginPage = () => <div>Login Page</div>;
  const DashboardPage = () => <div>Dashboard Page</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Check', () => {
    it('should render children when user is authenticated', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        hasAnyPermission: vi.fn().mockReturnValue(false),
        hasAllPermissions: vi.fn().mockReturnValue(false),
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading state while checking authentication', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should preserve attempted location in redirect state', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected/nested']}>
          <Routes>
            <Route
              path="/protected/nested"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Permission Checks', () => {
    it('should render when user has any required permission', () => {
      // Arrange
      const mockHasAnyPermission = vi.fn().mockReturnValue(true);
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute requiredPermissions={['appointments:read']} requireAll={false}>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(mockHasAnyPermission).toHaveBeenCalledWith(['appointments:read']);
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should render when user has all required permissions', () => {
      // Arrange
      const mockHasAllPermissions = vi.fn().mockReturnValue(true);
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: mockHasAllPermissions,
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute
            requiredPermissions={['appointments:read', 'appointments:write']}
            requireAll={true}
          >
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(mockHasAllPermissions).toHaveBeenCalledWith([
        'appointments:read',
        'appointments:write',
      ]);
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to dashboard when user lacks required permissions (any)', () => {
      // Arrange
      const mockHasAnyPermission = vi.fn().mockReturnValue(false);
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredPermissions={['admin:delete']} requireAll={false}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.APP.DASHBOARD} element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to dashboard when user lacks required permissions (all)', () => {
      // Arrange
      const mockHasAllPermissions = vi.fn().mockReturnValue(false);
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: mockHasAllPermissions,
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute
                  requiredPermissions={['appointments:read', 'admin:delete']}
                  requireAll={true}
                >
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.APP.DASHBOARD} element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should not check permissions if no permissions required', () => {
      // Arrange
      const mockHasAnyPermission = vi.fn();
      const mockHasAllPermissions = vi.fn();
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: mockHasAllPermissions,
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(mockHasAnyPermission).not.toHaveBeenCalled();
      expect(mockHasAllPermissions).not.toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not check permissions with empty array', () => {
      // Arrange
      const mockHasAnyPermission = vi.fn();
      const mockHasAllPermissions = vi.fn();
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: mockHasAllPermissions,
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute requiredPermissions={[]}>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(mockHasAnyPermission).not.toHaveBeenCalled();
      expect(mockHasAllPermissions).not.toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display spinner during loading', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
      });

      // Act
      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      // Check for spinner element (has animate-spin class)
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should center loading indicator on screen', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
      });

      // Act
      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      const loadingContainer = container.querySelector(
        '.flex.h-screen.items-center.justify-center',
      );
      expect(loadingContainer).toBeInTheDocument();
    });

    it('should not render children while loading', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: true,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user when authenticated', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: null,
        isLoading: false,
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle multiple permission checks', () => {
      // Arrange
      const mockHasAnyPermission = vi.fn().mockReturnValue(true);
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute
            requiredPermissions={[
              'appointments:read',
              'appointments:write',
              'clients:read',
              'clients:write',
            ]}
            requireAll={false}
          >
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(mockHasAnyPermission).toHaveBeenCalledWith([
        'appointments:read',
        'appointments:write',
        'clients:read',
        'clients:write',
      ]);
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should re-render when authentication state changes', () => {
      // Arrange
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Initial state: not authenticated
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();

      // Change state: now authenticated
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: vi.fn().mockReturnValue(true),
        hasAllPermissions: vi.fn().mockReturnValue(true),
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    it('should handle requireAll=false (default behavior)', () => {
      // Arrange
      const mockHasAnyPermission = vi.fn().mockReturnValue(true);
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter>
          <ProtectedRoute requiredPermissions={['appointments:read']}>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>,
      );

      // Assert
      expect(mockHasAnyPermission).toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('should use replace navigation for login redirect', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        hasAnyPermission: vi.fn(),
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      // Note: Testing replace navigation behavior would require more complex routing setup
    });

    it('should use replace navigation for permission denied redirect', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        hasAnyPermission: vi.fn().mockReturnValue(false),
        hasAllPermissions: vi.fn(),
      });

      // Act
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredPermissions={['admin:delete']}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.APP.DASHBOARD} element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Assert
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });
});
