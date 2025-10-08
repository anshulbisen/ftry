import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth.service';

/**
 * Token Cleanup Service
 * Runs scheduled tasks to clean up expired refresh tokens
 */
@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Clean up expired refresh tokens
   * Runs daily at 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    this.logger.log('Starting scheduled cleanup of expired refresh tokens...');

    try {
      const deletedCount = await this.authService.cleanupExpiredTokens();
      this.logger.log(`Successfully deleted ${deletedCount} expired refresh tokens`);
    } catch (error) {
      this.logger.error(
        'Failed to cleanup expired tokens',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * Clean up revoked tokens older than 30 days
   * Runs weekly on Sunday at 4:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldRevokedTokens() {
    this.logger.log('Starting scheduled cleanup of old revoked tokens...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await this.authService.cleanupRevokedTokens(thirtyDaysAgo);
      this.logger.log(`Successfully deleted ${deletedCount} old revoked tokens`);
    } catch (error) {
      this.logger.error(
        'Failed to cleanup old revoked tokens',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
