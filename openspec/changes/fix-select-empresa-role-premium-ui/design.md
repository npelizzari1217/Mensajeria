# Design: Fix SelectEmpresa Role Bug + Premium UI

## Technical Approach

**Part 1 (Backend)**: In `SelectEmpresaUseCase.execute()`, fetch the `User` entity via `userRepo.findById()` and use the domain-validated `user.getRole().get()` (PascalCase) for JWT payload and `EmpresaDTO.role`. This matches the pattern used by `LoginUseCase` (line 82), `RefreshTokenUseCase` (line 63), and all other use cases that handle JWT signing.

**Part 2 (Frontend)**: Additive-only CSS block appended after existing Premium UI section (line 1035). Add Inter font `<link>` in `index.html`. Add SVG icons in sidebar nav and login card.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| JWT role source | A: `user.getRole().get()` — fetch entity | A: consistent with all other use cases. One extra `findById()` call but avoids new imports and follows established pattern. B: `RoleVO.create(selectedEmpresa.role)` preserves per-empresa role granularity but introduces a pattern not used anywhere else. | **A** — fetch User entity |
| CSS delivery | A: Appended block | A preserves existing Premium UI block intact for rollback. Both blocks cascade naturally — specificity determines winner. No refactoring risk. | **A** — appended block |
| Font loading | A: Google Fonts `<link>` | A: simple, cached, `font-display:swap` by default. B: self-hosted `@font-face` adds build complexity and no benefit for a 1-font change. | **A** — Google Fonts `<link>` |
| Icons | A: Inline SVG in JSX | A: zero deps, tiny payload (~200 bytes each), stays in `layout.tsx`. B: icon library (lucide-react) adds bundle weight for 8 icons. | **A** — inline SVG |

## Data Flow

```
Login (JWT: role="Admin") → frontend auto-selects empresa via /auth/select-empresa
    │
    ▼
SelectEmpresaUseCase.execute()
    │
    ├─ isMemberOf(uid, eid)        // confirm membership
    ├─ userRepo.findById(uid)      // ← NEW: fetch User entity
    │      └─ user.getRole().get() // → "Admin" (PascalCase, domain-validated)
    │
    ├─ JWT signed with "Admin"     // ✅ now matches RolesGuard expectation
    └─ EmpresaDTO.role = "Admin"   // ✅ displayed correctly in empresa selector
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/src/application/auth/use-cases/select-empresa.use-case.ts` | Modify | Add `userRepo.findById()` after `isMemberOf`; use `user.getRole().get()` for JWT payload (line 47) and `EmpresaDTO.role` (line 36) |
| `web/index.html` | Modify | Add `<link rel="preconnect">` + Google Fonts `<link>` for Inter (weights 400;500;600;700;800) |
| `web/src/styles.css` | Modify | Append Premium UI v2 block (~80 lines): glassmorphism sidebar+cards, indigo-purple primary button, glow effects, Inter font-family, enhanced transitions |
| `web/src/components/layout.tsx` | Modify | Add inline SVG icons alongside nav link labels |
| `web/src/pages/login.page.tsx` | Modify | Add `card-glow` class to `<div className="login-card">`, `login-card-glow` to empresa-selector variant |

## Interfaces / Contracts

No API contract changes. `/auth/select-empresa` response shape unchanged — only `role` casing in payload corrects from `"ADMIN"` to `"Admin"`.

```typescript
// select-empresa.use-case.ts changes (conceptual)

// REMOVED: line 47
role: selectedEmpresa.role as TokenPayload['role'],

// ADDED: after isMemberOf check (line 27)
const userResult = await this.userRepo.findById(uid);
if (userResult.isErr()) return err(userResult.unwrapErr());
const user = userResult.unwrap();

// ADDED: use for JWT (line 47 replacement) and EmpresaDTO (line 36)
role: user.getRole().get(),
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | SelectEmpresaUseCase role casing | Mock `userRepo` to return domain `User` with `role=Admin`; assert JWT payload.role === `"Admin"` |
| Integration | POST /auth/select-empresa → guard check | Login, select empresa, call a `@Roles('Admin')` endpoint — must return 200 |
| Visual | CSS visual regression | Manual check: sidebar blur, card glassmorphism, button glow, Inter font rendering, no layout breakage |

## Migration / Rollout

No migration required. JWT tokens from before the fix will be invalidated on next select-empresa (which re-issues tokens with correct casing). CSS rollback: delete the Premium UI v2 block and remove the Inter font `<link>` from `index.html`.

## Open Questions

None.
