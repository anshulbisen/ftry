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
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      hasPermission: (permission) => {
        const { user } = get();
        return user?.role?.permissions?.includes(permission) || false;
      },

      hasAnyPermission: (permissions) => {
        const { user } = get();
        if (!user?.role?.permissions) return false;
        return permissions.some((p) => user.role.permissions.includes(p));
      },

      hasAllPermissions: (permissions) => {
        const { user } = get();
        if (!user?.role?.permissions) return false;
        return permissions.every((p) => user.role.permissions.includes(p));
      },

      isSuperAdmin: () => {
        const { user } = get();
        return user?.role?.name === ROLE_NAMES.SUPER_ADMIN;
      },

      isTenantOwner: () => {
        const { user } = get();
        return user?.role?.name === ROLE_NAMES.TENANT_OWNER;
      },

      isTenantAdmin: () => {
        const { user } = get();
        return user?.role?.name === ROLE_NAMES.TENANT_ADMIN;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
