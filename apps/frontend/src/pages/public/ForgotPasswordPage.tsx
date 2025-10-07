import { KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { ROUTES } from '@/constants/routes';

export function ForgotPasswordPage() {
  return (
    <PagePlaceholder
      icon={KeyRound}
      title="Forgot Password"
      description="Password reset form will be implemented here"
    >
      <div className="flex flex-col gap-2">
        <Button size="lg">Reset Password (Placeholder)</Button>
        <Link to={ROUTES.PUBLIC.LOGIN}>
          <Button variant="link" size="sm">
            Back to login
          </Button>
        </Link>
      </div>
    </PagePlaceholder>
  );
}
