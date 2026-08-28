# Design: Roles en tabla con ID numérico

## Technical Approach

Migrar de `enum Role` (3 representaciones: Prisma UPPER_CASE, dominio PascalCase, frontend constantes) a tabla `Role` con ID numérico (INT, 4 bytes). El ID codifica jerarquía: 1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario. `User.role` y `UserEmpresa.role` pasan a `roleId INT` con FK a la tabla. El JWT y API mantienen `role: string` (name del rol) para retrocompatibilidad con web/mobile. Guards comparan numéricamente por jerarquía (`requerido <= portador`). El mapper `user-mapper.ts` se elimina.

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|----------|--------|----------|--------|
| ID numérico vs string PK | `id INT` | Numérico: jerarquía implícita, autoincrement natural. String: no rompe API pero sin orden jerárquico. | **INT numérico** — jerarquía por ID, extensible sin código |
| Role en JWT: string vs number | `role: "Admin"` (string) + `roleId: 1` (number) | String: retrocompatibilidad con web/mobile. Number: más limpio pero rompe clientes. | **Ambos** — `role` string para clientes, `roleId` para lógica de dominio |
| `CallerContext`: string vs number | Mantener `callerRole: string` | Cambiar a number rompe 10+ use cases. String es resiliente si el rol se renombra. | **Mantener string** — la capa de dominio usa RoleVO con ID; CallerContext sigue como string (name) |
| Guards: @Roles(Role.Admin) vs @Roles(1) | `@Roles(1)` con comparación numérica | Transición: soportar ambos temporalmente hasta eliminar enum. Comparar por ID es inmune a renombres. | **@Roles(number)** — comparación numérica en RolesGuard, fallback string para transición |

## Data Flow

```
                         ┌──────────────┐
  POST /roles  ─────────→│ RoleController│────→ CreateRoleUseCase ────→ RoleRepository.save()
                         └──────────────┘              │
                                                       │
  AuthGuard ──→ req.user = { roleId, role (name) }     │
       │                                               │
  RolesGuard ──→ compara roleId ≤ requerido             │
       │                                               ▼
  Controller ──→ UseCase(DTO) ──→ Domain Entity ──→ PrismaRepo ──→ DB
                                                       │
  JWT sign ←── roleId + role name ─────────────────────┘
```

1. **Auth**: Login genera JWT con `roleId: number` + `role: string`. AuthGuard inyecta ambos en `req.user`.
2. **Authorize**: RolesGuard lee el `roleId` requerido del decorador `@Roles(1)`, lo compara con el del token (`mayor >= menor` jerarquía).
3. **CRUD Roles**: Controller → Use Case → RoleRepository (port en dominio, adapter en infra). Create/Update validan name único vía DB unique constraint.
4. **User → Role**: `User.role` deja de ser `RoleVO`. Ahora es `roleId: number`. Al serializar, se incluye `role: { id, name }` expandido desde JOIN o caché.

## File Changes

### Crear

| Path | Purpose |
|------|---------|
| `packages/domain/src/role/entities/role.ts` | Role entity: id (number), name (string), description (string\|null), isAtLeast(minId) |
| `packages/domain/src/role/value-objects/role-id.ts` | RoleId VO — number > 0 |
| `packages/domain/src/role/value-objects/role-name.ts` | RoleName VO — string 2-50 chars |
| `packages/domain/src/role/repositories/role-repository.ts` | RoleRepository port: findById, findByName, findAll, save, delete |
| `api/src/application/role/use-cases/create-role.use-case.ts` | CreateRoleUseCase (Admin only) |
| `api/src/application/role/use-cases/update-role.use-case.ts` | UpdateRoleUseCase (Admin only) |
| `api/src/application/role/use-cases/delete-role.use-case.ts` | DeleteRoleUseCase — rechaza si FK en User/UserEmpresa |
| `api/src/application/role/use-cases/list-roles.use-case.ts` | ListRolesUseCase (Admin, Supervisor) |
| `api/src/application/role/dtos/` | create-role.dto.ts, update-role.dto.ts, role-response.dto.ts |
| `api/src/application/role/ports/role-repository-port.ts` | Re-export del port de dominio para DI |
| `api/src/presentation/role/role.controller.ts` | GET/POST/PATCH/DELETE `/roles` |
| `api/src/presentation/role/role.module.ts` | NestJS module wiring |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-role.repository.ts` | Implementación Prisma de RoleRepository |
| `api/prisma/migrations/*_create_role_table/` | 3 migraciones: crear tabla + seed → migrar FK → dropear enum |

### Modificar

| Path | What changes |
|------|-------------|
| `api/prisma/schema.prisma` | +model Role, User.role→roleId Int, UserEmpresa.role→roleId Int, -enum Role |
| `packages/domain/src/shared/value-objects/role.ts` | RoleVO se adapta: constructor toma id+name, isAtLeast() usa id numérico. Se elimina enum Role. |
| `packages/domain/src/auth/entities/user.ts` | `role: RoleVO` → `roleId: number`. `getIdentity()` devuelve roleId. |
| `packages/domain/src/auth/value-objects/user-identity.ts` | `role: RoleVO` → `roleId: number, roleName: string` |
| `packages/domain/src/index.ts` | +export Role, RoleId, RoleName, RoleRepository, -export enum Role |
| `api/src/application/auth/dtos/user-profile.dto.ts` | `role: string` → `roleId: number, roleName: string` |
| `api/src/application/auth/dtos/caller-context.dto.ts` | `callerRole: string` se mantiene (name del rol) |
| `api/src/application/auth/ports/auth-port.ts` | TokenPayload: `role: Role` → `role: string, roleId: number` |
| `api/src/infrastructure/auth/jwt-auth-port.ts` | sign(): incluye `roleId` en JWT payload |
| `api/src/infrastructure/auth/guards/roles.guard.ts` | Comparación por roleId numérico + fallback string |
| `api/src/infrastructure/auth/decorators/roles.decorator.ts` | `Roles(...roleIds: number[])` |
| `api/src/infrastructure/auth/guards/auth.guard.ts` | req.user incluye `roleId` |
| `api/src/presentation/auth/auth.controller.ts` | `@Roles(Role.Admin)` → `@Roles(1)`. CallerContext incluye roleId. |
| `api/src/presentation/empresas/empresas.controller.ts` | `@Roles(Role.Admin)` → `@Roles(1)` |
| `api/src/application/auth/use-cases/register-user.use-case.ts` | `dto.role` string → `dto.roleId` number. `callerRole === 'Supervisor'` → `callerRoleId === 2`. |
| `api/src/application/auth/use-cases/login.use-case.ts` | JWT payload: incluye roleId. UserProfileDTO: roleId + roleName. |
| `api/src/application/auth/use-cases/refresh-token.use-case.ts` | Payload con roleId |
| `api/src/application/auth/use-cases/list-users.use-case.ts` | CallerContext usa roleId |
| `api/src/application/auth/use-cases/update-user.use-case.ts` | role string → roleId |
| `api/src/application/auth/use-cases/delete-user.use-case.ts` | CallerContext roleId |
| `api/src/application/auth/use-cases/select-empresa.use-case.ts` | Payload con roleId |
| `api/src/application/auth/use-cases/get-current-user.use-case.ts` | UserProfileDTO con roleId |
| `api/src/application/auth/use-cases/logout.use-case.ts` | Sin cambios (ya no usa role) |
| `api/src/application/empresas/use-cases/assign-user-to-empresa.use-case.ts` | `role` string → `roleId` number |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts` | `UserMapper.toDomain(row)` → construir User sin mapper. `role: data.role` → `roleId: data.roleId`. |
| `api/src/infrastructure/persistence/seed.ts` | +role seed. User creation usa roleId. `Role.ADMIN` → `roleId: 1`. |
| `api/prisma/seed.ts` | +role seed. User creation usa roleId. `Role.ADMIN` → `roleId: 1`. |
| `web/src/constants/roles.ts` | Simplificar a helpers que usan roleId/roleName de API |
| `web/src/pages/users-admin.page.tsx` | `<select>` de roles poblado desde GET /roles |
| `web/src/pages/roles-admin.page.tsx` | NUEVA: admin de roles (solo Admin) |
| `web/src/api/client.ts` | +funciones fetchRoles, createRole, updateRole, deleteRole |
| `web/src/__tests__/roles.test.ts` | Actualizar a roleId |

### Eliminar

| Path | Reason |
|------|--------|
| `api/src/infrastructure/persistence/prisma/mappers/user-mapper.ts` | Rol ya no necesita mapeo entre enums — FK directa. Otros mappers (email, password) se mueven inline al repositorio. |

## Interfaces / Contracts

### Prisma Schema (nuevo model + User/UserEmpresa modificados)

```prisma
model Role {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  description String?
  users       User[]
  userEmpresas UserEmpresa[]
  @@map("roles")
}

model User {
  // ... campos existentes ...
  roleId      Int     @default(4)
  role        Role    @relation(fields: [roleId], references: [id])
  @@map("users")
}

model UserEmpresa {
  // ... campos existentes ...
  roleId      Int     @default(4)
  role        Role    @relation(fields: [roleId], references: [id])
  @@map("user_empresas")
}
```

### RoleRepository port (domain)

```ts
export interface RoleRepository {
  findById(id: RoleId): Promise<Result<Role, DomainError>>;
  findByName(name: RoleName): Promise<Result<Role, DomainError>>;
  findAll(): Promise<Result<Role[], DomainError>>;
  save(role: Role): Promise<Result<void, DomainError>>;
  delete(id: RoleId): Promise<Result<void, DomainError>>;
  hasUsers(id: RoleId): Promise<boolean>;
}
```

### API contracts

```
POST   /roles         { name: string, description?: string }  → 201 { id, name, description }
GET    /roles                                                  → 200 [{ id, name, description }]
PATCH  /roles/:id     { name?: string, description?: string }  → 200 { id, name, description }
DELETE /roles/:id                                              → 204 | 409 { error: "Role in use" }
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Domain (unit) | RoleId, RoleName VOs, Role.isAtLeast(), User.roleId | Jest + VO reconstruct/create tests |
| Domain (unit) | RoleVO adaptado con id+name | Test de jerarquía con IDs numéricos |
| Application (unit) | CRUD use cases | Mock RoleRepository, verificar guards de rol Admin |
| Infrastructure (integration) | PrismaRoleRepository | Test con base de datos de prueba o mock de PrismaService |
| API (integration) | Endpoints /roles | Supertest + BD de prueba, probar AuthGuard + RolesGuard con roleId |
| API (regression) | Auth flow completo | Tests existentes adaptados a roleId + role expandido |
| Web (unit) | Páginas de admin | Mock de API client, verificar render con datos de roles |

## Migration

3 fases incrementales, cada una con `up` y `down`:

1. **Crear tabla Role + seed** — `up`: CREATE TABLE roles, INSERT 4 seeds, ALTER TABLE users ADD roleId INT nullable. `down`: DROP COLUMN, DROP TABLE.
2. **Migrar datos** — `up`: UPDATE users SET roleId = (SELECT id FROM roles WHERE roles.name = ...) según role actual. ALTER COLUMN SET NOT NULL, ADD FK. Repetir para user_empresas. `down`: DROP FK, SET NULL.
3. **Eliminar enum** — `up`: DROP COLUMN role de users y user_empresas. `down`: ADD COLUMN role, re-popular desde roleId vía JOIN.

## Open Questions

- [ ] ¿Cuándo se dropea el `enum Role` de Prisma? ¿Después de que web/mobile estén actualizados? La propuesta dice "paso final" — coordinar con deploy de frontend.
- [ ] `@Roles(1)` vs `@Roles('Admin')` — ¿soportar ambos durante transición o cambiar todo de una vez? La spec dice IDs numéricos. Diseño propone transición con fallback string en RolesGuard.
