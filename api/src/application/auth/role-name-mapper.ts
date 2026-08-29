/**
 * Maps a numeric roleId to its human-readable name.
 * Mirrors the hierarchy: 1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario.
 */
export function roleIdToName(roleId: number): string {
  switch (roleId) {
    case 1: return 'Admin';
    case 2: return 'Supervisor';
    case 3: return 'Técnico';
    case 4: return 'Usuario';
    default: return 'Desconocido';
  }
}
