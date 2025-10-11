import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROLE_NAMES } from '@ftry/shared/constants';
import type { SafeUser } from '@ftry/shared/types';

/**
 * AuthUser is the same as SafeUser
 * SafeUser already includes role and tenant from the backend
 */
export type AuthUser = SafeUser;

interface AuthState {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Permissions
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;

  // Role checks
  isSuperAdmin: () => boolean;
  isTenantOwner: () => boolean;
  isTenantAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Set authentication with user only (tokens in HTTP-only cookies)
      setAuth: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      // Update user data
      setUser: (user) => set({ user }),

      // Clear all authentication state
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Check if user has a specific permission
      hasPermission: (permission) => {
        const { user } = get();
        // Check both user.permissions and user.role.permissions for compatibility
        const permissions = user?.permissions || user?.role?.permissions || [];
        return permissions.includes(permission);
      },

      // Check if user has any of the specified permissions
      hasAnyPermission: (permissions) => {
        const { user } = get();
        // Check both user.permissions and user.role.permissions for compatibility
        const userPermissions = user?.permissions || user?.role?.permissions || [];
        if (userPermissions.length === 0) return false;
        return permissions.some((p) => userPermissions.includes(p));
      },

      // Check if user has all of the specified permissions
      hasAllPermissions: (permissions) => {
        const { user } = get();
        // Check both user.permissions and user.role.permissions for compatibility
        const userPermissions = user?.permissions || user?.role?.permissions || [];
        if (userPermissions.length === 0) return false;
        if (permissions.length === 0) return true;
        return permissions.every((p) => userPermissions.includes(p));
      },

      // Check if user is a super admin
      isSuperAdmin: () => {
        const { user } = get();
        return user?.role?.name === ROLE_NAMES.SUPER_ADMIN;
      },

      // Check if user is a tenant owner
      isTenantOwner: () => {
        const { user } = get();
        return user?.role?.name === ROLE_NAMES.TENANT_OWNER;
      },

      // Check if user is a tenant admin
      isTenantAdmin: () => {
        const { user } = get();
        return user?.role?.name === ROLE_NAMES.TENANT_ADMIN;
      },
    }),
    {
      name: 'auth-storage',
      // Persist user and auth state only (tokens in HTTP-only cookies)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
