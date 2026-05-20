---
title: "ABM Empresas — Implementation Tasks"
change: abm-empresas
phase: tasks
artifact: tasks
status: draft
---

# Implementation Tasks: ABM Empresas

## Task Ordering

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9
```

Each task depends on the previous one. No parallelism needed for implementation.

---

## T1 — Domain: Empresa entity + EmpresaRepository port + errors + extend UserRepository

**Goal:** Extend the domain layer with Empresa behavior, repository port, and domain errors.

### Files to create
- `packages/domain/src/auth/repositories/empresa-repository.ts` — `EmpresaRepository` port interface
- `packages/domain/src/auth/errors/empresa.errors.ts` — `EmpresaNotFoundError`, `EmpresaNameAlreadyExistsError`

### Files to modify
- `packages/domain/src/auth/entities/empresa.ts` — add `rename(nombre: string): Result<void, Error>` method
- `packages/domain/src/auth/repositories/user-repository.ts` — add `findAllByEmpresaId(id: EmpresaId): Promise<Result<User[], DomainError>>` to the interface
- `packages/domain/src/index.ts` — export `EmpresaRepository`, `EmpresaNotFoundError`, `EmpresaNameAlreadyExistsError`

### Acceptance criteria
- [x] `Empresa.rename(nombre)` validates: empty → err, >100 chars → err, valid → updates `updatedAt` and returns `ok(undefined)`
- [x] `EmpresaNotFoundError` extends `DomainError` with `code = 'EMPRESA_NOT_FOUND'`
- [x] `EmpresaNameAlreadyExistsError` extends `DomainError` with `code = 'EMPRESA_NAME_ALREADY_EXISTS'`
- [x] `EmpresaRepository` interface declares: `findById`, `findAll`, `save`, `delete`, `existsByNombre`
- [x] `UserRepository` interface declares `findAllByEmpresaId(id: EmpresaId): Promise<Result<User[], DomainError>>`
- [x] All new types exported from `packages/domain/src/index.ts`
- [ ] No framework imports in domain code — pure TypeScript only

---

## T2 — Application: 6 Empresa use cases

**Goal:** Create all empresa use cases in the application layer.

### Files to create
- `api/src/application/empresas/use-cases/create-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/list-empresas.use-case.ts`
- `api/src/application/empresas/use-cases/get-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/update-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/delete-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/assign-user-to-empresa.use-case.ts`
- `api/src/application/empresas/dtos/empresa.dto.ts` — `EmpresaDTO { id, nombre, createdAt }`
- `api/src/application/empresas/dtos/create-empresa.dto.ts` — `{ nombre: string }`
- `api/src/application/empresas/dtos/update-empresa.dto.ts` — `{ nombre: string }`

### Use case specifications

#### CreateEmpresaUseCase
- **Input:** `CreateEmpresaDTO { nombre: string }`
- **Logic:** `existsByNombre(nombre)` → if true → `EmpresaNameAlreadyExistsError`; else `Empresa.create(nombre)` → `repo.save()`
- **Output:** `Result<EmpresaDTO, Error>`

#### ListEmpresasUseCase
- **Input:** none
- **Logic:** `repo.findAll()` → map to `EmpresaDTO[]`
- **Output:** `Result<EmpresaDTO[], Error>`

#### GetEmpresaUseCase
- **Input:** `empresaId: string`
- **Logic:** `repo.findById(id)` → if not found → `EmpresaNotFoundError`
- **Output:** `Result<EmpresaDTO, Error>`

#### UpdateEmpresaUseCase
- **Input:** `empresaId: string`, `UpdateEmpresaDTO { nombre: string }`
- **Logic:** `repo.findById(id)` → `empresa.rename(nombre)` → if name changed, check `existsByNombre(newName)` → `repo.save(empresa)`
- **Output:** `Result<EmpresaDTO, Error>`

#### DeleteEmpresaUseCase
- **Input:** `empresaId: string`
- **Logic:** `repo.findById(id)` → if not found → `EmpresaNotFoundError` → `repo.delete(id)`
- **Output:** `Result<void, Error>`

#### AssignUserToEmpresaUseCase
- **Input:** `{ empresaId: string, userId: string }`
- **Logic:** `empresaRepo.findById(empresaId)` → if not found → `EmpresaNotFoundError`; `userRepo.findById(userId)` → if not found → `UserNotFoundError`; `userRepo.addToEmpresa(userId, empresaId, role)`
- **Output:** `Result<{ userId: string, empresaId: string }, Error>`

### Acceptance criteria
- [x] All use cases use constructor injection with `@Inject('RepositoryToken')`
- [x] All use cases return `Promise<Result<T, Error>>` — never throw
- [x] `CreateEmpresaUseCase` checks name uniqueness before creating
- [x] `UpdateEmpresaUseCase` checks name uniqueness only if name actually changed
- [x] `AssignUserToEmpresaUseCase` validates both empresa and user exist before linking
- [x] DTOs are plain interfaces, no decorators

---

## T3 — Application: CallerContext DTO + modify 4 auth use cases

**Goal:** Introduce caller context enforcement for RBAC scoping in auth use cases.

### Files to create
- `api/src/application/auth/dtos/caller-context.dto.ts` — `CallerContext { callerId: string, callerRole: string, callerEmpresaId: string }`

### Files to modify
- `api/src/application/auth/dtos/register-user.dto.ts` — add `callerContext?: CallerContext` field
- `api/src/application/auth/use-cases/register-user.use-case.ts` — enforce: Admin can assign any empresa/role; Supervisor can only assign own empresa and cannot assign Admin role
- `api/src/application/auth/use-cases/list-users.use-case.ts` — if caller is Supervisor, use `findAllByEmpresaId(callerEmpresaId)` instead of `findAll()`
- `api/src/application/auth/use-cases/update-user.use-case.ts` — if caller is Supervisor, verify target user belongs to caller's empresa before editing; Supervisor cannot change empresaId
- `api/src/application/auth/use-cases/delete-user.use-case.ts` — if caller is Supervisor, verify target user belongs to caller's empresa before deleting

### Acceptance criteria
- [ ] `CallerContext` is a plain interface with 3 string fields
- [ ] `RegisterUserUseCase` without callerContext works as before (backward compat)
- [ ] With callerContext: Supervisor + different empresaId → 403 (Forbidden)
- [ ] With callerContext: Supervisor + role Admin → 403 (Forbidden)
- [ ] With callerContext: Admin + any empresaId → allowed
- [ ] `ListUsersUseCase` with Supervisor caller → only returns users in caller's empresa
- [ ] `ListUsersUseCase` with Admin caller → returns all users (unchanged)
- [ ] `UpdateUserUseCase` with Supervisor caller + user outside empresa → 403
- [ ] `DeleteUserUseCase` with Supervisor caller + user outside empresa → 403

---

## T4 — Infrastructure: EmpresaMapper + PrismaEmpresaRepository + extend PrismaUserRepository

**Goal:** Implement Prisma adapters for Empresa and extend User repository.

### Files to create
- `api/src/infrastructure/persistence/prisma/mappers/empresa-mapper.ts` — `toDomain(row): Empresa`, `toPrisma(empresa): PrismaCreateInput`
- `api/src/infrastructure/persistence/prisma/repositories/prisma-empresa.repository.ts` — implements `EmpresaRepository`

### Files to modify
- `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts` — add `findAllByEmpresaId(id: EmpresaId)` method

### Acceptance criteria
- [x] `EmpresaMapper.toDomain()` converts Prisma row → `Empresa.reconstruct({...})`
- [x] `EmpresaMapper.toPrisma()` converts `Empresa` → Prisma create/update input
- [x] `PrismaEmpresaRepository` implements all 5 methods: `findById`, `findAll`, `save`, `delete`, `existsByNombre`
- [x] `PrismaEmpresaRepository` uses `PrismaService` via constructor injection
- [x] `PrismaUserRepository.findAllByEmpresaId()` queries `userEmpresa` join table, filters by `empresaId`, returns mapped `User[]`
- [x] All methods return `Result<T, DomainError>` — never throw
- [x] `save()` uses upsert pattern (matching existing `PrismaUserRepository.save()`)

---

## T5 — Presentation: EmpresasController + EmpresasModule

**Goal:** Expose empresa CRUD via REST endpoints with RBAC guards.

### Files to create
- `api/src/presentation/empresas/empresas.controller.ts` — 6 endpoints
- `api/src/presentation/empresas/empresas.module.ts` — wires use cases + providers
- `api/src/presentation/empresas/dto/create-empresa.request.ts` — `{ nombre: string }`
- `api/src/presentation/empresas/dto/update-empresa.request.ts` — `{ nombre: string }`
- `api/src/presentation/empresas/dto/assign-user.request.ts` — `{ userId: string }`

### Files to modify
- `api/src/app.module.ts` — import `EmpresasModule`

### Endpoints

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/empresas` | `@Roles(Role.Admin)` | List all empresas |
| GET | `/empresas/:id` | `@Roles(Role.Admin)` | Get single empresa |
| POST | `/empresas` | `@Roles(Role.Admin)` | Create empresa |
| PATCH | `/empresas/:id` | `@Roles(Role.Admin)` | Update empresa name |
| DELETE | `/empresas/:id` | `@Roles(Role.Admin)` | Delete empresa |
| POST | `/empresas/:id/users` | `@Roles(Role.Admin)` | Assign user to empresa |

### Module wiring
- `EmpresasModule` imports `AuthModule` (for `PrismaUserRepository`, `PrismaService`)
- Providers: all 6 use cases, `PrismaEmpresaRepository`, `PrismaService`
- Exports: `PrismaEmpresaRepository`, all use cases

### Acceptance criteria
- [x] All endpoints use `@UseGuards(AuthGuard, RolesGuard)` + `@Roles(Role.Admin)`
- [x] All responses follow `{ data: ... }` envelope
- [x] POST endpoints return appropriate HTTP status (201 for create)
- [x] DELETE returns 204 No Content
- [x] Domain errors are thrown as exceptions (handled by `AppExceptionFilter`)
- [x] `EmpresasModule` is imported in `app.module.ts`
- [x] Request DTOs are plain interfaces

---

## T6 — Presentation: Update AuthController + AuthModule

**Goal:** Add RBAC guards and caller context to existing auth endpoints.

### Files to modify
- `api/src/presentation/auth/auth.controller.ts`:
  - `POST /auth/register`: add `@UseGuards(AuthGuard, RolesGuard)` + `@Roles(Role.Admin, Role.Supervisor)`; pass `@CurrentUser()` as callerContext
  - `GET /auth/contacts`: add `@Roles(Role.Admin, Role.Supervisor)`; pass caller context
  - `PATCH /auth/users/:id`: add `@Roles(Role.Admin, Role.Supervisor)`; pass caller context
  - `DELETE /auth/users/:id`: add `@Roles(Role.Admin, Role.Supervisor)`; pass caller context
- `api/src/presentation/auth/auth.module.ts` — update use case factories if signatures changed

### Acceptance criteria
- [x] `POST /auth/register` without auth token → 401
- [x] `POST /auth/register` with Tecnico/Usuario token → 403
- [x] `@CurrentUser()` is extracted and mapped to `CallerContext` before passing to use cases
- [x] Existing endpoints without guards (login, refresh, etc.) remain unchanged
- [x] AuthModule providers are updated to match new use case constructor signatures

---

## T7 — Frontend: empresas-admin.page.tsx

**Goal:** Build the empresa ABM UI visible only to ADMIN users.

### Files to create
- `web/src/pages/empresas-admin.page.tsx` — table + create/edit form + delete confirm

### Files to modify
- `web/src/api/client.ts` — add: `getEmpresas()`, `getEmpresa(id)`, `createEmpresa()`, `updateEmpresa()`, `deleteEmpresa()`, `assignUserToEmpresa()`
- `web/src/App.tsx` — add route `/admin/empresas` with ADMIN-only guard

### Page behavior
- Table lists all empresas with Edit and Delete actions
- "Nueva Empresa" button opens form with `nombre` field
- Edit inline or modal form pre-filled with current name
- Delete shows confirmation dialog
- Only visible to users with `role === 'Admin'`

### API client additions
```typescript
export async function getEmpresas(): Promise<EmpresaDTO[]>
export async function getEmpresa(id: string): Promise<EmpresaDTO>
export async function createEmpresa(data: { nombre: string }): Promise<EmpresaDTO>
export async function updateEmpresa(id: string, data: { nombre: string }): Promise<EmpresaDTO>
export async function deleteEmpresa(id: string): Promise<void>
export async function assignUserToEmpresa(empresaId: string, userId: string): Promise<{ userId: string, empresaId: string }>
```

### Acceptance criteria
- [ ] Page renders empresa table with nombre and createdAt columns
- [ ] Create form validates nombre is not empty
- [ ] Edit form pre-fills current nombre
- [ ] Delete shows confirmation before calling API
- [ ] Route `/admin/empresas` is guarded (redirect non-Admin users)
- [ ] API client methods use correct HTTP methods and paths
- [ ] Error messages from API are displayed to user

---

## T8 — Frontend: Update users-admin.page.tsx

**Goal:** Add empresa selector for Admin, auto-fill for Supervisor, role restrictions.

### Files to modify
- `web/src/pages/users-admin.page.tsx`

### Changes
- **ADMIN users:** Load empresas list on mount, show empresa dropdown in create/edit form, include `empresaId` in register request
- **SUPERVISOR users:** Hide empresa selector entirely; empresaId auto-filled from auth context (current user's empresa); role dropdown excludes `Admin` option
- **TECNICO / USUARIO:** Page should not be accessible (handled by route guard, not this page)

### Acceptance criteria
- [ ] Admin sees empresa dropdown with all empresas loaded from API
- [ ] Admin can select any empresa when creating/editing a user
- [ ] Supervisor does NOT see empresa selector; empresaId is sent from auth context
- [ ] Supervisor role dropdown shows only: Usuario, Tecnico, Supervisor (no Admin)
- [ ] Create/edit requests include `empresaId` in the payload
- [ ] Existing functionality (list, edit, delete) continues to work

---

## T9 — Tests: Unit tests for domain + use cases

**Goal:** Verify domain behavior and use case logic with unit tests.

### Files to create
- `packages/domain/src/__tests__/empresa.test.ts` — test `Empresa.rename()` and `Empresa.create()` edge cases
- `api/src/__tests__/empresas/create-empresa.use-case.test.ts` — happy path + name collision
- `api/src/__tests__/empresas/update-empresa.use-case.test.ts` — happy path + name collision + not found
- `api/src/__tests__/auth/register-user.use-case.test.ts` — extend with CallerContext enforcement (4 scenarios)

### Test scenarios

#### Domain: Empresa (`empresa.test.ts`)
- `rename()` with valid name → ok, updatedAt changes
- `rename()` with empty name → err
- `rename()` with name > 100 chars → err
- `rename()` with same name → ok (no-op on validation)

#### CreateEmpresaUseCase
- Happy path: creates empresa, returns DTO
- Name collision: returns `EmpresaNameAlreadyExistsError`
- Empty name: returns validation error

#### UpdateEmpresaUseCase
- Happy path: renames empresa, returns updated DTO
- Name collision with different name: returns `EmpresaNameAlreadyExistsError`
- Empresa not found: returns `EmpresaNotFoundError`

#### RegisterUserUseCase (CallerContext scenarios)
- Admin + any empresaId → success
- Admin + Admin role for new user → success
- Supervisor + own empresaId → success
- Supervisor + different empresaId → 403 (Forbidden)
- Supervisor + Admin role for new user → 403 (Forbidden)

### Acceptance criteria
- [x] All tests pass with `vitest`
- [x] Tests use mock repositories (no DB needed)
- [x] Tests assert both success and error paths
- [x] CallerContext tests cover all 4+ scenarios from the spec

---

## Summary

| Task | Layer | New Files | Modified Files | Key Deliverable |
|------|-------|-----------|----------------|-----------------|
| T1 | Domain | 2 | 3 | EmpresaRepository port, errors, rename() |
| T2 | Application | 9 | 0 | 6 empresa use cases + DTOs |
| T3 | Application | 1 | 4 | CallerContext + 4 auth use case mods |
| T4 | Infrastructure | 2 | 1 | PrismaEmpresaRepository + mapper |
| T5 | Presentation | 5 | 1 | EmpresasController + module + routes |
| T6 | Presentation | 0 | 2 | AuthController guards + caller context |
| T7 | Frontend | 1 | 2 | empresas-admin.page + API client + route |
| T8 | Frontend | 0 | 1 | users-admin.page empresa selector |
| T9 | Tests | 4 | 0 | Unit tests for domain + use cases |

**Total: 24 new files, 14 modified files**
