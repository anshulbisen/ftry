import type { ReactElement } from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Custom render function that includes common providers
 * Eliminates duplicate test setup code
 */
export function renderWithRouter(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
}

/**
 * Mock navigation for testing
 */
export function createMockNavigation() {
  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
    };
  });
  return mockNavigate;
}

/**
 * Mock auth hook for testing
 */
export function createMockAuth() {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockRegister = vi.fn();

  const mockAuthHook = {
    login: mockLogin,
    logout: mockLogout,
    register: mockRegister,
    user: null,
    token: null,
    isAuthenticated: false,
    updateUser: vi.fn(),
  };

  return {
    mockAuthHook,
    mockLogin,
    mockLogout,
    mockRegister,
  };
}

/**
 * Common test data factory
 */
export const TestDataFactory = {
  user: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  authResponse: (overrides = {}) => ({
    user: TestDataFactory.user(),
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    ...overrides,
  }),

  apiError: (message = 'Test error', status = 400) => ({
    response: {
      status,
      data: {
        message,
        error: 'Bad Request',
      },
    },
  }),
};

/**
 * Wait for async updates with better error messages
 */
export async function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock API response helper
 */
export async function mockApiResponse<T>(data: T, delay = 0) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Mock API error helper
 */
export async function mockApiError(message: string, delay = 0) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(TestDataFactory.apiError(message)), delay);
  });
}
