import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks';

export function RegisterPage() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDemoRegister = async () => {
    setLoading(true);
    try {
      // Use demo credentials - they're mocked for now
      await register('Demo User', 'demo@ftry.com', 'password123');
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
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Get started with your salon management system
          </p>
        </div>

        {/* Demo Register Info */}
        <div className="rounded-md bg-muted/50 p-4 text-sm">
          <p className="mb-2 font-medium">Demo Mode</p>
          <p className="text-muted-foreground">
            Click the button below to create a demo account. Backend integration coming soon!
          </p>
        </div>

        {/* Register Button */}
        <div className="space-y-4">
          <Button onClick={handleDemoRegister} disabled={loading} className="w-full" size="lg">
            {loading ? 'Creating account...' : 'Create Demo Account'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to={ROUTES.PUBLIC.LOGIN} className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
