import { Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';
import { ROUTES } from '@/constants/routes';

export function LandingPage() {
  return (
    <PagePlaceholder
      icon={Scissors}
      title="Welcome to FTRY"
      description="Salon & Spa Management SaaS"
    >
      <div className="flex gap-4">
        <Link to={ROUTES.PUBLIC.LOGIN}>
          <Button size="lg">Sign In</Button>
        </Link>
        <Link to={ROUTES.PUBLIC.REGISTER}>
          <Button size="lg" variant="outline">
            Get Started
          </Button>
        </Link>
      </div>
    </PagePlaceholder>
  );
}
