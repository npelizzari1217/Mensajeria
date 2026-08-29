/**
 * AssignUserRequest — HTTP request body for POST /empresas/:id/users.
 */
export interface AssignUserRequest {
  userId: string;
  roleId?: number; // defaults to 4 (Usuario)
}
