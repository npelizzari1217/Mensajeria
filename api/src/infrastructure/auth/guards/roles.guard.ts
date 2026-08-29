import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Fallback mapping from role name string to roleId.
 * Used when req.user has role (string) but not roleId (number),
 * e.g. during transition from old enum-based tokens.
 */
function roleNameToId(name: string): number | null {
  switch (name) {
    case 'Admin':      return 1;
    case 'Supervisor': return 2;
    case 'Técnico':    return 3;
    case 'Usuario':    return 4;
    default:           return null;
  }
}

/**
 * RolesGuard — NestJS Guard that checks if the authenticated user
 * has the required numeric role ID(s) to access a resource.
 *
 * Works in conjunction with @Roles() decorator and AuthGuard.
 * Must be applied AFTER AuthGuard so req.user is populated.
 *
 * Comparison: checks if req.user.roleId is among the required IDs.
 * Fallback: if roleId is missing but role (string) is present,
 * maps the string name to a numeric ID for transition support.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoleIds = this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoleIds || requiredRoleIds.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Primary check: numeric roleId
    let userRoleId: number | undefined = user.roleId;

    // Fallback: map from role string if roleId is missing
    if (userRoleId === undefined && typeof user.role === 'string') {
      const mapped = roleNameToId(user.role);
      if (mapped !== null) {
        userRoleId = mapped;
      }
    }

    if (userRoleId === undefined) {
      throw new ForbiddenException('User role not found in request');
    }

    const hasRole = requiredRoleIds.includes(userRoleId);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role ID: ${requiredRoleIds.join(' or ')}`,
      );
    }

    return true;
  }
}
