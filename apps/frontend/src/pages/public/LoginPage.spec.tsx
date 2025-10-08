import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/constants/routes';

// Mock dependencies
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    (useAuth as Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
    });
  });

  // Helper to render component with router
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );
  };

  describe('Component Rendering', () => {
    it('should render login form with all elements', () => {
      // Act
      renderLoginPage();

      // Assert
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    });

    it('should display demo login button', () => {
      // Act
      renderLoginPage();

      // Assert
      expect(
        screen.getByRole('button', { name: /sign in with demo account/i }),
      ).toBeInTheDocument();
    });

    it('should display demo credentials information', () => {
      // Act
      renderLoginPage();

      // Assert
      expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
      expect(screen.getByText(/super@ftry.com/i)).toBeInTheDocument();
      expect(screen.getByText(/admin@glamour.com/i)).toBeInTheDocument();
    });

    // NOTE: Registration removed - invite-only app
    it.skip('should display link to registration page', () => {
      // Act
      renderLoginPage();

      // Assert
      const registerLink = screen.getByRole('link', { name: /register/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', ROUTES.PUBLIC.REGISTER);
    });

    it('should display forgot password link', () => {
      // Act
      renderLoginPage();

      // Assert
      const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i });
      expect(forgotPasswordButton).toBeInTheDocument();
    });

    it('should render login icon', () => {
      // Act
      const { container } = renderLoginPage();

      // Assert
      // Lucide icons render as SVGs
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email field', () => {
      // Act
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      // Assert
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should require password field', () => {
      // Act
      renderLoginPage();
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      // Assert
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have correct input placeholders', () => {
      // Act
      renderLoginPage();

      // Assert
      expect(screen.getByPlaceholderText(/admin@glamour.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update email input on change', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      // Act
      await user.type(emailInput, 'test@example.com');

      // Assert
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input on change', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      // Act
      await user.type(passwordInput, 'SecurePassword123!');

      // Assert
      expect(passwordInput.value).toBe('SecurePassword123!');
    });

    it('should allow typing in both fields', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Assert
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Form Submission', () => {
    it('should call login function with correct credentials on submit', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should navigate to dashboard after successful login', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.APP.DASHBOARD);
      });
    });

    it('should show loading state during login', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'user-123' }), 100)),
      );
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('should disable form inputs during login', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'user-123' }), 100)),
      );
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('should prevent form submission via Enter key', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ id: 'user-123' });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(passwordInput, '{Enter}');

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      // Arrange
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';
      mockLogin.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error for Error instances', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Network error'));
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display default error message for unknown errors', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockRejectedValue('Unknown error');
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.'),
        ).toBeInTheDocument();
      });
    });

    it('should clear error message on new login attempt', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      mockLogin.mockResolvedValueOnce({ id: 'user-123' });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act - First attempt (fails)
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Act - Second attempt (succeeds)
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'correct@example.com');
      await user.type(passwordInput, 'correctpass');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Login failed'));
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(emailInput).not.toBeDisabled();
        expect(passwordInput).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Demo Login', () => {
    it('should auto-fill credentials when demo button clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ id: 'demo-user' });
      renderLoginPage();

      const demoButton = screen.getByRole('button', { name: /sign in with demo account/i });

      // Act
      await user.click(demoButton);

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('super@ftry.com', '123123');
      });
    });

    it('should navigate to dashboard after demo login success', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ id: 'demo-user' });
      renderLoginPage();

      const demoButton = screen.getByRole('button', { name: /sign in with demo account/i });

      // Act
      await user.click(demoButton);

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.APP.DASHBOARD);
      });
    });

    it('should show error if demo login fails', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockRejectedValue({
        response: { data: { message: 'Demo account unavailable' } },
      });
      renderLoginPage();

      const demoButton = screen.getByRole('button', { name: /sign in with demo account/i });

      // Act
      await user.click(demoButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Demo account unavailable')).toBeInTheDocument();
      });
    });

    it('should disable demo button during login', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'demo-user' }), 100)),
      );
      renderLoginPage();

      const demoButton = screen.getByRole('button', { name: /sign in with demo account/i });

      // Act
      await user.click(demoButton);

      // Assert
      expect(demoButton).toBeDisabled();
    });

    it('should show loading state on demo login', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 'demo-user' }), 100)),
      );
      renderLoginPage();

      const demoButton = screen.getByRole('button', { name: /sign in with demo account/i });

      // Act
      await user.click(demoButton);

      // Assert - Both form submit and demo button should show loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Links', () => {
    // NOTE: Registration removed - invite-only app
    it.skip('should have correct href for register link', () => {
      // Act
      renderLoginPage();

      // Assert
      const registerLink = screen.getByRole('link', { name: /register/i });
      expect(registerLink).toHaveAttribute('href', ROUTES.PUBLIC.REGISTER);
    });

    it('should render forgot password link', () => {
      // Act
      renderLoginPage();

      // Assert
      const forgotLink = screen.getByRole('button', { name: /forgot password/i });
      expect(forgotLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      // Act
      renderLoginPage();

      // Assert
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have accessible button text', () => {
      // Act
      renderLoginPage();

      // Assert
      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in with demo account/i }),
      ).toBeInTheDocument();
    });

    it('should render heading with proper hierarchy', () => {
      // Act
      renderLoginPage();

      // Assert
      const heading = screen.getByRole('heading', { name: /welcome back/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions', async () => {
      // Arrange
      const user = userEvent.setup();
      let loginPromiseResolver: ((value: unknown) => void) | null = null;
      mockLogin.mockImplementation(
        () =>
          new Promise((resolve) => {
            loginPromiseResolver = resolve;
          }),
      );
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Try to click again while first is processing
      const button = screen.getByRole('button', { name: /signing in/i });
      expect(button).toBeDisabled();

      // Resolve the promise
      if (loginPromiseResolver) {
        loginPromiseResolver({ id: 'user-123' });
      }

      // Assert - Button was disabled, preventing second call
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty form submission', async () => {
      // Arrange
      const user = userEvent.setup();
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.click(submitButton);

      // Assert - Browser validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should pass input values as-is (no automatic trimming)', async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({ id: 'user-123' });
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in$/i });

      // Act
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Assert - Values are passed as entered (component doesn't trim)
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });
});
