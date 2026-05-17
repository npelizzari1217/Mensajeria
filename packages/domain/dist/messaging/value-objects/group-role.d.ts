/**
 * GroupRole Value Object.
 *
 * Roles dentro de un grupo: ADMIN (puede gestionar miembros, editar grupo)
 * y MEMBER (puede enviar al grupo y ver miembros).
 */
export declare class GroupRole {
    private readonly value;
    private constructor();
    static ADMIN: GroupRole;
    static MEMBER: GroupRole;
    static create(value: string): GroupRole;
    isAdmin(): boolean;
    isMember(): boolean;
    get(): string;
    equals(other: GroupRole): boolean;
    toString(): string;
}
//# sourceMappingURL=group-role.d.ts.map