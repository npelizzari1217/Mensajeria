# Tasks: Fix SelectEmpresa Role Bug + Premium UI

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR — backend fix + frontend UI are independent scopes within budget |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Fix SelectEmpresaUseCase role casing + unit test | PR 1 | Backend only, self-contained |
| 2 | Premium UI CSS + font + sidebar icons + login styling | PR 1 | Frontend additive CSS/JSX only |

## Phase 1: Backend Fix — SelectEmpresaUseCase Role Casing

- [x] 1.1 Modify `api/src/application/auth/use-cases/select-empresa.use-case.ts`: add `userRepo.findById(uid)` after the `isMemberOf` check (line 27), unwrap the `User` entity, and replace `selectedEmpresa.role as TokenPayload['role']` with `user.getRole().get()` in both the JWT payload (line 47) and the `EmpresaDTO.role` mapping (line 36)
- [x] 1.2 Verify no new imports needed beyond existing `@mensajeria/domain` (already imports `UserRepository`, `Result`, `ok`, `err`)

## Phase 2: Unit Test

- [x] 2.1 Create `api/src/__tests__/auth/select-empresa.test.ts` following the pattern from `login.test.ts`: mock `UserRepository` with `findById` returning a `User` with `role=Admin` via `User.reconstruct()`, mock `isMemberOf` returning `true`, mock `getEmpresas` returning one empresa, mock `authPort.sign` returning deterministic tokens
- [x] 2.2 Assert: JWT payload `role` is `"Admin"` (PascalCase) by inspecting the first `mockAuthPort.sign` call argument — mirrors the assertion at line 164 of `login.test.ts`
- [x] 2.3 Assert: `EmpresaDTO.role` in the response is `"Admin"` (PascalCase)
- [x] 2.4 Run `npx vitest run src/__tests__/auth/select-empresa.test.ts` — must pass

## Phase 3: Frontend — Font + Premium UI CSS

- [x] 3.1 Add to `web/index.html` `<head>`: `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">`
- [x] 3.2 Append to `web/src/styles.css` (after line 1035): Premium UI v2 block (~80 lines) with `font-family: 'Inter', ...` on `html/body/#root`, glassmorphism sidebar (`backdrop-filter: blur()` + semi-transparent gradient), indigo-purple primary button gradient, glow effects on buttons/cards, enhanced transitions, `card-glow` and `login-card-glow` classes
- [x] 3.3 Verify CSS specificity: new block cascades over existing Premium UI block — no existing selectors modified above line 762

## Phase 4: Frontend — Sidebar SVG Icons + Login Styling

- [x] 4.1 Modify `web/src/components/layout.tsx`: add inline SVG icons (inbox, send, edit, search, group, draft, pin, users, building) before each `link.label` in the sidebar nav — ~20x20px, `currentColor` fill, wrapped in `<span>` with margin-right
- [x] 4.2 Modify `web/src/pages/login.page.tsx`: add `card-glow` class to the login-card `<div>` (lines 78, 107), add `login-card-glow` class to empresa-selector buttons (line 86)
- [x] 4.3 Visual check: sidebar blur renders, card glassmorphism visible, button glow on hover, Inter font applied, no layout breakage on login page or empresa selector
