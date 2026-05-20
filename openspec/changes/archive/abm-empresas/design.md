---
title: "ABM Empresas — Design"
change: abm-empresas
phase: design
artifact: design
status: draft
---

# Design: ABM Empresas

## Technical Approach

Extend the existing Clean Architecture stack — domain port → Prisma adapter → NestJS use cases → controller — following exactly the same patterns as the `auth` bounded context. No new patterns introduced. The `Empresa` and `UserEmpresa` models already exist in Prisma; only code is added. Caller context (`CallerContext`) is introduced as a shared DTO and threaded through all four modified auth use cases to enforce RBAC scoping at the application layer.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Enforce Supervisor scope in controller vs use case | Controller: fast, leaks domain rule into presentation. Use case: correct layer, testable in isolation. | **Use case** — pass `CallerContext`; controller extracts it from `@CurrentUser()`. |
| `findAllByEmpresaId` as new repo method vs filter in `findAll` | Filter: no new port method, but loads all users. New method: DB-side filter, correct abstraction. | **New repo method** — `UserRepository.findAllByEmpresaId(id)`. |
| `EmpresaNameAlreadyExistsError` checked in use case vs domain entity | Domain: pure. Use case: repo call needed to check uniqueness — only use case has repo. | **Use case** checks `existsByNombre` before calling `Empresa.create()`. |
| Separate `EmpresasModule` vs extend `AuthModule` | Extend: simpler. Separate: follows existing pattern (one module per feature), keeps `AuthModule` focused. | **Separate `EmpresasModule`** — mirrors `AuthModule` wiring pattern. |
| `AssignUserToEmpresa` reuses `UserRepository.addToEmpresa` (already exists) vs new repo method | Reuse: avoids duplication. New: cleaner semantics. | **Reuse existing** `addToEmpresa` — already implemented in `PrismaUserRepository`. |

## Data Flow

### CREATE empresa
```
POST /v1/empresas
  → EmpresasController (@Roles(Admin))
  → CreateEmpresaUseCase.execute(dto, caller)
      existsByNombre → EmpresaNameAlreadyExistsError
      Empresa.create(nombre) → ok | err
      empresaRepo.save(empresa)
  ← 201 { data: EmpresaDTO }
```

### LIST users scoped (Supervisor)
```
GET /v1/auth/contacts
  → AuthController (@Roles(Admin, Supervisor))
  → ListUsersUseCase.execute(caller)
      if caller.role === Supervisor → userRepo.findAllByEmpresaId(caller.empresaId)
      if caller.role === Admin      → userRepo.findAll()
  ← 200 { data: UserProfileDTO[] }
```

### ASSIGN user to empresa
```
POST /v1/empresas/:id/members
  → EmpresasController (@Roles(Admin))
  → AssignUserToEmpresaUseCase.execute(empresaId, userId)
      empresaRepo.findById → EmpresaNotFoundError
      userRepo.findById   → UserNotFoundError
      userRepo.addToEmpresa(userId, empresaId, role)
  ← 201 { data: { userId, empresaId } }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/domain/src/auth/entities/empresa.ts` | Modify | Add `rename(nombre): Result<void, Error>` method |
| `packages/domain/src/auth/repositories/user-repository.ts` | Modify | Add `findAllByEmpresaId(id: EmpresaId): Promise<Result<User[], DomainError>>` |
| `packages/domain/src/auth/repositories/empresa-repository.ts` | Create | `EmpresaRepository` port: findById, findAll, save, delete, existsByNombre |
| `packages/domain/src/auth/errors/empresa.errors.ts` | Create | `EmpresaNotFoundError`, `EmpresaNameAlreadyExistsError` |
| `packages/domain/src/index.ts` | Modify | Export new repo, errors, and empresa-related types |
| `api/src/application/auth/dtos/caller-context.dto.ts` | Create | `CallerContext { callerId, callerRole, callerEmpresaId }` |
| `api/src/application/auth/use-cases/register-user.use-case.ts` | Modify | Accept `CallerContext`; Supervisor can only assign to own empresa |
| `api/src/application/auth/use-cases/list-users.use-case.ts` | Modify | Accept `CallerContext`; scope by empresaId when Supervisor |
| `api/src/application/auth/use-cases/update-user.use-case.ts` | Modify | Accept `CallerContext`; Supervisor can only edit users in own empresa |
| `api/src/application/auth/use-cases/delete-user.use-case.ts` | Modify | Accept `CallerContext`; Supervisor can only delete users in own empresa |
| `api/src/application/empresas/use-cases/create-empresa.use-case.ts` | Create | Admin only; existsByNombre check |
| `api/src/application/empresas/use-cases/list-empresas.use-case.ts` | Create | Returns all empresas |
| `api/src/application/empresas/use-cases/get-empresa.use-case.ts` | Create | findById or EmpresaNotFoundError |
| `api/src/application/empresas/use-cases/update-empresa.use-case.ts` | Create | empresa.rename(); existsByNombre check for new name |
| `api/src/application/empresas/use-cases/delete-empresa.use-case.ts` | Create | empresaRepo.delete() |
| `api/src/application/empresas/use-cases/assign-user-to-empresa.use-case.ts` | Create | Validates both empresa and user exist, then addToEmpresa |
| `api/src/application/empresas/dtos/empresa.dto.ts` | Create | `EmpresaDTO { id, nombre, createdAt }` |
| `api/src/infrastructure/persistence/prisma/mappers/empresa-mapper.ts` | Create | `toDomain(prismaRow): Empresa`, `toPrisma(empresa): PrismaCreateInput` |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-empresa.repository.ts` | Create | Implements `EmpresaRepository` using PrismaService |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts` | Modify | Add `findAllByEmpresaId` via `userEmpresa` join |
| `api/src/presentation/empresas/dto/create-empresa.request.ts` | Create | `{ nombre: string }` |
| `api/src/presentation/empresas/dto/update-empresa.request.ts` | Create | `{ nombre: string }` |
| `api/src/presentation/empresas/empresas.controller.ts` | Create | 6 endpoints; `@UseGuards(AuthGuard, RolesGuard) @Roles(Role.Admin)` |
| `api/src/presentation/empresas/empresas.module.ts` | Create | Wires all 6 use cases + PrismaEmpresaRepository + imports AuthModule |
| `api/src/presentation/auth/auth.controller.ts` | Modify | Add `@UseGuards(AuthGuard, RolesGuard) @Roles(Admin, Supervisor)` to register/list/update/delete; pass `@CurrentUser()` as caller |
| `api/src/app.module.ts` | Modify | Import `EmpresasModule` |
| `web/src/api/client.ts` | Modify | Add empresa API helpers: `getEmpresas`, `createEmpresa`, `updateEmpresa`, `deleteEmpresa`, `assignUserToEmpresa` |
| `web/src/pages/empresas-admin.page.tsx` | Create | CRUD UI for empresas; visible only to ADMIN |
| `web/src/pages/users-admin.page.tsx` | Modify | Empresa dropdown when ADMIN; empresa locked (read-only) when SUPERVISOR |
| `web/src/App.tsx` | Modify | Add `/admin/empresas` route, admin-only guard |

## Interfaces / Contracts

```typescript
// packages/domain/src/auth/repositories/empresa-repository.ts
export interface EmpresaRepository {
  findById(id: EmpresaId): Promise<Result<Empresa, DomainError>>;
  findAll(): Promise<Result<Empresa[], DomainError>>;
  save(empresa: Empresa): Promise<Result<void, DomainError>>;
  delete(id: EmpresaId): Promise<Result<void, DomainError>>;
  existsByNombre(nombre: string): Promise<boolean>;
}

// api/src/application/auth/dtos/caller-context.dto.ts
export interface CallerContext {
  callerId: string;
  callerRole: string;       // matches Role enum string values
  callerEmpresaId: string;
}

// EmpresaDTO (application output)
export interface EmpresaDTO {
  id: string;
  nombre: string;
  createdAt: string;
}
```

**Controller decorator pattern** (mirrors existing auth endpoints):
```typescript
@Post()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@HttpCode(HttpStatus.CREATED)
async createEmpresa(
  @Body() body: CreateEmpresaRequest,
): Promise<{ data: EmpresaDTO }>
```

**`@CurrentUser()` extraction** (already available, no changes needed):
```typescript
// Controller passes caller to use case
const caller: CallerContext = {
  callerId: user.userId,
  callerRole: user.role,
  callerEmpresaId: user.empresaId ?? '',
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Domain | `Empresa.rename()` — empty/over-100-char names | Unit — pure function, no deps |
| Domain | `EmpresaNotFoundError`, `EmpresaNameAlreadyExistsError` | Unit — check `code` and `message` |
| Application | `CreateEmpresaUseCase` — name collision, happy path | Unit — mock `EmpresaRepository` |
| Application | `ListUsersUseCase` — Admin sees all, Supervisor sees scoped | Unit — mock repo, assert correct method called |
| Application | `AssignUserToEmpresaUseCase` — missing empresa/user 404 | Unit — mock both repos |
| Infrastructure | `PrismaEmpresaRepository` | Integration — use test DB with seed |
| Presentation | `EmpresasController` — 403 for Supervisor/Tecnico/Usuario | E2E — assert HTTP status codes |
| Presentation | `POST /auth/register` — 403 without Auth | E2E |

## Migration / Rollout

No migration required. `Empresa` and `UserEmpresa` tables already exist. Changes are purely additive (new code, no schema changes). Rollback: remove `EmpresasModule` import from `app.module.ts`.

## Open Questions

- [ ] Should `DeleteEmpresaUseCase` hard-delete or soft-delete (set `isActive = false`)? Schema has no `isActive` on `Empresa` — assuming hard delete with Cascade on `UserEmpresa`.
- [ ] `users-admin.page.tsx` currently fetches `/auth/contacts` (all users). Supervisor-scoped list needs the same endpoint to filter by empresaId — the use case change covers this, but the endpoint name may be misleading for admins who use it for contact discovery too. Consider a separate `/auth/admin/users` endpoint in a future change to avoid confusion.
