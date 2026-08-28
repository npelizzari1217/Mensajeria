import { CallerContext } from '../../auth/dtos/caller-context.dto';

/**
 * UpdateRoleDTO — input for the update role use case.
 * Only Admin callers are allowed.
 */
export interface UpdateRoleDTO {
  id: number;
  name: string;
  description?: string;
  caller: CallerContext;
}
