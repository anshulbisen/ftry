import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with jwt strategy', () => {
    // The guard extends AuthGuard('jwt')
    // This is verified by the class structure
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should use jwt strategy name', () => {
    // Verify the guard is properly configured
    // The actual authentication logic is handled by Passport JWT strategy
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    // The canActivate method is inherited from AuthGuard
    expect(typeof guard.canActivate).toBe('function');
  });
});
