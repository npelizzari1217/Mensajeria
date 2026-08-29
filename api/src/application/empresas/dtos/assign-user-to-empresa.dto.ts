/**
 * AssignUserToEmpresaDTO — input for linking a user to an empresa.
 */
export interface AssignUserToEmpresaDTO {
  userId: string;
  roleId?: number; // defaults to 4 (Usuario)
}
