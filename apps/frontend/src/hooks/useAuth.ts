import { useAuthStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { type User } from '@/types';

/**
 * Custom hook for authentication operations
 * Provides convenient access to auth state and actions
 */
export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    login: loginStore,
    logout: logoutStore,
    updateUser,
  } = useAuthStore();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (email: string, _password: string) => {
    // TODO: Replace with actual API call
    // This is a placeholder implementation
    const mockUser: User = {
      id: '1',
      email,
      name: 'Demo User',
      role: 'owner',
    };
    const mockToken = 'mock-jwt-token';

    loginStore(mockUser, mockToken);
    navigate(ROUTES.APP.DASHBOARD);
  };

  const logout = () => {
    logoutStore();
    navigate(ROUTES.PUBLIC.LOGIN);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const register = async (name: string, email: string, _password: string) => {
    // TODO: Replace with actual API call
    // This is a placeholder implementation
    const mockUser: User = {
      id: '1',
      email,
      name,
      role: 'owner',
    };
    const mockToken = 'mock-jwt-token';

    loginStore(mockUser, mockToken);
    navigate(ROUTES.APP.DASHBOARD);
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser,
  };
}
