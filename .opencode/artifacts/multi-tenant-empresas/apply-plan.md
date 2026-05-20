---
id: multi-tenant-empresas-apply-plan
version: 1
lineage:
  derived_from: multi-tenant-empresas-tasks
created_at: "2026-05-20T18:18:00Z"
---

# Apply Plan: Multi-Tenant Empresas

## Impact Analysis

| Área | Archivos | Impacto | Riesgo |
|---|---|---|---|
| `packages/domain/src/shared/` | +1 (EmpresaId VO) | Nuevo | Bajo |
| `packages/domain/src/auth/` | +1 (Empresa), 1 mod (User), 1 mod (UserRepository) | Medio | Bajo |
| `packages/domain/src/messaging/` | 3 mod (Message, Group, Draft), 3 mod (repos) | Medio | Bajo |
| `packages/domain/src/index.ts` | 1 mod (exports) | Bajo | Bajo |
| `api/prisma/schema.prisma` | +2 modelos, +5 FK columns | Alto | Medio |
| `api/prisma/migrations/` | +1 migration SQL | Alto | Alto |
| `api/src/application/auth/` | +1 use case (select-empresa), 2 mod, 3 mod (DTOs), 1 mod (port) | Medio | Medio |
| `api/src/application/messaging/` | 8 mod | Medio | Bajo |
| `api/src/application/groups/` | ~6 mod | Medio | Bajo |
| `api/src/application/drafts/` | ~6 mod | Medio | Bajo |
| `api/src/infrastructure/` | 5 mod (Prisma repos + JWT) | Alto | Medio |
| `api/src/presentation/` | 3 mod (controller + guard + decorator) | Medio | Medio |
| Tests | +1 nuevo, 3 mod domain, ~4 mod application | Bajo | Bajo |

## Execution Order

```
Fase 1: DOMINIO (sin romper nada)
  T1 → T2 → T3 → T4 → T5 → T6 → T7
  (EmpresaId VO → Empresa entity → Message/Group/Draft + empresaId → repos interfaces → exports)
  ⏱ ~20 min

Fase 2: SCHEMA (migración)
  T8 → T9
  (schema.prisma → migration SQL con empresa default)
  ⏱ ~15 min
  ⚠️ Punto de no retorno: migration ejecutada

Fase 3: AUTH (login multi-empresa)
  T10 → T11 → T12 → T13 → T14 → T19
  (TokenPayload → LoginUseCase → SelectEmpresaUseCase → RegisterUserUseCase → DTOs → JwtAuthPort)
  ⏱ ~25 min

Fase 4: INFRA (repositorios)
  T15 → T16 → T17 → T18
  (PrismaUserRepo → PrismaMessageRepo → PrismaGroupRepo → PrismaDraftRepo)
  ⏱ ~20 min

Fase 5: APLICACIÓN (use cases)
  T20 → T21 → T22
  (Messaging use cases → Groups use cases → Drafts use cases)
  ⏱ ~30 min

Fase 6: PRESENTACIÓN (guards + endpoints)
  T23 → T24 → T25 → T26
  (AuthGuard → @CurrentUser → select-empresa endpoint → login response)
  ⏱ ~15 min

Fase 7: TESTS
  T27 → T28 → T29
  (Domain tests → Application tests → Verificación final)
  ⏱ ~20 min
```

## Contracts Affected

| Contract | Cambio | Breaking? |
|---|---|---|
| `POST /v1/auth/login` response | Agrega `empresas: []` al response | **No** — aditivo |
| `POST /v1/auth/register` request | Agrega `empresaId` opcional | **No** — default a "Default" |
| `POST /v1/auth/select-empresa` | NUEVO endpoint | **No** — nuevo |
| `GET /v1/messaging/inbox` | Resultados ahora filtrados por empresaId del token | **Sí** — pero mismo comportamiento con empresa default |
| `GET /v1/messaging/sent` | Resultados ahora filtrados por empresaId del token | **Sí** — pero mismo comportamiento con empresa default |
| `GET /v1/groups` | Resultados ahora filtrados por empresaId | **Sí** — pero mismo comportamiento con empresa default |
| `GET /v1/drafts` | Resultados ahora filtrados por empresaId | **Sí** — pero mismo comportamiento con empresa default |
| JWT Token payload | Agrega `empresaId` (opcional, solo post-select) | **Sí** — tokens viejos sin empresaId son rechazados en endpoints scoped |

## Rollback Plan

1. **Revertir migration**: `prisma migrate reset` o `prisma migrate diff` para generar rollback SQL
2. **Revertir código**: `git revert` los commits en orden inverso
3. **Datos**: Las columnas `empresa_id` son aditivas — eliminar columnas no destruye datos existentes
4. **Tokens**: Los refresh tokens viejos se invalidan — usuarios deben re-login

## Migration Risks

| Riesgo | Mitigación |
|---|---|
| Migration falla en producción por locks | Ejecutar en ventana de mantenimiento. Las ALTER TABLE ADD COLUMN son rápidas en PostgreSQL |
| Datos inconsistentes post-migración | La empresa default con ID fijo garantiza consistencia. Validar con `SELECT count(*) WHERE empresa_id IS NULL` |
| Usuarios no pueden loguearse después | Login sigue funcionando igual. Solo el select-empresa es nuevo. El token inicial sin empresaId permite llegar al selector |
| Refresh tokens existentes se rompen | Aceptado — logout forzado. Comunicar a usuarios |
| Frontend no tiene selector de empresa | El token pre-selección permite acceso a endpoints no-scoped. Se puede hacer deploy backend primero |

## Gate Pre-Check

| Gate | Estado esperado |
|---|---|
| `architecture_guardian` | Debe pasar: domain sin imports de infra, sin circulares |
| `contracts_intact` | Aditivo — no se rompen contratos existentes |
| `verify_passed` | Tests nuevos + existentes deben pasar |
| `no_critical_risks` | Migration risk mitigado con default empresa |
