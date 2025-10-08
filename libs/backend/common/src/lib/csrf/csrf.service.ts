import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * CSRF Service
 *
 * Provides access to CSRF token generation.
 * The generator function is set during application bootstrap.
 */
@Injectable()
export class CsrfService {
  private static tokenGenerator: ((req: Request, res: Response) => string) | null = null;

  /**
   * Set the CSRF token generator (called from bootstrap)
   */
  static setTokenGenerator(generator: (req: Request, res: Response) => string): void {
    this.tokenGenerator = generator;
  }

  /**
   * Generate a CSRF token for the current request
   */
  generateToken(req: Request, res: Response): string {
    if (!CsrfService.tokenGenerator) {
      throw new Error('CSRF token generator not initialized');
    }
    return CsrfService.tokenGenerator(req, res);
  }
}
