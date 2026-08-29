import { CallerContext } from './caller-context.dto';

/**
 * RegisterUserDTO — input for the register use case.
 *
 * Contains the raw data submitted during user registration.
 * Validation is performed by the use case using domain VOs.
 */
export interface RegisterUserDTO {
  email: string;
  password: string;
  name: string;
  roleId?: number;
  empresaId: string;
  caller?: CallerContext;
}
