---
title: "ABM Empresas — Apply Plan"
change: abm-empresas
phase: apply
artifact: apply-plan
status: awaiting_approval
---

# Apply Plan: ABM Empresas

## Overview

| Item | Value |
|------|-------|
| Change | `abm-empresas` |
| Project | mensajeria |
| Stack | NestJS + Prisma (api) · React + Vite (web) · TypeScript monorepo (pnpm) |
| Artifact store | hybrid |
| Tasks | T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 (strict chain) |
| New files | 24 |
| Modified files | 14 |
| DB migration required | **No** — `Empresa` + `UserEmpresa` already in `schema.prisma` |

---

## Execution Order

The dependency chain is strict — each task produces contracts consumed by the next.

```
T1 (domain)
  └─► T2 (app: empresa use cases)
        └─► T4 (infra: Prisma adapters)
              └─► T5 (presentation: EmpresasController + module)
T1
  └─► T3 (app: CallerContext + 4 auth use case mods)
        └─► T6 (presentation: AuthController guards)
T5 + T6
  └─► T7 (frontend: empresas-admin.page)
        └─► T8 (frontend: users-admin.page)
              └─► T9 (tests)
```

> T2 and T3 both depend only on T1 — they can be planned as one session (T1→T2→T3) since T3 does not depend on T2.

---

## Task-by-Task Plan

### T1 — Domain layer (gate: everything depends on this)

**Status:** `pending`

**Files to create:**
- `packages/domain/src/auth/repositories/empresa-repository.ts`
- `packages/domain/src/auth/errors/empresa.errors.ts`

**Files to modify:**
- `packages/domain/src/auth/entities/empresa.ts` — add `rename(nombre): Result<void, Error>`; note `nombre` is currently `private readonly` — must change to `private` (mutable)
- `packages/domain/src/auth/repositories/user-repository.ts` — add `findAllByEmpresaId(id: EmpresaId): Promise<Result<User[], DomainError>>` to interface
- `packages/domain/src/index.ts` — export `EmpresaRepository`, `EmpresaNotFoundError`, `EmpresaNameAlreadyExistsError`

**Contract gate:** T1 MUST export all three symbols from `packages/domain/src/index.ts` before T2, T3, T4 can compile.

**Implementation notes:**
- `Empresa.rename()` must mutate `this.nombre` (not `readonly`) and update `this.updatedAt = Timestamp.now()` — follow the same pattern as `User.changeName()`
- `EmpresaNotFoundError` and `EmpresaNameAlreadyExistsError` follow exact same structure as `UserNotFoundError` / `EmailAlreadyExistsError` in `user.errors.ts`
- `EmpresaRepository` interface must match the contract in design.md: `findById`, `findAll`, `save`, `delete`, `existsByNombre`
- No framework imports — pure TypeScript

---

### T2 — Application: 6 Empresa use cases

**Status:** `pending` | **Depends on:** T1

**Files to create (9):**
- `api/src/application/empresas/use-cases/create-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/list-empresas.use-case.ts`
- `api/src/application/empresas/use-cases/get-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/update-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/delete-empresa.use-case.ts`
- `api/src/application/empresas/use-cases/assign-user-to-empresa.use-case.ts`
- `api/src/application/empresas/dtos/empresa.dto.ts`
- `api/src/application/empresas/dtos/create-empresa.dto.ts`
- `api/src/application/empresas/dtos/update-empresa.dto.ts`

**Implementation notes:**
- Injection token pattern: `@Inject('EmpresaRepository')` — mirrors `@Inject('UserRepository')` in existing use cases
- All `execute()` return `Promise<Result<T, Error>>` — never throw
- `CreateEmpresaUseCase`: call `existsByNombre` BEFORE `Empresa.create()` (uniqueness is a repo concern, not domain-pure)
- `UpdateEmpresaUseCase`: check name uniqueness ONLY if new name !== current name (avoid false collision on same-name update)
- `AssignUserToEmpresaUseCase`: reuse `userRepo.addToEmpresa()` — already implemented in `PrismaUserRepository`
- `EmpresaDTO` in the application/empresas layer is `{ id, nombre, createdAt }` — **different** from existing `api/src/application/auth/dtos/empresa.dto.ts` which has `{ id, nombre, role }` (membership DTO). Do not conflict.

---

### T3 — Application: CallerContext + modify 4 auth use cases

**Status:** `pending` | **Depends on:** T1

**Files to create (1):**
- `api/src/application/auth/dtos/caller-context.dto.ts`

**Files to modify (5):**
- `api/src/application/auth/dtos/register-user.dto.ts` — add `callerContext?: CallerContext`
- `api/src/application/auth/use-cases/register-user.use-case.ts`
- `api/src/application/auth/use-cases/list-users.use-case.ts`
- `api/src/application/auth/use-cases/update-user.use-case.ts`
- `api/src/application/auth/use-cases/delete-user.use-case.ts`

**Implementation notes:**
- `callerContext` is OPTIONAL in all use case signatures for backward compatibility — when absent, behavior is identical to today
- `RegisterUserUseCase.execute(dto)` already accepts `empresaId` in its DTO — `callerContext` enforcement is additive
- `ListUsersUseCase.execute()` currently takes no args — change signature to `execute(caller?: CallerContext)` — when `caller.callerRole === 'Supervisor'`, call `userRepo.findAllByEmpresaId(EmpresaId.reconstruct(caller.callerEmpresaId))` instead of `findAll()`
- `UpdateUserUseCase` and `DeleteUserUseCase` need `userRepo.isMemberOf(targetUserId, callerEmpresaId)` to validate Supervisor scope — this method already exists in `PrismaUserRepository`
- For Supervisor scope violations, return `err(new ForbiddenError(...))` — need a `ForbiddenError` in domain or use the existing pattern (check if there's an equivalent; if not, use `new Error('Forbidden')` with a 403-mappable code in `AppExceptionFilter`)

⚠️ **GAP IDENTIFIED:** No `ForbiddenError` domain class exists yet. Options:
  1. Add `ForbiddenDomainError` to `packages/domain/src/shared/errors/` (clean, testable) — **recommended**
  2. Throw `ForbiddenException` from `@nestjs/common` directly in use case (violates Clean Architecture)
  
  **Decision:** Create `ForbiddenDomainError extends DomainError` with `code = 'FORBIDDEN'` in T1 (or T3 at latest). The existing `AppExceptionFilter` must map code `'FORBIDDEN'` → HTTP 403.

---

### T4 — Infrastructure: EmpresaMapper + PrismaEmpresaRepository + extend PrismaUserRepository

**Status:** `pending` | **Depends on:** T1

**Files to create (2):**
- `api/src/infrastructure/persistence/prisma/mappers/empresa-mapper.ts`
- `api/src/infrastructure/persistence/prisma/repositories/prisma-empresa.repository.ts`

**Files to modify (1):**
- `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts` — add `findAllByEmpresaId`

**Implementation notes:**
- `EmpresaMapper.toDomain()` uses `Empresa.reconstruct({...})` — same pattern as `UserMapper.toDomain()`
- `EmpresaMapper.toPrisma()` must output `{ id, nombre, createdAt, updatedAt }` matching Prisma `Empresa` model fields; `createdAt`/`updatedAt` are `DateTime` in schema → use `new Date(timestamp.get())`
- `PrismaEmpresaRepository.save()` uses upsert — matching the pattern in `PrismaUserRepository.save()`
- `PrismaEmpresaRepository.delete()` should cascade via `UserEmpresa` (Prisma schema has `onDelete: Cascade` on `UserEmpresa.userId`; verify `empresaId` FK cascade too — schema shows `miembros UserEmpresa[]` on `Empresa`, deletion will cascade)
- `findAllByEmpresaId()`: query `prisma.userEmpresa.findMany({ where: { empresaId: id.get() }, include: { user: true } })` → map each `r.user` via `UserMapper.toDomain(r.user)`

---

### T5 — Presentation: EmpresasController + EmpresasModule

**Status:** `pending` | **Depends on:** T2, T4

**Files to create (5):**
- `api/src/presentation/empresas/empresas.controller.ts`
- `api/src/presentation/empresas/empresas.module.ts`
- `api/src/presentation/empresas/dto/create-empresa.request.ts`
- `api/src/presentation/empresas/dto/update-empresa.request.ts`
- `api/src/presentation/empresas/dto/assign-user.request.ts`

**Files to modify (1):**
- `api/src/app.module.ts` — import `EmpresasModule`

**Endpoints:**

| Method | Path | Guard | Status |
|--------|------|-------|--------|
| GET | `/v1/empresas` | `@Roles(Admin)` | 200 |
| GET | `/v1/empresas/:id` | `@Roles(Admin)` | 200 |
| POST | `/v1/empresas` | `@Roles(Admin)` | 201 |
| PATCH | `/v1/empresas/:id` | `@Roles(Admin)` | 200 |
| DELETE | `/v1/empresas/:id` | `@Roles(Admin)` | 204 |
| POST | `/v1/empresas/:id/users` | `@Roles(Admin)` | 201 |

**Implementation notes:**
- All endpoints use `@UseGuards(AuthGuard, RolesGuard)` — `RolesGuard` requires `Reflector` from `@nestjs/core`; inject it via `EmpresasModule` providers (see existing `AuthModule` for pattern — `AuthGuard` already provided there)
- `EmpresasModule` imports `AuthModule` to get `PrismaUserRepository`, `PrismaService`, and `AuthGuard`
- DELETE returns 204 `@HttpCode(HttpStatus.NO_CONTENT)` with no body — consistent with `deleteUser` in `AuthController`
- Error → HTTP mapping happens in `AppExceptionFilter`: `EMPRESA_NOT_FOUND` → 404, `EMPRESA_NAME_ALREADY_EXISTS` → 409, `FORBIDDEN` → 403
- Module wiring uses `useFactory` pattern matching `AuthModule` style

---

### T6 — Presentation: Update AuthController + AuthModule

**Status:** `pending` | **Depends on:** T3

**Files to modify (2):**
- `api/src/presentation/auth/auth.controller.ts`
- `api/src/presentation/auth/auth.module.ts`

**Changes to `auth.controller.ts`:**

| Endpoint | Current | After T6 |
|----------|---------|----------|
| `POST /auth/register` | No guard | `@UseGuards(AuthGuard, RolesGuard)` + `@Roles(Admin, Supervisor)` + pass `@CurrentUser()` as `callerContext` |
| `GET /auth/contacts` | `@UseGuards(AuthGuard)` | Add `@Roles(Admin, Supervisor)` + pass `@CurrentUser()` as `callerContext` |
| `PATCH /auth/users/:id` | `@UseGuards(AuthGuard)` | Add `@Roles(Admin, Supervisor)` + pass `@CurrentUser()` as `callerContext` |
| `DELETE /auth/users/:id` | `@UseGuards(AuthGuard)` | Add `@Roles(Admin, Supervisor)` + pass `@CurrentUser()` as `callerContext` |

**`@CurrentUser()` → `CallerContext` mapping (in controller):**
```typescript
const caller: CallerContext = {
  callerId: user.userId,
  callerRole: user.role,
  callerEmpresaId: user.empresaId ?? '',
};
```

**Changes to `auth.module.ts`:**
- `ListUsersUseCase` factory: no change needed (optional `caller` param)
- `UpdateUserUseCase` / `DeleteUserUseCase` factories: no change needed (callerContext passed at call time, not construction)
- `RegisterUserUseCase` factory: no change needed

---

### T7 — Frontend: empresas-admin.page.tsx + API client + route

**Status:** `pending` | **Depends on:** T5, T6 (endpoints must exist)

**Files to create (1):**
- `web/src/pages/empresas-admin.page.tsx`

**Files to modify (2):**
- `web/src/api/client.ts` — add 6 empresa methods
- `web/src/App.tsx` — add `/admin/empresas` route with Admin-only guard

**Implementation notes:**
- API client methods: `getEmpresas`, `getEmpresa`, `createEmpresa`, `updateEmpresa`, `deleteEmpresa`, `assignUserToEmpresa` — follow existing patterns in `client.ts` (all use `apiClient.get/post/patch/delete`)
- Page follows the same structure as `users-admin.page.tsx`: local state, fetch on mount, form modal/inline
- Admin-only visibility: check auth context `role === 'Admin'` before rendering — same guard pattern as existing protected routes in `App.tsx`
- Error display: reuse `getErrorMessage(err)` from `client.ts`

---

### T8 — Frontend: Update users-admin.page.tsx

**Status:** `pending` | **Depends on:** T7 (API client empresa methods added)

**Files to modify (1):**
- `web/src/pages/users-admin.page.tsx`

**Changes:**
- On mount: if `role === 'Admin'`, fetch empresas list and store in state
- Create/edit form: Admin sees empresa dropdown (loaded empresas list); Supervisor sees empresa field as read-only (pre-filled from auth context)
- Role dropdown: Supervisor sees `['Usuario', 'Tecnico', 'Supervisor']` only (no `Admin`)
- Register request payload: include `empresaId` from form state

**Implementation notes:**
- Auth context is already available via the JWT-decoded user in existing state
- The `formRole` state currently defaults to `'USUARIO'` — this remains valid; add empresa state alongside it
- Existing list/edit/delete functionality is untouched — only the create form and role dropdown are affected

---

### T9 — Tests

**Status:** `pending` | **Depends on:** T1–T8 complete

**Files to create (4):**
- `packages/domain/src/__tests__/empresa.test.ts`
- `api/src/__tests__/empresas/create-empresa.use-case.test.ts`
- `api/src/__tests__/empresas/update-empresa.use-case.test.ts`
- `api/src/__tests__/auth/register-user.use-case.test.ts` (extend existing)

**Implementation notes:**
- Run: `pnpm --filter @mensajeria/domain test` + `pnpm --filter api test`
- Mock repos follow the same `vi.fn()` pattern as `register.test.ts` and `auth-flow.test.ts`
- `register-user.use-case.test.ts` must be extended (not replaced) — add CallerContext scenarios as new `describe` block

---

## Contract Verification

### Critical contracts (blocking)

| Contract | Status | Notes |
|----------|--------|-------|
| `EmpresaRepository` exported from `packages/domain/src/index.ts` | ⬜ Pending T1 | T2, T4 won't compile without this |
| `EmpresaNotFoundError` exported from domain index | ⬜ Pending T1 | T2, T3, T4 import it |
| `EmpresaNameAlreadyExistsError` exported from domain index | ⬜ Pending T1 | T2 imports it |
| `UserRepository.findAllByEmpresaId` added to interface | ⬜ Pending T1 | T3 (ListUsersUseCase) + T4 (PrismaUserRepository) must agree |
| `PrismaUserRepository` still satisfies `UserRepository` after T1 | ⬜ Pending T4 | T4 adds the new method — TypeScript will enforce at compile time |
| `EmpresasModule` imported in `app.module.ts` | ⬜ Pending T5 | Endpoints won't exist until this is wired |

### Non-breaking contracts (verify before merging)

| Contract | Notes |
|----------|-------|
| `RegisterUserDTO.empresaId` already required (not optional) | Current code has `empresaId: string` — `callerContext?: CallerContext` is additive |
| `ListUsersUseCase.execute()` signature change | From `execute()` to `execute(caller?: CallerContext)` — optional param, all existing callers pass zero args → backward compat ✅ |
| `UpdateUserUseCase.execute(userId, dto)` signature | CallerContext added as 3rd optional param — backward compat ✅ |
| `DeleteUserUseCase.execute(userId)` signature | CallerContext added as 2nd optional param — backward compat ✅ |
| `AuthModule` use case factories | No factory signature changes needed — CallerContext passed at call time in controller, not at construction |

---

## Risk Register

### 🔴 HIGH — `POST /auth/register` currently has no auth guard

**Description:** Adding `@UseGuards(AuthGuard, RolesGuard)` to `POST /auth/register` is a **breaking change** for any caller not sending an auth token. The current `auth-flow.test.ts` and `register.test.ts` tests call `RegisterUserUseCase` directly (bypassing the controller), so unit tests won't break — but any E2E test or integration that calls the endpoint without a token will receive 401.

**Mitigation:**
1. Before T6, audit `api/src/__tests__/` for any test that calls `POST /auth/register` via HTTP (not the use case directly). Found tests: `register.test.ts` and `auth-flow.test.ts` both test the **use case**, not the HTTP endpoint → safe.
2. Verify no E2E/supertest-style tests hit the register endpoint without auth. Run `grep -r "auth/register" api/src/__tests__/` before T6.
3. If a seed/bootstrap script calls this endpoint to create the first Admin user, it must be updated to use Prisma directly or a special bootstrap token.

**Status:** Verify before T6.

---

### 🟡 MEDIUM — `ForbiddenDomainError` does not exist yet

**Description:** T3 requires returning a 403 when Supervisor violates scope, but there is no `ForbiddenDomainError` in the domain layer. Throwing `ForbiddenException` from `@nestjs/common` in a use case violates Clean Architecture.

**Mitigation:**
- Add `ForbiddenDomainError extends DomainError` with `code = 'FORBIDDEN'` as part of **T1** (domain errors file or a new `packages/domain/src/shared/errors/forbidden-error.ts`).
- Verify `AppExceptionFilter` maps code `'FORBIDDEN'` → HTTP 403. If not, add that mapping in T3/T6.

**Status:** Must resolve in T1. Implement `ForbiddenDomainError` alongside the empresa errors.

---

### 🟡 MEDIUM — `UserRepository.findAllByEmpresaId` added to interface; `PrismaUserRepository` must implement it

**Description:** Adding a method to the `UserRepository` interface breaks TypeScript compilation of `PrismaUserRepository` until T4 implements it. This means the domain package build and the api build will fail in the window between T1 and T4.

**Mitigation:**
- Since T1 → T4 is a strict sequential chain, implement `findAllByEmpresaId` in `PrismaUserRepository` as part of **T4** immediately. Do not deploy or run `tsc` between T1 and T4 unless you want a transient compile failure.
- In practice: implement T1 → T2 → T3 → T4 in a single working session without intermediate builds.

**Status:** Acceptable; managed by execution order.

---

### 🟡 MEDIUM — Naming conflict: two `EmpresaDTO` definitions

**Description:** `api/src/application/auth/dtos/empresa.dto.ts` already defines `EmpresaDTO { id, nombre, role }` (a membership DTO). T2 creates `api/src/application/empresas/dtos/empresa.dto.ts` with `EmpresaDTO { id, nombre, createdAt }`. These share the same exported name but different shapes — if both are imported in the same file, TypeScript will have a naming collision.

**Mitigation:**
- The empresa use case DTO lives in a different path — no collision at the module level.
- If any file ever imports both, use aliased imports: `import { EmpresaDTO as EmpresaMembershipDTO } from '../auth/dtos/empresa.dto'`.
- **Recommended long-term:** Rename the auth one to `EmpresaMembershipDTO` (out of scope for this change).

**Status:** Low immediate risk — isolated paths. Flag for T2 implementor.

---

### 🟢 LOW — Supervisor users without empresa assigned in existing data

**Description:** Existing Supervisor users in the DB may have no `empresaId` in their JWT. When `CallerContext.callerEmpresaId` is empty string `''`, the scope check passes an empty `EmpresaId` to `findAllByEmpresaId` — which returns an empty list (not an error), degrading silently.

**Mitigation:**
- `ListUsersUseCase`: if `callerEmpresaId === ''`, return an explicit error or empty list with a warning log.
- Operational: run a DB seed/update to assign existing Supervisors to a default empresa before enabling the guard in production.

**Status:** Acceptable for initial deployment; document in deploy notes.

---

### 🟢 LOW — `AppExceptionFilter` error-code-to-HTTP mapping

**Description:** New domain error codes (`EMPRESA_NOT_FOUND`, `EMPRESA_NAME_ALREADY_EXISTS`, `FORBIDDEN`) need HTTP mappings in `AppExceptionFilter`. If not mapped, they'll fall through to 500.

**Mitigation:** Review `AppExceptionFilter` in T5/T6 and add mappings:
- `EMPRESA_NOT_FOUND` → 404
- `EMPRESA_NAME_ALREADY_EXISTS` → 409
- `FORBIDDEN` → 403

**Status:** Must verify in T5.

---

## Pre-Apply Checklist

- [ ] Confirm no E2E/supertest tests call `POST /auth/register` without auth token (`grep -r "auth/register" api/src/__tests__/`)
- [ ] Confirm `AppExceptionFilter` location and current mappings (before T5)
- [ ] Confirm `RolesGuard` is available for import in `EmpresasModule` — it's in `AuthModule` exports (yes, exported as `AuthGuard`; `RolesGuard` itself is not exported — may need to add it to `AuthModule.exports` or register it directly in `EmpresasModule`)
- [ ] Confirm `Empresa.nombre` field mutability — currently `private readonly nombre` → must change to `private nombre` for `rename()` to work

---

## Open Questions (from design.md)

1. **Hard delete vs soft delete for `DeleteEmpresa`:** Schema has no `isActive` on `Empresa`. Cascade on `UserEmpresa` is present. **Decided: hard delete.** If soft-delete is needed later, it's a schema change (out of scope).

2. **`/auth/contacts` endpoint name:** Endpoint is semantically overloaded (contact discovery + admin user management). Noted in design as future cleanup. **Out of scope for this change** — no action needed.

---

## Workload / PR Boundary

- **Estimated new/modified lines:** ~800–1000 (24 new files + 14 modified)
- **Review budget:** Exceeds single-PR 400-line recommendation
- **Recommendation:** Chain into 3 review slices:
  - **Slice 1 (T1–T4):** Pure backend — domain + application + infrastructure (no controller)
  - **Slice 2 (T5–T6):** Presentation layer — controllers, module wiring, guards
  - **Slice 3 (T7–T9):** Frontend + tests
- **Chain strategy:** `stacked-to-main` — each slice PR targets the previous slice's branch

> If the team prefers a single PR with size exception, set `size:exception` in the next apply prompt.

---

## Summary

**Blocking issues found:** 2

1. **`ForbiddenDomainError` missing** — must be created in T1 (before T3 can implement Supervisor scope enforcement cleanly). Add to T1 scope.
2. **`RolesGuard` not in `AuthModule.exports`** — `EmpresasModule` imports `AuthModule` but `RolesGuard` is not exported from it (only `AuthGuard` is). Must either add `RolesGuard` to `AuthModule.exports` in T5 or register `Reflector` + `RolesGuard` directly in `EmpresasModule`.

**Non-blocking risks:** 3 (medium) + 2 (low) — mitigations defined above.

**Ready to proceed:** Yes, pending approval and resolution of the 2 blocking items above (both resolved within T1 and T5 respectively — no design changes needed, just implementation awareness).
