# Proposal: Centralizar Roles en tabla con ID numérico

## Intent

Tres representaciones de `Role` causan inconsistencia: Prisma `enum Role { ADMIN, ... }` (UPPER_CASE), dominio `enum Role { Admin = 'Admin', ... }` (PascalCase), y constantes frontend. El mapper `user-mapper.ts` convierte frágilmente entre formatos (34 líneas). Tabla con ID numérico elimina las 3 representaciones y permite roles dinámicos sin re-deploy.

## Scope

**In**: Tabla `Role` (ID INT, name unique, description) con seed: 1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario. FK `roleId` en User y UserEmpresa. `POST|GET|PATCH|DELETE /roles` (Admin) + `GET /roles` público (Supervisor). RoleVO.isAtLeast() por jerarquía numérica (1 > 2 > 3 > 4). JWT mantiene `role: "Admin"` (string) para retrocompatibilidad. Eliminar enum Role de Prisma y dominio como paso final.

**Out**: GroupRole (concepto distinto de grupos). Permisos granulares.

## Capabilities

**New**: `role-management` — CRUD roles (Admin) + GET público (Supervisor).

**Modified**: `user-auth` — Role enum→FK, RBAC strings→IDs. `empresa-management` — UserEmpresa.role→FK.

## Approach

1. Tabla Role + seed. Agregar `roleId` nullable en User/UserEmpresa.
2. Migrar datos, NOT NULL + FK, dropear enum viejo (3 migraciones incrementales con down).
3. RoleVO adaptado: ID menor = más privilegio.
4. `@Roles('Admin')` → `@Roles(1)`. Guards comparan numéricamente.
5. JWT payload: `role.name` (string). API respuesta: `roleId` + `role: { id, name }`.
6. Frontend: `<select>` poblado desde `GET /roles`.

## Affected Areas

38 archivos en 6 capas: Prisma schema (2), Domain (6), Application (12), Infrastructure (7), Presentation (6), Web (4), Mobile (1). El más crítico: `user-mapper.ts` se **elimina**.

## Risks

| Risk | Mitigation |
|------|------------|
| Migración datos en prod (ALTO) | 3 fases con down cada una: nullable → migrate → NOT NULL → drop enum |
| JWT/API breaking (ALTO) | `role: string` en JWT se mantiene. API agrega campo expandido sin quitar el string. |
| Regresión guards/decorators (MEDIO) | Tests integración auth antes de eliminar enum viejo |
| GroupRole confusión (MEDIO) | GroupRole NO se toca — documentado en explore |

## Rollback

Revertir migraciones (down). Revertir branch. Si falló a medio camino: backup BD + migration down.

## Dependencies

Ninguna externa. Deploy API antes que frontend.

## Success Criteria

- [ ] Tabla Role con 4 seeds + FK en User/UserEmpresa, enum Role eliminado
- [ ] 38 archivos actualizados, tests verdes en domain/api/web, user-mapper.ts eliminado
- [ ] CRUD /roles: Admin full, Supervisor GET only
- [ ] JWT payload `role: "Admin"` (string), web/mobile sin cambios
