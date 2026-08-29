import { CallerContext } from '../../auth/dtos/caller-context.dto';

/**
 * CreateRoleDTO — input for the create role use case.
 * Only Admin callers are allowed.
 */
export interface CreateRoleDTO {
  name: string;
  description?: string;
  caller: CallerContext;
}
