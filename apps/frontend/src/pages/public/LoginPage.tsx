import { LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks';
import { getAuthErrorMessage } from '@ftry/shared/utils';
import { DEMO_CREDENTIALS } from '@ftry/shared/constants';

/**
 * Login Page Component
 * Handles user authentication with email/password
 * Provides demo login for development/testing
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Use shared error handler
  const handleAuthError = useCallback((err: unknown): string => {
    return getAuthErrorMessage(err);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(ROUTES.APP.DASHBOARD);
    } catch (err: unknown) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle demo login (super admin)
   */
  const handleDemoLogin = async (): Promise<void> => {
    const { email: demoEmail, password: demoPassword } = DEMO_CREDENTIALS.SUPER_ADMIN;
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setLoading(true);

    try {
      await login(demoEmail, demoPassword);
      navigate(ROUTES.APP.DASHBOARD);
    } catch (err: unknown) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8 shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your salon dashboard</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@glamour.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo Login */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button onClick={handleDemoLogin} disabled={loading} variant="outline" className="w-full">
            Sign In with Demo Account
          </Button>

          <div className="rounded-md bg-muted/50 p-3 text-xs">
            <p className="font-medium">Demo Credentials:</p>
            <p className="mt-1 text-muted-foreground">
              {DEMO_CREDENTIALS.SUPER_ADMIN.email} / {DEMO_CREDENTIALS.SUPER_ADMIN.password} (
              {DEMO_CREDENTIALS.SUPER_ADMIN.label})
            </p>
            <p className="text-muted-foreground">
              {DEMO_CREDENTIALS.TENANT_ADMIN.email} / {DEMO_CREDENTIALS.TENANT_ADMIN.password} (
              {DEMO_CREDENTIALS.TENANT_ADMIN.label})
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Invite-only application</p>
            <p className="mt-1 text-xs">Contact your administrator to create an account</p>
          </div>

          <div className="text-center">
            <Link to={ROUTES.PUBLIC.FORGOT_PASSWORD}>
              <Button variant="link" size="sm">
                Forgot password?
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
