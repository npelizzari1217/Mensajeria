export const ROLES = {
  Admin: 'Admin',
  Supervisor: 'Supervisor',
  Tecnico: 'Tecnico',
  Usuario: 'Usuario',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: Role[] = [ROLES.Admin];
export const MANAGE_USERS_ROLES: Role[] = [ROLES.Admin, ROLES.Supervisor];

export function isAdmin(role?: string): boolean {
  return role === ROLES.Admin || role?.toLowerCase() === 'admin';
}

export function isSupervisor(role?: string): boolean {
  return role === ROLES.Supervisor || role?.toLowerCase() === 'supervisor';
}

export function canManageUsers(role?: string): boolean {
  return isAdmin(role) || isSupervisor(role);
}
