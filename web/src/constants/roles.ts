export const ROLES = {
  Admin: 'Admin',
  Supervisor: 'Supervisor',
  Tecnico: 'Tecnico',
  Usuario: 'Usuario',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: Role[] = [ROLES.Admin];
export const MANAGE_USERS_ROLES: Role[] = [ROLES.Admin, ROLES.Supervisor];

/** True when roleId is 1 or role name is "Admin" (string fallback). */
export function isAdmin(role?: string | number): boolean {
  if (role === undefined || role === null) return false;
  if (typeof role === 'number') return role === 1;
  return role === ROLES.Admin || role.toLowerCase() === 'admin';
}

/** True when roleId is 2 or role name is "Supervisor" (string fallback). */
export function isSupervisor(role?: string | number): boolean {
  if (role === undefined || role === null) return false;
  if (typeof role === 'number') return role === 2;
  return role === ROLES.Supervisor || role.toLowerCase() === 'supervisor';
}

/** True when roleId is 1 or 2 (Admin or Supervisor). */
export function canManageUsers(role?: string | number): boolean {
  if (role === undefined || role === null) return false;
  if (typeof role === 'number') return role === 1 || role === 2;
  return isAdmin(role) || isSupervisor(role);
}
