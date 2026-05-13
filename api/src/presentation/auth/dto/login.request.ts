/**
 * LoginRequest — HTTP request body for POST /auth/login.
 */
export interface LoginRequest {
  email: string;
  password: string;
}
