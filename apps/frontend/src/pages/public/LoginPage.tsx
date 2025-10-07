import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks';

export function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Use any credentials - they're mocked for now
      await login('demo@ftry.com', 'password123');
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

        {/* Demo Login Info */}
        <div className="rounded-md bg-muted/50 p-4 text-sm">
          <p className="mb-2 font-medium">Demo Mode</p>
          <p className="text-muted-foreground">
            Click the button below to login with demo credentials. Backend integration coming soon!
          </p>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Button onClick={handleDemoLogin} disabled={loading} className="w-full" size="lg">
            {loading ? 'Signing in...' : 'Sign In with Demo Account'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to={ROUTES.PUBLIC.REGISTER} className="text-primary hover:underline">
              Register
            </Link>
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
