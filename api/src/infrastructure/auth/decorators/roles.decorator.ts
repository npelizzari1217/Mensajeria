import { SetMetadata } from '@nestjs/common';
import { Role } from '@mensajeria/domain';

/**
 * Metadata key used by RolesGuard to retrieve required roles.
 */
export const ROLES_KEY = 'roles';

/**
 * Roles — decorator that marks which roles are allowed to access a route.
 *
 * Usage:
 *   @Roles(Role.Admin)
 *   @Get('admin-only')
 *   adminEndpoint() { ... }
 *
 * Must be used together with AuthGuard + RolesGuard:
 *   @UseGuards(AuthGuard, RolesGuard)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
