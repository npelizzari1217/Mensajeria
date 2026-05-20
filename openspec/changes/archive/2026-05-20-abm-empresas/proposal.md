---
title: "ABM Empresas"
change: abm-empresas
phase: propose
artifact: proposal
status: draft
---

# Proposal: ABM Empresas

## Intent

El sistema no tiene gestión de empresas ni enforcement de acceso por empresa. Admin puede ver todos los usuarios sin filtro, Supervisor no tiene scope propio, y cualquier caller puede registrar usuarios sin restricción. Este cambio introduce CRUD completo de empresas y hace cumplir las reglas de negocio RBAC para usuarios y empresas.

## Scope

### In Scope
- `EmpresaRepository` port en dominio + implementación Prisma
- `Empresa.rename()` + `EmpresaNotFoundError` / `EmpresaNameAlreadyExistsError` en dominio
- 6 use cases: CreateEmpresa, ListEmpresas, GetEmpresa, UpdateEmpresa, DeleteEmpresa, AssignUserToEmpresa
- Enforce caller context en RegisterUser, UpdateUser, DeleteUser, ListUsers (scope Supervisor a su empresa)
- `EmpresasController` con guardas RBAC + módulo NestJS
- ABM Empresas en web (`empresas-admin.page.tsx`) con selector de empresa en `users-admin.page.tsx`
- `UserRepository.findAllByEmpresaId` en port e implementación

### Out of Scope
- Migración Prisma (modelos `Empresa` y `UserEmpresa` ya existen)
- OAuth / SSO / 2FA
- Permisos granulares por recurso dentro de empresa
- Audit log de cambios en empresa

## Capabilities

### New Capabilities
- `empresa-management`: CRUD de empresas + asignación de usuarios a empresa, protegido por RBAC

### Modified Capabilities
- `user-auth`: Registro, listado, edición y borrado de usuarios ahora requieren caller context; scope de Supervisor restringido a su empresa

## Approach

Seguir Clean Architecture existente: el dominio expone puerto `EmpresaRepository`, la infraestructura lo implementa con Prisma. Los use cases reciben un `CallerContext` (id + role + empresaId) que se extrae del JWT en los controladores. El guard RBAC existente (`RolesGuard`) se reutiliza tal cual para proteger los nuevos endpoints. No hay cambios de schema — solo código.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/domain/src/auth/entities/empresa.ts` | Modified | Agregar `rename()` |
| `packages/domain/src/auth/repositories/user-repository.ts` | Modified | Agregar `findAllByEmpresaId` |
| `packages/domain/src/auth/repositories/empresa-repository.ts` | New | Puerto EmpresaRepository |
| `packages/domain/src/auth/errors/` | Modified | EmpresaNotFoundError, EmpresaNameAlreadyExistsError |
| `api/src/application/empresas/` | New | 6 use cases |
| `api/src/application/auth/use-cases/register-user.use-case.ts` | Modified | Caller context enforcement |
| `api/src/application/auth/use-cases/list-users.use-case.ts` | Modified | Scope por empresa para Supervisor |
| `api/src/application/auth/use-cases/update-user.use-case.ts` | Modified | Caller context |
| `api/src/application/auth/use-cases/delete-user.use-case.ts` | Modified | Caller context |
| `api/src/infrastructure/persistence/prisma/mappers/empresa-mapper.ts` | New | Mapper Empresa |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-empresa.repository.ts` | New | Implementación EmpresaRepository |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts` | Modified | findAllByEmpresaId |
| `api/src/presentation/empresas/` | New | EmpresasController + módulo |
| `api/src/presentation/auth/auth.controller.ts` | Modified | Caller context + guards en register |
| `web/src/pages/empresas-admin.page.tsx` | New | ABM Empresas |
| `web/src/pages/users-admin.page.tsx` | Modified | Empresa selector + RBAC en UI |
| `web/src/App.tsx` | Modified | Ruta empresa |
| `web/src/api/client.ts` | Modified | Métodos empresa API |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Use cases de usuario existentes sin CallerContext rompen callers actuales | Med | Introducir CallerContext como opcional primero; enforcement en segunda pasada |
| Supervisor queda sin empresa asignada en datos existentes | Low | Seed o migration script crea empresa default y asigna usuarios huérfanos |
| ABM web expone endpoints sin guards si el módulo NestJS no los registra | Low | Test E2E en verify: 403 sin token Admin |

## Rollback Plan

Los cambios de dominio y use cases son aditivos. Si algo falla en producción:
1. Revertir el commit del `EmpresasModule` en `app.module.ts` para desregistrar los endpoints nuevos.
2. Los use cases de auth modificados pueden revertirse a la versión anterior sin afectar schema.
3. No hay migraciones de DB pendientes — rollback sin riesgo de datos.

## Dependencies

- Modelos `Empresa` y `UserEmpresa` ya presentes en `api/prisma/schema.prisma`
- `RolesGuard` y `@Roles()` ya disponibles en infraestructura

## Success Criteria

- [ ] Admin puede crear, editar, borrar y listar empresas vía API
- [ ] Admin puede asignar cualquier usuario a cualquier empresa
- [ ] Supervisor solo ve y gestiona usuarios de su propia empresa (403 fuera de scope)
- [ ] POST /auth/register requiere AuthGuard; Supervisor solo crea usuarios en su empresa
- [ ] Técnico / Usuario reciben 403 en todos los endpoints de admin
- [ ] ABM Empresas visible y funcional en web para rol Admin
- [ ] Users-admin.page filtra por empresa cuando el caller es Supervisor
