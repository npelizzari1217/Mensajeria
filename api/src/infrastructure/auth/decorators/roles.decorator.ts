import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RolesGuard to retrieve required role IDs.
 */
export const ROLES_KEY = 'roles';

/**
 * Roles — decorator that marks which numeric role IDs are allowed to access a route.
 *
 * Usage:
 *   @Roles(1)          // Admin only
 *   @Roles(1, 2)       // Admin or Supervisor
 *   @Get('admin-only')
 *   adminEndpoint() { ... }
 *
 * Must be used together with AuthGuard + RolesGuard:
 *   @UseGuards(AuthGuard, RolesGuard)
 *
 * Role IDs: 1=Admin, 2=Supervisor, 3=Tecnico, 4=Usuario
 */
export const Roles = (...roleIds: number[]) => SetMetadata(ROLES_KEY, roleIds);
