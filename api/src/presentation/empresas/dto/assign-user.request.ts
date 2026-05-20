/**
 * AssignUserRequest — HTTP request body for POST /empresas/:id/users.
 */
export interface AssignUserRequest {
  userId: string;
  role?: string;
}
