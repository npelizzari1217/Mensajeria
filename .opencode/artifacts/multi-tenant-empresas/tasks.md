---
id: multi-tenant-empresas-tasks
version: 1
lineage:
  derived_from: multi-tenant-empresas-design
created_at: "2026-05-20T18:15:00Z"
---

# Tasks: Multi-Tenant Empresas

## Commit Plan

| Commit | Alcance | Archivos |
|---|---|---|
| `feat(domain): add EmpresaId VO and Empresa entity` | Domain | 3 |
| `feat(domain): add empresaId to Message, Group, Draft entities` | Domain | 3 |
| `feat(domain): add empresaId to repository interfaces` | Domain | 4 |
| `feat(db): add Empresa, UserEmpresa models + migration` | Schema | 2 |
| `feat(auth): login returns empresas, select-empresa endpoint` | Auth | 5 |
| `feat(infra): add empresaId filter to all Prisma repositories` | Infra | 4 |
| `feat(messaging): scope all use cases by empresaId` | App | 8 |
| `feat(groups): scope group use cases by empresaId` | App | 6 |
| `feat(drafts): scope draft use cases by empresaId` | App | 6 |
| `feat(auth): guard validates empresaId and membership` | Presentation | 2 |
| `test(domain): add empresaId tests` | Test | 4 |

---

## Tasks — Orden de Ejecución

### T1: Crear EmpresaId VO
- **Archivos**: `packages/domain/src/shared/value-objects/empresa-id.ts` (NUEVO)
- **Qué hace**: Value Object inmutable con `create(value: string)` y `reconstruct(existing: string)`. Valida UUID v4.
- **Tests**: `packages/domain/src/__tests__/empresa-id.test.ts`

### T2: Crear Empresa Entity
- **Archivos**: `packages/domain/src/auth/entities/empresa.ts` (NUEVO)
- **Qué hace**: Entity con `{ id: EmpresaId, nombre: string, createdAt: Timestamp }`. Factory `create(nombre)` y `reconstruct(props)`.
- **Deps**: T1

### T3: Modificar Message.create() — agregar empresaId
- **Archivos**: `packages/domain/src/messaging/entities/message.ts` (MOD)
- **Qué hace**: `Message.create()` recibe `empresaId: EmpresaId`. Props y reconstruct incluyen empresaId. Getter `getEmpresaId()`.
- **Tests**: Modificar `message.test.ts`

### T4: Modificar Group.create() — agregar empresaId
- **Archivos**: `packages/domain/src/messaging/entities/group.ts` (MOD)
- **Qué hace**: `Group.create()` recibe `empresaId: EmpresaId`. Getter `getEmpresaId()`.
- **Tests**: Modificar `group.test.ts`

### T5: Modificar Draft.create() — agregar empresaId
- **Archivos**: `packages/domain/src/messaging/entities/draft.ts` (MOD)
- **Qué hace**: `Draft.create()` recibe `empresaId: EmpresaId`. Getter `getEmpresaId()`.
- **Tests**: Modificar `draft.test.ts`

### T6: Actualizar repository interfaces con empresaId
- **Archivos**: 
  - `packages/domain/src/messaging/repositories/message-repository.ts` (MOD)
  - `packages/domain/src/messaging/repositories/group-repository.ts` (MOD)
  - `packages/domain/src/messaging/repositories/draft-repository.ts` (MOD)
  - `packages/domain/src/auth/repositories/user-repository.ts` (MOD: + getEmpresas, isMemberOf)
- **Qué hace**: Agregar `empresaId: EmpresaId` a firmas `findBy*`, `search`. Agregar `getEmpresas(userId)` y `isMemberOf(userId, empresaId)` a UserRepository.

### T7: Actualizar domain/index.ts exports
- **Archivos**: `packages/domain/src/index.ts` (MOD)
- **Qué hace**: Exportar EmpresaId, Empresa, EmpresaProps.
- **Deps**: T1, T2

### T8: Actualizar schema.prisma
- **Archivos**: `api/prisma/schema.prisma` (MOD)
- **Qué hace**: Agregar modelos Empresa, UserEmpresa. Agregar empresa_id FK a Message, Group, Draft, ConversationThread, RefreshToken.
- **Deps**: T1-T7 (domain listo)

### T9: Crear migración Prisma
- **Archivos**: `api/prisma/migrations/*` (NUEVO)
- **Qué hace**: SQL migration con 6 pasos (crear empresas → insert default → alter nullable → assign values → user_empresas → NOT NULL + FK). Empresa default con ID fijo `00000000-0000-0000-0000-000000000001`.
- **Deps**: T8

### T10: Actualizar TokenPayload y AuthPort
- **Archivos**: `api/src/application/auth/ports/auth-port.ts` (MOD)
- **Qué hace**: `TokenPayload` incluye `empresaId?: string`. Nuevo método opcional.
- **Deps**: T7

### T11: LoginUseCase — devolver empresas
- **Archivos**: `api/src/application/auth/use-cases/login.use-case.ts` (MOD)
- **Qué hace**: Después de autenticar, llama `userRepo.getEmpresas(userId)` y las incluye en la respuesta. Token inicial SIN empresaId.
- **Deps**: T10

### T12: Crear SelectEmpresaUseCase
- **Archivos**: `api/src/application/auth/use-cases/select-empresa.use-case.ts` (NUEVO)
- **Qué hace**: Valida `userRepo.isMemberOf(userId, empresaId)`. Si activo, genera token CON empresaId.
- **Deps**: T10

### T13: Actualizar RegisterUserUseCase
- **Archivos**: `api/src/application/auth/use-cases/register-user.use-case.ts` (MOD)
- **Qué hace**: Recibe `empresaId` en DTO. Valida empresa existe. Crea user + user_empresas en misma transacción.
- **Deps**: T10

### T14: Actualizar DTOs de auth
- **Archivos**: `api/src/application/auth/dtos/login.dto.ts`, `register-user.dto.ts`, `auth-response.dto.ts` (MOD)
- **Qué hace**: LoginResponse incluye `empresas[]`. RegisterDTO incluye `empresaId`.
- **Deps**: T11, T13

### T15: Actualizar PrismaUserRepository
- **Archivos**: `api/src/infrastructure/persistence/prisma-user.repository.ts` (MOD)
- **Qué hace**: Implementar `getEmpresas(userId)` con JOIN a user_empresas + empresas. Implementar `isMemberOf(userId, empresaId)`.
- **Deps**: T9

### T16: Actualizar PrismaMessageRepository
- **Archivos**: `api/src/infrastructure/persistence/prisma-message.repository.ts` (MOD)
- **Qué hace**: Agregar `empresaId` a todos los queries: `where: { empresaId: empresaId.get() }`. Mapper incluye empresaId.
- **Deps**: T9

### T17: Actualizar PrismaGroupRepository
- **Archivos**: `api/src/infrastructure/persistence/prisma-group.repository.ts` (MOD)
- **Qué hace**: Agregar `empresaId` a todos los queries.
- **Deps**: T9

### T18: Actualizar PrismaDraftRepository
- **Archivos**: `api/src/infrastructure/persistence/prisma-draft.repository.ts` (MOD)
- **Qué hace**: Agregar `empresaId` a todos los queries.
- **Deps**: T9

### T19: Actualizar JwtAuthPort
- **Archivos**: `api/src/infrastructure/auth/jwt-auth-port.ts` (MOD)
- **Qué hace**: Aceptar `empresaId` opcional en `sign()`. Si presente, incluirlo en el payload.
- **Deps**: T10

### T20: Scoping use cases de messaging
- **Archivos**: 
  - `api/src/application/messaging/use-cases/send-message.use-case.ts` (MOD)
  - `api/src/application/messaging/use-cases/get-inbox.use-case.ts` (MOD)
  - `api/src/application/messaging/use-cases/get-sent.use-case.ts` (MOD)
  - `api/src/application/messaging/use-cases/get-message.use-case.ts` (MOD)
  - `api/src/application/messaging/use-cases/search-messages.use-case.ts` (MOD)
  - `api/src/application/messaging/use-cases/mark-as-read.use-case.ts` (MOD)
  - `api/src/application/messaging/use-cases/reply-to-message.use-case.ts` (MOD)
  - `api/src/application/messaging/use-cases/forward-message.use-case.ts` (MOD)
- **Qué hace**: Extraer `empresaId` del user context/dto. Pasarlo a `Message.create()` y a cada query del repository.

### T21: Scoping use cases de groups
- **Archivos**: Todos en `api/src/application/groups/use-cases/` (MOD, ~6 archivos)
- **Qué hace**: `empresaId` en create/update/queries de grupos.

### T22: Scoping use cases de drafts
- **Archivos**: Todos en `api/src/application/drafts/use-cases/` (MOD, ~6 archivos)
- **Qué hace**: `empresaId` en create/update/queries de borradores.

### T23: Actualizar AuthGuard
- **Archivos**: `api/src/presentation/auth/guards/auth.guard.ts` (MOD)
- **Qué hace**: Extraer `empresaId` del JWT. Si endpoint requiere scoping, validar que el token tenga empresaId y que `isMemberOf(userId, empresaId)` sea true.

### T24: Actualizar @CurrentUser decorator
- **Archivos**: `api/src/presentation/auth/decorators/current-user.ts` (MOD)
- **Qué hace**: Extraer `empresaId` del request y exponerlo en el contexto.

### T25: Agregar endpoint select-empresa
- **Archivos**: `api/src/presentation/auth/auth.controller.ts` (MOD)
- **Qué hace**: `POST /v1/auth/select-empresa` delega a SelectEmpresaUseCase.

### T26: Actualizar AuthController (login response)
- **Archivos**: `api/src/presentation/auth/auth.controller.ts` (MOD)
- **Qué hace**: Login response ahora incluye `empresas[]`.

### T27: Tests de dominio
- **Archivos**: 
  - `packages/domain/src/__tests__/empresa-id.test.ts` (NUEVO)
  - `packages/domain/src/__tests__/message.test.ts` (MOD: empresaId en create)
  - `packages/domain/src/__tests__/group.test.ts` (MOD: empresaId en create)
  - `packages/domain/src/__tests__/draft.test.ts` (MOD: empresaId en create)
- **Deps**: T1-T5

### T28: Tests de aplicación
- **Archivos**: `api/src/application/auth/__tests__/`, `api/src/application/messaging/__tests__/` (MOD)
- **Qué hace**: Mockear empresaId en use cases. Verificar que login devuelve empresas. Verificar que sendMessage pasa empresaId al repo.

### T29: Verificación final
- Ejecutar `tsc --noEmit` (0 errores)
- Ejecutar `vitest` (todos pasan)
- Ejecutar migración en test DB
- Architecture guardian: sin imports de infra en domain, sin circulares
