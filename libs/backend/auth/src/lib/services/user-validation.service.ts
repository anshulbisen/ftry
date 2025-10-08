/**
 * User Validation Service
 * Centralized validation logic for user status and account state
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_STATUS, AUTH_ERRORS } from '@ftry/shared/constants';
import { UserWithRelations } from '@ftry/shared/types';

@Injectable()
export class UserValidationService {
  /**
   * Validate user status - checks if user is active and not deleted
   * Throws UnauthorizedException if user is not in valid state
   */
  validateUserStatus(user: UserWithRelations): void {
    if (user.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedException(`${AUTH_ERRORS.ACCOUNT_NOT_ACTIVE}: ${user.status}`);
    }

    if (user.isDeleted) {
      throw new UnauthorizedException(AUTH_ERRORS.ACCOUNT_DELETED);
    }
  }

  /**
   * Check if account is currently locked
   * Throws UnauthorizedException with remaining lock time if locked
   */
  checkAccountLock(user: UserWithRelations): void {
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedException(
        `${AUTH_ERRORS.ACCOUNT_LOCKED}. Try again in ${remainingMinutes} minute(s)`,
      );
    }
  }

  /**
   * Validate both user status and account lock
   * Convenience method that runs all validations
   */
  validateUser(user: UserWithRelations): void {
    this.checkAccountLock(user);
    this.validateUserStatus(user);
  }
}
