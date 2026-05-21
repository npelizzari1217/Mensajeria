# Proposal: Fix SelectEmpresa Role Bug + Premium UI

## Intent

**Problem 1**: `SelectEmpresaUseCase` signs JWT with `role` from `user_empresas.role` (Prisma enum = UPPERCASE: `ADMIN`, `SUPERVISOR`). `RolesGuard` compares against domain `Role` enum (PascalCase: `Admin`, `Supervisor`). After empresa selection, all API calls return 403 because `"ADMIN" !== "Admin"`.

**Problem 2**: The web UI needs premium visual polish: Inter font, glassmorphism (backdrop-filter blur on sidebar and cards), glow effects, richer color palette with indigo/purple accents.

## Scope

### In Scope

**Backend fix**:
- Fix `SelectEmpresaUseCase` to fetch the `User` entity and use `user.getRole().get()` (PascalCase) for JWT payload — matching `LoginUseCase` and `RefreshTokenUseCase` patterns
- Update `EmpresaDTO.role` to use domain-validated PascalCase role (cosmetic consistency)

**Frontend premium UI**:
- Add Inter font via Google Fonts `<link>` in `web/index.html`
- Add glassmorphism styles: `backdrop-filter: blur()` on `.sidebar`, `.card`, `.topbar`
- Add glow effects: `box-shadow` glow on `.nav-link.active`, `.btn-primary:hover`
- Add enhanced micro-animations: transitions on sidebar, cards, table rows
- Extend color palette with indigo/purple accents for gradients
- Apply Inter as body font-family

### Out of Scope

- Backend role guard or decorator changes (already correct)
- Prisma schema changes
- Fixing `getEmpresas()` pipeline role normalization (separate concern — see exploration)
- Per-empresa role granularity implementation
- Component-level refactors (pure CSS + font only)
- Dark mode / theme system
- New admin features or pages

## Capabilities

### New Capabilities

None — this is a bug fix + visual upgrade. No new domain capability introduced.

### Modified Capabilities

None — existing RBAC behavior is specified in `user-auth` spec and remains unchanged at the spec level. Role casing is an implementation detail, not a capability change.

## Approach

### Problem 1: Backend fix

**Fetch User entity approach** (recommended in exploration). In `SelectEmpresaUseCase.execute()`, after confirming membership via `isMemberOf()`, fetch the full `User` entity and use `user.getRole().get()` for the JWT payload. This matches the pattern already established in `LoginUseCase` (line 82) and `RefreshTokenUseCase` (line 63).

```typescript
// Current (broken): line 47
role: selectedEmpresa.role as TokenPayload['role'],

// Fixed:
const userResult = await this.userRepo.findById(uid);
if (userResult.isErr()) return err(userResult.unwrapErr());
const user = userResult.unwrap();
// ...
role: user.getRole().get(),
```

Also normalize `EmpresaDTO.role` (returned to frontend) to PascalCase for display consistency.

### Problem 2: Premium UI

**Additive CSS + font approach**. All changes are in `web/index.html` (1 line: Inter font link) and `web/src/styles.css` (new block appended after existing Premium UI section, lines 762–1035). Zero component changes.

## Affected Areas

| File | Change | Lines |
|------|--------|-------|
| `api/src/application/auth/use-cases/select-empresa.use-case.ts` | Fetch User entity; use `user.getRole().get()` for JWT and EmpresaDTO | ~6 added |
| `web/index.html` | Add Google Fonts `<link>` for Inter | 1 added |
| `web/src/styles.css` | Add glassmorphism, glow, Inter font-family, enhanced animations block | ~60 added |

## Deliverables

1. `api/src/application/auth/use-cases/select-empresa.use-case.ts` — fixed JWT role signing
2. `web/index.html` — Inter font loaded
3. `web/src/styles.css` — additive Premium UI v2 block

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Extra `findById()` call adds latency | Low | User row is likely in memory/DB cache from login. One indexed lookup by UUID. |
| User deleted between login and empresa selection | Very low | `findById()` returns `UserNotFoundError` — already handled by frontend error display in `selectEmpresa()`. |
| CSS glassmorphism performance | Low | `backdrop-filter` is GPU-accelerated in modern browsers. Applied to static elements only. |
| Inter font FOUT | Low | Google Fonts serves with `font-display: swap` by default. System font fallback in font stack. |
| CSS specificity with existing Premium UI block | Low | New block appended AFTER existing. Both are additive-only (no selector removal). |
| Line budget: ~70 lines total | Low | Well under 400-line review budget. Single PR is fine. |

## Rollback Plan

1. **Backend**: Revert `select-empresa.use-case.ts` to use `selectedEmpresa.role` (reintroduces bug — not recommended; fix is the default path)
2. **Font**: Remove `<link>` from `index.html`. Body font falls back to system stack.
3. **CSS**: Delete the new Premium UI v2 block from `styles.css`. Existing Premium UI block remains untouched.

## Dependencies

None. All changes are self-contained. API contract unchanged (`/auth/select-empresa` response shape is the same, only role casing in JWT and EmpresaDTO changes from UPPERCASE to PascalCase — which is the CORRECT format).

## Success Criteria

- [ ] After selecting empresa, `RolesGuard` allows access for Admin/Supervisor users (no 403)
- [ ] JWT `role` claim is PascalCase (`Admin`, `Supervisor`, `Tecnico`, `Usuario`)
- [ ] Empresa selector on login page shows PascalCase roles
- [ ] Inter font renders on all pages
- [ ] Sidebar has glassmorphism blur effect
- [ ] Cards have subtle backdrop-blur + layered shadows
- [ ] Active nav link has glow indicator
- [ ] Buttons have enhanced hover glow
- [ ] No layout breakage on existing pages
- [ ] No regression in login, empresa selection, or role-based page access
