/**
 * CallerContext — identity of the authenticated caller for RBAC enforcement.
 *
 * Passed from the presentation layer (controller) into application use cases
 * so role-based access scoping decisions can be made without coupling to HTTP.
 */
export interface CallerContext {
  callerId: string;
  callerRole: string; // 'Admin' | 'Supervisor' | 'Tecnico' | 'Usuario' — legacy, prefer callerRoleId
  callerRoleId: number; // 1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario
  callerEmpresaId: string;
}
