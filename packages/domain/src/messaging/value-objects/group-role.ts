/**
 * GroupRole Value Object.
 *
 * Roles dentro de un grupo: ADMIN (puede gestionar miembros, editar grupo)
 * y MEMBER (puede enviar al grupo y ver miembros).
 */
export class GroupRole {
  private constructor(private readonly value: 'ADMIN' | 'MEMBER') {}

  static ADMIN = new GroupRole('ADMIN');
  static MEMBER = new GroupRole('MEMBER');

  static create(value: string): GroupRole {
    const normalized = value.toUpperCase();
    if (normalized !== 'ADMIN' && normalized !== 'MEMBER') {
      throw new Error(`Invalid group role: ${value}. Must be ADMIN or MEMBER`);
    }
    return new GroupRole(normalized as 'ADMIN' | 'MEMBER');
  }

  isAdmin(): boolean {
    return this.value === 'ADMIN';
  }

  isMember(): boolean {
    return this.value === 'MEMBER';
  }

  get(): string {
    return this.value;
  }

  equals(other: GroupRole): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
