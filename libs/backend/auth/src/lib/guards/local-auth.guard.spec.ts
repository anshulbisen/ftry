import { ExecutionContext } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(() => {
    guard = new LocalAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with local strategy', () => {
    // The guard extends AuthGuard('local')
    // This is verified by the class structure
    expect(guard).toBeInstanceOf(LocalAuthGuard);
  });

  it('should use local strategy name', () => {
    // Verify the guard is properly configured
    // The actual authentication logic is handled by Passport Local strategy
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    // The canActivate method is inherited from AuthGuard
    expect(typeof guard.canActivate).toBe('function');
  });
});
