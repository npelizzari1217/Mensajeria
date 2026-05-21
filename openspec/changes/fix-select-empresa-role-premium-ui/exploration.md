## Exploration: fix-select-empresa-role-premium-ui

### Current State

#### Problem 1: SelectEmpresaUseCase JWT Role Bug (CONFIRMED)

Four different role representations exist across the stack:

| Layer | Format | Example |
|-------|--------|---------|
| Domain (`Role` enum) | PascalCase | `'Admin'`, `'Supervisor'`, `'Tecnico'`, `'Usuario'` |
| Prisma schema (`Role` enum) | UPPERCASE | `ADMIN`, `SUPERVISOR`, `TECNICO`, `USUARIO` |
| PrismaUserRepository.getEmpresas() | Raw Prisma value | `r.role` (from `user_empresas`) |
| AuthPort TokenPayload | Domain `Role` | `role: Role` (typed as `Role`) |
| RolesGuard comparison | Domain `Role` | `user.role === role` where `role` is `Role.Admin` = `'Admin'` |

**Root cause**: `SelectEmpresaUseCase` at line 47 uses `selectedEmpresa.role as TokenPayload['role']`. The `selectedEmpresa` comes from `EmpresaDTO` which maps `m.role` from `EmpresaMembership`. The `prisma-user.repository.ts` line 90 returns `role: r.role` — the raw Prisma `user_empresas.role` column value. This leaks the Prisma UPPERCASE format into the JWT.

**Concrete flow producing the bug**:
1. Login → JWT `role: "Admin"` (from `user.getRole().get()` — PascalCase) ✅
2. Frontend auto-calls `/auth/select-empresa` with `empresaId`
3. `SelectEmpresaUseCase` builds payload with `selectedEmpresa.role` — value is `"ADMIN"` (Prisma enum) ❌
4. New JWT signed with `role: "ADMIN"` ❌
5. All subsequent API calls use this UPPERCASE JWT
6. `RolesGuard` line 40: `"ADMIN" === "Admin"` → `false` → 403 "Access denied"

**Why LoginUseCase doesn't have this bug**: It uses `user.getRole().get()` at line 82, which returns the domain `Role` enum value (PascalCase). The `RefreshTokenUseCase` similarly uses `user.getRole().get()` at line 63.

**Secondary effect**: The `EmpresaDTO.role` returned to the frontend also carries UPPERCASE values (shown in empresa selector as "ADMIN" instead of "Admin"). The frontend `isAdmin()` function has `toLowerCase()` fallback so this doesn't break functionality, but it's visually inconsistent.

#### Problem 2: Premium UI

The existing Premium UI block in `web/src/styles.css` (lines 762–1035) already implements many requested features:
- ✅ Login page animated gradient background + backdrop-filter blur card
- ✅ Gradient buttons (`btn-primary`, `btn-danger`)
- ✅ Layered shadows on cards, tables, compose/detail sections
- ✅ Sidebar gradient background + active link left-border indicator
- ✅ Badge gradients, enhanced table headers
- ✅ `btn:hover` scale transform, card hover shadows
- ✅ Gradient page headers

**Missing from user request**:
- ❌ Inter font (Google Fonts) — not loaded in `index.html`
- ❌ Glassmorphism on sidebar and content cards (backdrop-filter blur) — only login card has it
- ❌ Glow effects (active nav link glow, button glow on hover)
- ❌ Indigo/purple gradients in broader color palette (only login page has purple)
- ❌ More pervasive micro-animations (form focus glow exists but could be enhanced)

### Affected Areas

| File | Problem 1 | Problem 2 |
|------|-----------|-----------|
| `api/src/application/auth/use-cases/select-empresa.use-case.ts` | **CRITICAL**: Line 47 leaks Prisma enum into JWT | — |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-user.repository.ts` | Line 90: `role: r.role` returns raw Prisma enum | — |
| `api/src/infrastructure/auth/guards/roles.guard.ts` | Victim: correct domain Role comparison breaks on UPPERCASE input | — |
| `web/index.html` | — | Add Inter font `<link>` |
| `web/src/styles.css` | — | Add glassmorphism, glow, Inter font-family, enhanced animations |
| `web/src/components/layout.tsx` | — | Already has Premium UI styling via CSS; no JSX changes needed |
| `web/src/pages/login.page.tsx` | — | Already styled; CSS changes only |
| `web/src/pages/users-admin.page.tsx` | — | Already styled; CSS changes only |
| `web/src/pages/empresas-admin.page.tsx` | — | Already styled; CSS changes only |
| `packages/domain/src/shared/value-objects/role.ts` | Source of truth — no changes needed | — |
| `packages/domain/src/auth/entities/user.ts` | Provides `getRole().get()` — no changes needed | — |

### Approaches — Problem 1 (Role Bug)

#### 1. Fetch User entity — use `user.getRole().get()` (user's recommended fix)

```typescript
// In SelectEmpresaUseCase.execute():
const userResult = await this.userRepo.findById(uid);
if (userResult.isErr()) return err(userResult.unwrapErr());
const user = userResult.unwrap();

const payload: TokenPayload = {
  sub: userId,
  role: user.getRole().get(),  // PascalCase, domain-validated
  empresaId,
};
```

- **Pros**: Simple, 4-line change. Consistent with `LoginUseCase` and `RefreshTokenUseCase`. Uses domain-validated `Role` value. No new imports.
- **Cons**: Uses global `User.role` instead of per-empresa `user_empresas.role`. If per-empresa roles ever differ from global roles (not currently the case), this would be semantically wrong.
- **Effort**: Low

#### 2. Normalize via `RoleVO.create()` — preserve per-empresa role

```typescript
const roleResult = RoleVO.create(selectedEmpresa.role);
if (roleResult.isErr()) {
  return err(new Error(`Invalid role '${selectedEmpresa.role}'`));
}
const role = roleResult.unwrap().get();
```

- **Pros**: Preserves per-empresa role semantics. Future-proof if per-empresa role granularity is needed. `RoleVO.create()` already handles case-insensitive normalization.
- **Cons**: Slightly more code. Not the established pattern in other use cases. Requires importing `RoleVO`.
- **Effort**: Low

#### 3. Fix pipeline at `getEmpresas()` — map Prisma role to domain

Normalize `r.role` in `prisma-user.repository.ts` line 90 using `toDomainRole()` or `RoleVO.create()`.

- **Pros**: Fixes ALL consumers of `getEmpresas()` at once (LoginUseCase, SelectEmpresaUseCase, and future use cases). No individual use case changes needed.
- **Cons**: Broader blast radius — affects LoginUseCase contract (changes `EmpresaDTO.role` from UPPERCASE to PascalCase). Frontend empresa display changes.
- **Effort**: Low-Medium

### Approaches — Problem 2 (Premium UI)

#### 1. Additive CSS + font only

Add Inter font link to `index.html`. Add new CSS block to `styles.css` for glassmorphism, glow effects, font-family override.

- **Pros**: Zero component changes. Pure CSS — no risk of breaking JSX logic. Easy rollback (delete the block).
- **Cons**: Limited to what CSS can express. No new interactive effects.
- **Effort**: Low

#### 2. Component refactor + CSS

Refactor components to support premium features (e.g., animated counters, skeleton loaders, transition components).

- **Pros**: Richer UX. Can add page transitions, skeleton screens.
- **Cons**: HIGH effort. Touches every page component. High regression risk. Overkill for this change.
- **Effort**: High

### Recommendation

**Problem 1**: **Approach 1 — Fetch User entity**. Matches the existing pattern in `LoginUseCase` (line 82) and `RefreshTokenUseCase` (line 63). One additional `findById()` call. Per-empresa role granularity is not currently implemented anywhere in the system — `User.role` is the canonical role for all authorization checks. If per-empresa roles are needed in the future, `getEmpresas()` pipeline should be fixed (Approach 3) at that time.

**Problem 2**: **Approach 1 — Additive CSS + font only**. The existing Premium UI block already provides 80% of the requested visual upgrade. Add Inter font, glassmorphism blur on sidebar/cards, glow effects on active nav and buttons, and `body { font-family: 'Inter' }` override.

### Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `findById()` call adds latency to select-empresa endpoint | Low | User is already fetched during login — DB cache hit likely. One extra query is negligible. |
| `findById()` could fail if user was deleted between login and empresa selection | Very low | Return proper error. Frontend already handles errors from `selectEmpresa()`. |
| CSS glassmorphism may cause performance issues on low-end devices | Low | `backdrop-filter` has broad browser support. Apply only to static elements (sidebar, cards), not scrollable lists. |
| Inter font load may cause FOUT (flash of unstyled text) | Low | Use `font-display: swap` in Google Fonts URL or `@font-face`. |
| CSS specificity conflicts with existing Premium UI block | Low | Add new styles AFTER existing Premium UI block. Use `!important` sparingly or not at all. |

### Additional Discovery: `addToEmpresa()` role storage

`RegisterUserUseCase` line 111 calls `addToEmpresa(user.getId(), empresaId, userRole)` where `userRole = user.getRole().get()` = PascalCase. `prisma-user.repository.ts` line 112 casts `role: role as any`. This means `user_empresas.role` stores PascalCase values through the registration path. However, `getEmpresas()` reads `r.role` which should match what was stored. The casing depends on the WRITE path. If a user is seeded directly via SQL or Prisma Studio with UPPERCASE, the bug manifests. This inconsistency is technical debt but not the immediate fix target.

### Ready for Proposal

**Yes.** Both problems are validated. The backend bug is real and reproducible (post-select-empresa → 403). The Premium UI work is well-scoped as additive CSS. Ready for sdd-propose.
