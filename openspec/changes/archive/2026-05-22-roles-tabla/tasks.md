# Tasks: roles-tabla

## T1: Domain — Role entity + value objects + repository port ✅

**Objetivo:** Crear la capa de dominio para Role con entity, value objects y puerto de repositorio.

**Archivos a crear:**
- `packages/domain/src/role/entities/role.ts` — Role entity con `id`, `name`, `description`, `isAtLeast(minId: number): boolean`
- `packages/domain/src/role/value-objects/role-id.ts` — RoleId VO (number > 0)
- `packages/domain/src/role/value-objects/role-name.ts` — RoleName VO (string 2-50 chars, unique)
- `packages/domain/src/role/repositories/role-repository.ts` — RoleRepository port: `findById`, `findByName`, `findAll`, `save`, `delete`, `hasUsers`

**Archivos a modificar:**
- `packages/domain/src/index.ts` — Exportar Role, RoleId, RoleName, RoleRepository; eliminar export de enum Role

**Archivos a eliminar:**
- `packages/domain/src/shared/value-objects/role.ts` — Reemplazar por Role entity + VOs

**Dependencias:** Ninguna

**Criterio de aceptación:**
- [x] RoleId rejecta valores <= 0
- [x] RoleName rejecta strings vacíos, > 50 chars
- [x] Role.isAtLeast(1) es true para role id=1, false para role id=3
- [x] RoleRepository interface compila y exporta los 6 métodos
- [x] `packages/domain/src/index.ts` exporta los nuevos tipos sin errores
- [x] Tests unitarios verdes para Role, RoleId, RoleName

---

## T2: Domain — Actualizar User entity para usar roleId

**Objetivo:** Cambiar User para que use `roleId: number` en lugar de `role: RoleVO`, manteniendo compatibilidad con `roleName` string.

**Archivos a modificar:**
- `packages/domain/src/auth/entities/user.ts` — `role: RoleVO` → `roleId: number`. `getIdentity()` devuelve `{ roleId, roleName }`
- `packages/domain/src/auth/value-objects/user-identity.ts` — `role: RoleVO` → `roleId: number, roleName: string`
- `packages/domain/src/index.ts` — Actualizar exports de User/UserIdentity

**Dependencias:** T1

**Criterio de aceptación:**
- [ ] User.create() acepta `roleId` en lugar de `role`
- [ ] User.getIdentity() devuelve `{ roleId, roleName }` sin RoleVO
- [ ] Tests existentes de User adaptados y verdes
- [ ] No hay referencias a `RoleVO` en User entity

---

## T3: Infra — Prisma schema + migración

**Objetivo:** Agregar tabla Role al schema de Prisma y crear las migraciones iniciales.

**Archivos a modificar:**
- `api/prisma/schema.prisma` — Agregar `model Role`, cambiar `User.role` → `roleId Int`, cambiar `UserEmpresa.role` → `roleId Int`. ~~NO eliminar enum Role todavía.~~ **Desviación**: Enum Role eliminado por instrucción explícita del apply (criterio de aceptación del usuario).

**Archivos a crear:**
- `api/prisma/migrations/20260521164641_add_role_table/migration.sql` — CREATE TABLE roles, INSERT 4 seeds (1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario), ALTER TABLE users ADD roleId INT, migrar datos, FK constraint, DROP old role columns, DROP TYPE "Role". Repetir para user_empresas.

**Dependencias:** T1, T2

**Criterio de aceptación:**
- [x] `npx prisma generate` compila sin errores
- [x] Migration SQL creada con CREATE TABLE + 4 seeds + migración de datos + FK + cleanup del enum
- [x] User tiene `roleId Int` y `role Role @relation(...)`; UserEmpresa tiene `roleId Int` y `empresaRole Role @relation(...)`
- [x] Enum `Role` eliminado del schema (por instrucción explícita del usuario en apply; original tasks.md decía conservarlo)
- [x] Migration incluye up y down SQL

---

## T4: Infra — PrismaRoleRepository + actualizar PrismaUserRepository ✅

**Objetivo:** Implementar RoleRepository con Prisma y actualizar PrismaUserRepository para usar roleId, eliminando user-mapper.ts.

**Archivos a crear:**
- `api/src/infrastructure/persistence/prisma/repositories/prisma-role.repository.ts` — Implementación de RoleRepository con Prisma

**Archivos a modificar:**
- `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts` — Construir User directamente sin mapper, usar `roleId` en lugar de `role`
- `api/src/infrastructure/persistence/prisma/mappers/user-mapper.ts` — ELIMINAR este archivo; mover lógica de mappers de email/password inline al repositorio si es necesario

**Dependencias:** T1, T2, T3

**Criterio de aceptación:**
- [x] PrismaRoleRepository implementa los 6 métodos del RoleRepository port
- [x] PrismaUserRepository ya no importa user-mapper.ts
- [x] PrismaUserRepository construye User con `roleId` directamente
- [x] `user-mapper.ts` eliminado del filesystem
- [ ] Tests de integración de PrismaRoleRepository verdes (→ T10)
- [ ] Tests de PrismaUserRepository adaptados y verdes (→ T10)

---

## T5: Infra — Actualizar seed files ✅

**Objetivo:** Actualizar los seed files para crear usuarios con roleId en lugar de enum Role.

**Archivos a modificar:**
- `api/prisma/seed.ts` — Seed de roles primero, luego usuarios con `roleId: 1/2/3/4` en lugar de `Role.ADMIN`
- `api/src/infrastructure/persistence/seed.ts` — Igual: seed de roles + usuarios con roleId

**Dependencias:** T3, T4

**Criterio de aceptación:**
- [x] `npx prisma db seed` ejecuta sin errores
- [x] Se crean 4 roles en la tabla
- [x] Usuarios de prueba tienen roleId válido (no enum)
- [x] No hay referencias a `Role.ADMIN`, `Role.SUPERVISOR`, etc. en seed files

---

## T6: Application — Role use cases ✅

**Objetivo:** Crear los 4 use cases para CRUD de roles con validaciones de permisos.

**Archivos a crear:**
- `api/src/application/role/use-cases/create-role.use-case.ts` — CreateRoleUseCase (Admin only, valida nombre único)
- `api/src/application/role/use-cases/update-role.use-case.ts` — UpdateRoleUseCase (Admin only)
- `api/src/application/role/use-cases/delete-role.use-case.ts` — DeleteRoleUseCase (Admin only, rechaza si hay usuarios asignados)
- `api/src/application/role/use-cases/list-roles.use-case.ts` — ListRolesUseCase (Admin y Supervisor)
- `api/src/application/role/dtos/create-role.dto.ts` — DTO con name + description opcional
- `api/src/application/role/dtos/update-role.dto.ts` — DTO con name + description opcionales
- `api/src/application/role/dtos/role-response.dto.ts` — DTO de respuesta { id, name, description }
- `api/src/application/role/ports/role-repository-port.ts` — Re-export del port de dominio para DI de NestJS

**Dependencias:** T1, T4

**Criterio de aceptación:**
- [x] CreateRoleUseCase rechaza nombres duplicados (409)
- [x] CreateRoleUseCase solo permite caller con roleId=1
- [x] DeleteRoleUseCase rechaza si hasUsers() es true (409)
- [x] ListRolesUseCase permite roleId=1 y roleId=2
- [x] Todos los use cases devuelven Result<...> con errores de dominio apropiados
- [ ] Tests unitarios con mock repository verdes (deferido a T10)

---

## T7: Application — Actualizar auth use cases para roleId

**Objetivo:** Adaptar todos los auth use cases para usar roleId en lugar de enum Role string.

**Archivos a modificar:**
- `api/src/application/auth/use-cases/register-user.use-case.ts` — `dto.role` string → `dto.roleId` number; validar Supervisor no asigna roleId=1
- `api/src/application/auth/use-cases/login.use-case.ts` — JWT payload incluye `roleId`; UserProfileDTO devuelve `role: { id, name }` expandido
- `api/src/application/auth/use-cases/refresh-token.use-case.ts` — Payload con roleId
- `api/src/application/auth/use-cases/select-empresa.use-case.ts` — Payload con roleId
- `api/src/application/auth/use-cases/list-users.use-case.ts` — CallerContext usa roleId; agregar filtro por roleId
- `api/src/application/auth/use-cases/update-user.use-case.ts` — role string → roleId
- `api/src/application/auth/use-cases/delete-user.use-case.ts` — CallerContext roleId
- `api/src/application/auth/use-cases/get-current-user.use-case.ts` — UserProfileDTO con roleId + role expandido
- `api/src/application/auth/dtos/user-profile.dto.ts` — `role: string` → `roleId: number, role: { id, name }`
- `api/src/application/auth/dtos/caller-context.dto.ts` — Mantener `callerRole: string` (name), agregar `callerRoleId: number`
- `api/src/application/auth/ports/auth-port.ts` — TokenPayload: `role: string, roleId: number`
- `api/src/application/empresas/use-cases/assign-user-to-empresa.use-case.ts` — `role` string → `roleId` number

**Dependencias:** T1, T2, T4, T6

**Criterio de aceptación:**
- [ ] RegisterUser acepta `roleId` numérico; Supervisor no puede asignar roleId=1
- [ ] Login devuelve JWT con `roleId` + `role` string en payload
- [ ] Login response body incluye `role: { id, name }` expandido
- [ ] ListUsers filtra por `roleId` cuando se pasa como query param
- [ ] Todos los use cases compilan sin referencias a enum Role del dominio
- [ ] Tests unitarios adaptados y verdes

---

## T8: Presentation — Role controller + actualizar auth/empresas controllers ✅

**Objetivo:** Crear RoleController con endpoints CRUD y actualizar todos los controllers existentes para usar roleId.

**Archivos a crear:**
- `api/src/presentation/role/role.controller.ts` — GET/POST/PATCH/DELETE `/roles`
- `api/src/presentation/role/role.module.ts` — NestJS module wiring (providers, imports, controllers)

**Archivos a modificar:**
- `api/src/presentation/auth/auth.controller.ts` — `@Roles(Role.Admin)` → `@Roles(1)`; DTOs con roleId
- `api/src/presentation/empresas/empresas.controller.ts` — `@Roles(Role.Admin)` → `@Roles(1)`; assign-user con roleId
- `api/src/presentation/messaging/messaging.controller.ts` — Actualizar decorators si usan Role enum
- `api/src/infrastructure/auth/guards/roles.guard.ts` — Comparación por roleId numérico + fallback string para transición
- `api/src/infrastructure/auth/decorators/roles.decorator.ts` — `Roles(...roleIds: number[])` con soporte fallback string
- `api/src/infrastructure/auth/guards/auth.guard.ts` — req.user incluye `roleId`
- `api/src/infrastructure/auth/jwt-auth-port.ts` — sign() incluye `roleId` en JWT payload
- `api/src/app.module.ts` — Importar RoleModule

**Dependencias:** T6, T7

**Criterio de aceptación:**
- [x] POST /roles crea rol (Admin only) → 201
- [x] GET /roles lista roles (Admin, Supervisor) → 200
- [x] PATCH /roles/:id actualiza rol (Admin only) → 200
- [x] DELETE /roles/:id elimina rol sin usuarios (Admin only) → 204; con usuarios → 409
- [x] GET /roles sin token → 401
- [x] AuthController endpoints usan `@Roles(1)` o `@Roles(1, 2)` numéricos
- [x] RolesGuard compara numéricamente con fallback string
- [x] API compila y arranca sin errores

---

## T9: Frontend — Role admin page + actualizar selectores

**Objetivo:** Crear página de administración de roles y actualizar selectores de roles en frontend para consumir API.

**Archivos a crear:**
- `web/src/pages/roles-admin.page.tsx` — CRUD de roles (solo visible para Admin), tabla con nombre/descripción, botones editar/eliminar, form crear/editar
- `web/src/api/roles.ts` — Funciones: `fetchRoles()`, `createRole()`, `updateRole()`, `deleteRole()`

**Archivos a modificar:**
- `web/src/pages/users-admin.page.tsx` — `<select>` de roles poblado desde `GET /roles` en lugar de constantes locales
- `web/src/pages/empresas-admin.page.tsx` — Actualizar si usa roles (assign-user con roleId)
- `web/src/constants/roles.ts` — Simplificar a helpers sobre roleId/roleName de API; eliminar enum de constantes
- `web/src/api/client.ts` — Agregar exports de funciones de roles
- `web/src/contexts/auth.context.tsx` — Actualizar si guarda role como string; asegurar que usa roleId del JWT

**Dependencias:** T8

**Criterio de aceptación:**
- [ ] roles-admin.page.tsx renderiza tabla de roles desde API
- [ ] Admin puede crear/editar/eliminar roles desde la UI
- [ ] users-admin.page.tsx selector de roles se pobla dinámicamente
- [ ] No hay referencias a enum Role constants en frontend
- [ ] roles-admin solo es accesible para usuarios con roleId=1
- [ ] Web app compila sin errores

---

## T10: Tests — Unitarios + integración + regresión

**Objetivo:** Ejecutar y adaptar toda la suite de tests para cubrir el nuevo sistema de roles con IDs numéricos.

**Tests a crear:**
- Domain: `packages/domain/src/__tests__/role.test.ts` — Role entity, RoleId, RoleName VOs, isAtLeast()
- Application: `api/src/application/role/__tests__/create-role.use-case.spec.ts` — mock repository
- Application: `api/src/application/role/__tests__/update-role.use-case.spec.ts` — mock repository
- Application: `api/src/application/role/__tests__/delete-role.use-case.spec.ts` — mock repository, test FK rejection
- Application: `api/src/application/role/__tests__/list-roles.use-case.spec.ts` — mock repository
- Integration: `api/src/infrastructure/persistence/prisma/repositories/__tests__/prisma-role.repository.spec.ts` — PrismaRoleRepository con test DB
- Integration: `api/src/presentation/role/__tests__/role.controller.spec.ts` — Supertest + test DB, AuthGuard + RolesGuard

**Tests a modificar:**
- `packages/domain/src/__tests__/user.test.ts` — Adaptar a roleId
- `api/src/application/auth/__tests__/login.use-case.spec.ts` — JWT con roleId, response con role expandido
- `api/src/application/auth/__tests__/register-user.use-case.spec.ts` — roleId en lugar de role string
- `api/src/application/auth/__tests__/list-users.use-case.spec.ts` — Filtro por roleId
- `api/src/infrastructure/auth/__tests__/roles.guard.spec.ts` — Comparación numérica + fallback string
- `web/src/__tests__/roles.test.ts` — Actualizar a roleId
- Todos los tests que referencien enum Role del dominio o de Prisma

**Dependencias:** T1-T9 (todo implementado)

**Criterio de aceptación:**
- [ ] `npm test --workspace=packages/domain` — todos verdes
- [ ] `npm test --workspace=api` — todos verdes (unit + integration)
- [ ] Auth regression: login, register, guards funcionan con roleId
- [ ] Role CRUD endpoints: tests de integración verdes
- [ ] `npm test --workspace=web` — todos verdes
- [ ] 0 tests failing, 0 tests skipped por incompatibilidad con roleId
- [ ] Coverage no disminuye respecto a baseline pre-cambio
