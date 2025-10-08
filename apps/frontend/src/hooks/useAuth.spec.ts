import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useAuthStore } from '@ftry/frontend/auth';
import { authApi } from '@ftry/frontend/auth';
import type { SafeUser, AuthResponse } from '@ftry/shared/types';

// Mock dependencies
vi.mock('@ftry/frontend/auth', async () => {
  const actual = await vi.importActual('@ftry/frontend/auth');
  return {
    ...actual,
    useAuthStore: vi.fn(),
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      refreshToken: vi.fn(),
    },
  };
});

describe('useAuth Hook', () => {
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
      permissions: ['appointments:read', 'appointments:write'],
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

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
  };

  // Store mock functions
  let mockSetAuth: Mock;
  let mockLogoutStore: Mock;
  let mockSetUser: Mock;
  let mockSetLoading: Mock;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock store functions
    mockSetAuth = vi.fn();
    mockLogoutStore = vi.fn();
    mockSetUser = vi.fn();
    mockSetLoading = vi.fn();

    // Mock useAuthStore implementation
    (useAuthStore as unknown as Mock).mockReturnValue({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: mockSetAuth,
      logout: mockLogoutStore,
      setUser: mockSetUser,
      setLoading: mockSetLoading,
    });

    // Mock getState for logout operations
    (useAuthStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState = vi
      .fn()
      .mockReturnValue({
        refreshToken: 'stored-refresh-token',
        setLoading: mockSetLoading,
        logout: mockLogoutStore,
      });
  });

  describe('Login Functionality', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      (authApi.login as Mock).mockResolvedValue(mockAuthResponse);

      // Act
      const { result } = renderHook(() => useAuth());
      let loginResult: SafeUser | undefined;

      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      // Assert
      expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
      // setAuth now only takes user (tokens are httpOnly cookies)
      expect(mockSetAuth).toHaveBeenCalledWith(mockAuthResponse.user);
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(loginResult).toEqual(mockUser);
    });

    it('should return user data after successful login', async () => {
      // Arrange
      (authApi.login as Mock).mockResolvedValue(mockAuthResponse);

      // Act
      const { result } = renderHook(() => useAuth());
      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'password123');
      });

      // Assert
      expect(loginResult).toEqual(mockUser);
      expect(loginResult.email).toBe('test@example.com');
    });

    it('should throw error on invalid credentials', async () => {
      // Arrange
      const error = new Error('Invalid credentials');
      (authApi.login as Mock).mockRejectedValue(error);

      // Act & Assert
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrongpassword');
        }),
      ).rejects.toThrow('Invalid credentials');

      expect(mockSetAuth).not.toHaveBeenCalled();
    });

    it('should handle network errors during login', async () => {
      // Arrange
      const networkError = new Error('Network error');
      (authApi.login as Mock).mockRejectedValue(networkError);

      // Act & Assert
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'password123');
        }),
      ).rejects.toThrow('Network error');
    });

    it('should handle empty credentials', async () => {
      // Arrange
      const error = new Error('Email and password are required');
      (authApi.login as Mock).mockRejectedValue(error);

      // Act & Assert
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.login('', '');
        }),
      ).rejects.toThrow();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      // Setup authenticated state
      (useAuthStore as unknown as Mock).mockReturnValue({
        user: mockUser,
        accessToken: 'current-access-token',
        refreshToken: 'current-refresh-token',
        isAuthenticated: true,
        isLoading: false,
        setAuth: mockSetAuth,
        logout: mockLogoutStore,
        setUser: mockSetUser,
        setLoading: mockSetLoading,
      });
    });

    it('should successfully logout and revoke token', async () => {
      // Arrange
      (authApi.logout as Mock).mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      // HTTP-only cookie auth - no token passed to logout
      expect(authApi.logout).toHaveBeenCalled();
      expect(mockLogoutStore).toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should clear local state even if API call fails', async () => {
      // Arrange
      const error = new Error('API Error');
      (authApi.logout as Mock).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(authApi.logout).toHaveBeenCalled();
      expect(mockLogoutStore).toHaveBeenCalled(); // Still clears local state
      // Note: Error logging is handled by API interceptor, not by useAuth hook
    });

    it('should handle logout without refresh token', async () => {
      // Arrange
      (useAuthStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState = vi
        .fn()
        .mockReturnValue({
          refreshToken: null,
          setLoading: mockSetLoading,
          logout: mockLogoutStore,
        });

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      // HTTP-only cookie auth - logout API still called
      expect(authApi.logout).toHaveBeenCalled();
      expect(mockLogoutStore).toHaveBeenCalled();
    });

    it('should not throw error on network failure during logout', async () => {
      // Arrange
      (authApi.logout as Mock).mockRejectedValue(new Error('Network error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console error for this test
      });

      // Act & Assert
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.logout();
        }),
      ).resolves.not.toThrow();

      expect(mockLogoutStore).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // NOTE: Registration removed - this is an invite-only app
  describe.skip('Registration Functionality', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      (authApi.register as Mock).mockResolvedValue(mockUser);

      // Act
      const { result } = renderHook(() => useAuth());
      let registerResult: SafeUser | undefined;

      await act(async () => {
        registerResult = await result.current.register(
          'John',
          'Doe',
          'john@example.com',
          'SecurePass123!',
          '+919876543210',
          'role-123',
          'tenant-123',
        );
      });

      // Assert
      expect(authApi.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phone: '+919876543210',
        roleId: 'role-123',
        tenantId: 'tenant-123',
      });
      expect(registerResult).toEqual(mockUser);
    });

    it('should register user without optional fields', async () => {
      // Arrange
      (authApi.register as Mock).mockResolvedValue(mockUser);

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.register('John', 'Doe', 'john@example.com', 'SecurePass123!');
      });

      // Assert
      expect(authApi.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phone: undefined,
        roleId: '', // Default empty string
        tenantId: undefined,
      });
    });

    it('should handle registration with existing email', async () => {
      // Arrange
      const error = new Error('Email already exists');
      (authApi.register as Mock).mockRejectedValue(error);

      // Act & Assert
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.register('John', 'Doe', 'existing@example.com', 'password123');
        }),
      ).rejects.toThrow('Email already exists');
    });

    it('should handle validation errors during registration', async () => {
      // Arrange
      const error = new Error('Invalid email format');
      (authApi.register as Mock).mockRejectedValue(error);

      // Act & Assert
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.register('John', 'Doe', 'invalid-email', 'pass');
        }),
      ).rejects.toThrow('Invalid email format');
    });

    it('should return registered user data', async () => {
      // Arrange
      (authApi.register as Mock).mockResolvedValue(mockUser);

      // Act
      const { result } = renderHook(() => useAuth());
      const registerResult = await act(async () => {
        return await result.current.register('John', 'Doe', 'john@example.com', 'SecurePass123!');
      });

      // Assert
      expect(registerResult).toEqual(mockUser);
      expect(registerResult.email).toBe('test@example.com');
    });
  });

  describe('Hook State Management', () => {
    it('should expose user from store', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        user: mockUser,
        accessToken: 'token',
        isAuthenticated: true,
        setAuth: mockSetAuth,
        logout: mockLogoutStore,
        setUser: mockSetUser,
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.user).toEqual(mockUser);
    });

    it('should expose isLoading state', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        user: mockUser,
        accessToken: 'mock-token',
        isAuthenticated: true,
        isLoading: true,
        setAuth: mockSetAuth,
        logout: mockLogoutStore,
        setUser: mockSetUser,
        setLoading: mockSetLoading,
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should expose isAuthenticated flag', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        user: mockUser,
        accessToken: 'token',
        isAuthenticated: true,
        setAuth: mockSetAuth,
        logout: mockLogoutStore,
        setUser: mockSetUser,
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should expose updateUser function', () => {
      // Arrange
      const { result } = renderHook(() => useAuth());

      // Act
      act(() => {
        result.current.updateUser(mockUser);
      });

      // Assert
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    });

    it('should return null user when not authenticated', () => {
      // Arrange
      (useAuthStore as unknown as Mock).mockReturnValue({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        setAuth: mockSetAuth,
        logout: mockLogoutStore,
        setUser: mockSetUser,
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent login attempts', async () => {
      // Arrange
      (authApi.login as Mock).mockResolvedValue(mockAuthResponse);

      // Act
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await Promise.all([
          result.current.login('test@example.com', 'password123'),
          result.current.login('test@example.com', 'password123'),
        ]);
      });

      // Assert
      expect(authApi.login).toHaveBeenCalledTimes(2);
    });

    it('should handle logout when already logged out', async () => {
      // Arrange
      (useAuthStore as unknown as { getState: ReturnType<typeof vi.fn> }).getState = vi
        .fn()
        .mockReturnValue({
          refreshToken: null,
          setLoading: mockSetLoading,
          logout: mockLogoutStore,
        });

      // Act
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      // Logout API is still called even without refresh token (httpOnly cookie)
      expect(authApi.logout).toHaveBeenCalled();
      expect(mockLogoutStore).toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle API returning malformed data', async () => {
      // Arrange
      (authApi.login as Mock).mockResolvedValue({
        user: null,
        accessToken: null,
        refreshToken: null,
      });

      // Act & Assert
      const { result } = renderHook(() => useAuth());

      // This should still call setAuth even with null values
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockSetAuth).toHaveBeenCalled();
    });
  });
});
