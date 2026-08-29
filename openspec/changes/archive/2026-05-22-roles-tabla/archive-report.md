# Archive Report: roles-tabla

**Archived**: 2026-05-22
**Source**: `openspec/changes/roles-tabla/`
**Destination**: `openspec/changes/archive/2026-05-22-roles-tabla/`

## Summary
Cambio completo: migración de `enum Role` (3 representaciones) a tabla `Role` con ID numérico. CRUD de roles, jerarquía por ID, FK en User/UserEmpresa, eliminación de `user-mapper.ts`.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| role-management | Created | Nuevo spec completo con 3 requirements (Role Table, Role CRUD, Role Read) |
| user-auth | Updated | 5 requirements modificados (Registration, Login, RBAC, Profile, Scoped Admin). Token Refresh preservado sin cambios. |
| empresa-management | Updated | 1 requirement modificado (Assign User to Empresa — agregado roleId). Empresa CRUD preservado sin cambios. |

## Tasks Completion

| Task | Status |
|------|--------|
| T1: Domain — Role entity + VOs + repository port | ✅ |
| T2: Domain — User entity roleId | ✅ |
| T3: Infra — Prisma schema + migration | ✅ |
| T4: Infra — PrismaRoleRepository + PrismaUserRepository + delete user-mapper | ✅ |
| T5: Infra — Seed files | ✅ |
| T6: Application — Role use cases | ✅ |
| T7: Application — Auth use cases roleId | ✅ |
| T8: Presentation — Role controller + guards + decorators | ✅ |
| T9: Frontend — Role admin page + selectors | ✅ |
| T10: Tests — Unit + integration + regression | ✅ |

**Completion**: 10/10 tareas completadas

## Verification Results
- **Tests**: 422 tests (190 API + 232 domain) — todos verdes
- **Build**: domain, api (157 files), web — todos compilan

## Archive Contents
- proposal.md ✅
- design.md ✅
- tasks.md ✅ (10/10 tasks complete)
- specs/role-management/spec.md ✅ (delta)
- specs/user-auth/spec.md ✅ (delta)
- specs/empresa-management/spec.md ✅ (delta)
- archive-report.md ✅

## Source of Truth Updated
The following main specs now reflect the new behavior:
- `openspec/specs/role-management/spec.md` (CREATED)
- `openspec/specs/user-auth/spec.md` (UPDATED)
- `openspec/specs/empresa-management/spec.md` (UPDATED)

## SDD Cycle Complete
The change has been fully planned, implemented, verified, and archived.
