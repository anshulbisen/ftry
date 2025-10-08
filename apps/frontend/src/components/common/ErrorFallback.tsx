import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface ErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
}

/**
 * Error fallback UI displayed when an error boundary catches an error
 * Provides options to retry, go home, or view error details
 */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (resetError) {
      resetError();
    }
    navigate(ROUTES.APP.DASHBOARD);
  };

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error. Please try again or return to the homepage.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {import.meta.env.DEV && error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
            <p className="text-xs font-semibold text-destructive mb-2">Error Details:</p>
            <p className="text-xs font-mono text-destructive/80 break-all">{error.message}</p>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-destructive/60 hover:text-destructive">
                  Stack trace
                </summary>
                <pre className="mt-2 text-xs text-destructive/60 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={handleRefresh} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        {/* Support Info */}
        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact support at{' '}
          <a href="mailto:support@ftry.com" className="text-primary hover:underline">
            support@ftry.com
          </a>
        </p>
      </div>
    </div>
  );
}
