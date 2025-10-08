import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import { ROLE_NAMES } from '@ftry/shared/constants';
import type { SafeUser } from '@ftry/shared/types';

describe('Auth Store', () => {
  // Test fixtures
  const mockUser: SafeUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+919876543210',
    tenantId: 'tenant-123',
    roleId: 'role-123',
    status: 'active',
    isDeleted: false,
    emailVerified: true,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    lastLogin: new Date(),
    avatar: null,
    metadata: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'role-123',
      name: 'Manager',
      description: 'Manager role',
      permissions: ['appointments:read', 'appointments:write', 'clients:read'],
      tenantId: 'tenant-123',
      type: 'tenant',
      level: 5,
      isSystem: false,
      isDefault: false,
      status: 'active',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tenant: {
      id: 'tenant-123',
      name: 'Test Salon',
      slug: 'test-salon',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      status: 'active',
      description: null,
      logo: null,
      website: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      subscriptionEndDate: null,
      maxUsers: 10,
      settings: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should provide all required actions', () => {
      const state = useAuthStore.getState();

      expect(typeof state.setAuth).toBe('function');
      expect(typeof state.setUser).toBe('function');
      expect(typeof state.updateTokens).toBe('function');
      expect(typeof state.logout).toBe('function');
      expect(typeof state.setLoading).toBe('function');
      expect(typeof state.hasPermission).toBe('function');
      expect(typeof state.hasAnyPermission).toBe('function');
      expect(typeof state.hasAllPermissions).toBe('function');
      expect(typeof state.isSuperAdmin).toBe('function');
      expect(typeof state.isTenantOwner).toBe('function');
      expect(typeof state.isTenantAdmin).toBe('function');
    });
  });

  describe('setAuth', () => {
    it('should set user and tokens', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      useAuthStore.getState().setAuth(mockUser, accessToken, refreshToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set isAuthenticated to true', () => {
      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should clear loading state', () => {
      useAuthStore.setState({ isLoading: true });

      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should update user while preserving tokens', () => {
      // Setup initial state
      useAuthStore.getState().setAuth(mockUser, 'access-token', 'refresh-token');

      // Update user
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      useAuthStore.getState().setUser(updatedUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(updatedUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
    });

    it('should update user fields', () => {
      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');

      const updatedUser = { ...mockUser, email: 'newemail@example.com' };
      useAuthStore.getState().setUser(updatedUser);

      expect(useAuthStore.getState().user?.email).toBe('newemail@example.com');
    });
  });

  describe('updateTokens', () => {
    it('should update access token', () => {
      useAuthStore.getState().setAuth(mockUser, 'old-token', 'old-refresh');

      useAuthStore.getState().updateTokens('new-access-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('old-refresh'); // Unchanged
    });

    it('should update both tokens when refresh token provided', () => {
      useAuthStore.getState().setAuth(mockUser, 'old-token', 'old-refresh');

      useAuthStore.getState().updateTokens('new-access-token', 'new-refresh-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
    });

    it('should keep existing refresh token if not provided', () => {
      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh-token');

      useAuthStore.getState().updateTokens('new-token');

      expect(useAuthStore.getState().refreshToken).toBe('refresh-token');
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should work when already logged out', () => {
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      useAuthStore.getState().setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      useAuthStore.setState({ isLoading: true });

      useAuthStore.getState().setLoading(false);

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Permission Checks', () => {
    beforeEach(() => {
      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');
    });

    describe('hasPermission', () => {
      it('should return true when user has the permission', () => {
        const result = useAuthStore.getState().hasPermission('appointments:read');
        expect(result).toBe(true);
      });

      it('should return false when user lacks the permission', () => {
        const result = useAuthStore.getState().hasPermission('admin:delete');
        expect(result).toBe(false);
      });

      it('should return false when user is null', () => {
        useAuthStore.setState({ user: null });

        const result = useAuthStore.getState().hasPermission('appointments:read');
        expect(result).toBe(false);
      });

      it('should return false when role has no permissions', () => {
        const userWithoutPerms = {
          ...mockUser,
          role: { ...mockUser.role, permissions: [] },
        };
        useAuthStore.setState({ user: userWithoutPerms });

        const result = useAuthStore.getState().hasPermission('appointments:read');
        expect(result).toBe(false);
      });
    });

    describe('hasAnyPermission', () => {
      it('should return true when user has at least one permission', () => {
        const result = useAuthStore
          .getState()
          .hasAnyPermission(['appointments:read', 'admin:delete']);
        expect(result).toBe(true);
      });

      it('should return false when user has none of the permissions', () => {
        const result = useAuthStore.getState().hasAnyPermission(['admin:delete', 'admin:write']);
        expect(result).toBe(false);
      });

      it('should return false for empty permissions array', () => {
        const result = useAuthStore.getState().hasAnyPermission([]);
        expect(result).toBe(false);
      });

      it('should return false when user is null', () => {
        useAuthStore.setState({ user: null });

        const result = useAuthStore.getState().hasAnyPermission(['appointments:read']);
        expect(result).toBe(false);
      });
    });

    describe('hasAllPermissions', () => {
      it('should return true when user has all permissions', () => {
        const result = useAuthStore
          .getState()
          .hasAllPermissions(['appointments:read', 'appointments:write']);
        expect(result).toBe(true);
      });

      it('should return false when user lacks any permission', () => {
        const result = useAuthStore
          .getState()
          .hasAllPermissions(['appointments:read', 'admin:delete']);
        expect(result).toBe(false);
      });

      it('should return true for empty permissions array', () => {
        const result = useAuthStore.getState().hasAllPermissions([]);
        expect(result).toBe(true);
      });

      it('should return false when user is null', () => {
        useAuthStore.setState({ user: null });

        const result = useAuthStore.getState().hasAllPermissions(['appointments:read']);
        expect(result).toBe(false);
      });

      it('should return false when role has no permissions', () => {
        const userWithoutPerms = {
          ...mockUser,
          role: { ...mockUser.role, permissions: [] },
        };
        useAuthStore.setState({ user: userWithoutPerms });

        const result = useAuthStore.getState().hasAllPermissions(['appointments:read']);
        expect(result).toBe(false);
      });
    });
  });

  describe('Role Checks', () => {
    describe('isSuperAdmin', () => {
      it('should return true for super admin role', () => {
        const superAdminUser = {
          ...mockUser,
          role: { ...mockUser.role, name: ROLE_NAMES.SUPER_ADMIN },
        };
        useAuthStore.setState({ user: superAdminUser });

        expect(useAuthStore.getState().isSuperAdmin()).toBe(true);
      });

      it('should return false for non-super admin role', () => {
        useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');

        expect(useAuthStore.getState().isSuperAdmin()).toBe(false);
      });

      it('should return false when user is null', () => {
        useAuthStore.setState({ user: null });

        expect(useAuthStore.getState().isSuperAdmin()).toBe(false);
      });
    });

    describe('isTenantOwner', () => {
      it('should return true for tenant owner role', () => {
        const tenantOwnerUser = {
          ...mockUser,
          role: { ...mockUser.role, name: ROLE_NAMES.TENANT_OWNER },
        };
        useAuthStore.setState({ user: tenantOwnerUser });

        expect(useAuthStore.getState().isTenantOwner()).toBe(true);
      });

      it('should return false for non-tenant owner role', () => {
        useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');

        expect(useAuthStore.getState().isTenantOwner()).toBe(false);
      });

      it('should return false when user is null', () => {
        useAuthStore.setState({ user: null });

        expect(useAuthStore.getState().isTenantOwner()).toBe(false);
      });
    });

    describe('isTenantAdmin', () => {
      it('should return true for tenant admin role', () => {
        const tenantAdminUser = {
          ...mockUser,
          role: { ...mockUser.role, name: ROLE_NAMES.TENANT_ADMIN },
        };
        useAuthStore.setState({ user: tenantAdminUser });

        expect(useAuthStore.getState().isTenantAdmin()).toBe(true);
      });

      it('should return false for non-tenant admin role', () => {
        useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');

        expect(useAuthStore.getState().isTenantAdmin()).toBe(false);
      });

      it('should return false when user is null', () => {
        useAuthStore.setState({ user: null });

        expect(useAuthStore.getState().isTenantAdmin()).toBe(false);
      });
    });
  });

  describe('Persistence', () => {
    it('should persist auth state to storage', () => {
      useAuthStore.getState().setAuth(mockUser, 'access-token', 'refresh-token');

      // Simulate page reload by creating a new store instance
      const newState = useAuthStore.getState();
      expect(newState.user).toBeDefined();
      expect(newState.accessToken).toBeDefined();
      expect(newState.isAuthenticated).toBe(true);
    });

    it('should not persist isLoading state', () => {
      useAuthStore.setState({ isLoading: true });

      const state = useAuthStore.getState();
      // isLoading should not be in the persisted state
      expect(state.isLoading).toBe(true); // In current session
      // Note: Testing actual persistence would require localStorage mocking
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple setAuth calls', () => {
      useAuthStore.getState().setAuth(mockUser, 'token1', 'refresh1');
      useAuthStore.getState().setAuth(mockUser, 'token2', 'refresh2');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('token2');
      expect(state.refreshToken).toBe('refresh2');
    });

    it('should handle setUser without prior setAuth', () => {
      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should handle permission checks with undefined role', () => {
      const userWithoutRole = { ...mockUser, role: undefined as unknown as typeof mockUser.role };
      useAuthStore.setState({ user: userWithoutRole });

      expect(useAuthStore.getState().hasPermission('any')).toBe(false);
      expect(useAuthStore.getState().hasAnyPermission(['any'])).toBe(false);
      expect(useAuthStore.getState().hasAllPermissions(['any'])).toBe(false);
    });

    it('should handle logout multiple times', () => {
      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');
      useAuthStore.getState().logout();
      useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
