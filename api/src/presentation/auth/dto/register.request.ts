/**
 * RegisterRequest — HTTP request body for POST /auth/register.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
  empresaId?: string;
}
