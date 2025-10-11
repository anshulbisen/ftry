import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { UserWithPermissions } from '@ftry/shared/types';

/**
 * Extract the authenticated user from the request
 * @returns UserWithPermissions - The authenticated user with permissions array
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: UserWithPermissions) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserWithPermissions => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
