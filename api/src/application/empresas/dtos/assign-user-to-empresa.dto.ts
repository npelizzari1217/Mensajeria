/**
 * AssignUserToEmpresaDTO — input for linking a user to an empresa.
 */
export interface AssignUserToEmpresaDTO {
  userId: string;
  role?: string; // defaults to 'USUARIO'
}
