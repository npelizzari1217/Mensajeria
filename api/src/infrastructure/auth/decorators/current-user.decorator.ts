import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser — parameter decorator that extracts the authenticated
 * user's identity from the request (injected by AuthGuard).
 *
 * Usage:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: { userId: string; role: string }) {
 *     return user;
 *   }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
