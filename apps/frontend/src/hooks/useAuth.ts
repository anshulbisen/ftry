import { useAuthStore } from '@ftry/frontend/auth';
import { authApi } from '@ftry/frontend/auth';
import type { SafeUser } from '@ftry/shared/types';

/**
 * Custom hook for authentication operations
 * Provides convenient access to auth state and actions
 *
 * NOTE: This hook does NOT handle navigation - that's the caller's responsibility
 * NOTE: Registration removed - this is an invite-only application
 *       User creation is handled by super admins via the admin panel
 */
export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    setAuth,
    logout: logoutStore,
    setUser,
  } = useAuthStore();

  /**
   * Login with email and password
   * Returns the authenticated user data
   * Caller should handle navigation after successful login
   * Tokens are set as HTTP-only cookies by the backend
   */
  const login = async (email: string, password: string): Promise<SafeUser> => {
    const response = await authApi.login(email, password);
    setAuth(response.user); // Only user data, no tokens
    return response.user;
  };

  /**
   * Logout the current user
   * Revokes refresh token on backend and clears auth state
   * Caller should handle navigation after logout
   * Tokens are cleared via HTTP-only cookies by the backend
   */
  const logout = async (): Promise<void> => {
    // Attempt to revoke token on backend, but don't block logout on failure
    try {
      await authApi.logout(); // No refresh token needed - sent via cookie
    } catch (error) {
      // Silent fail - logout continues regardless
      // Error is already handled by API client interceptor
    }

    // Clear local state regardless of API call result
    logoutStore();
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    updateUser: setUser,
  };
}
