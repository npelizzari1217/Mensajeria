# Tasks: Fix Role Casing + Premium UI

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300-350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (bug fix + role constants) → PR 2 (premium UI CSS) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Create roles.ts, fix ProtectedRoute, wire App.tsx, fix users-admin + empresas-admin + layout role checks | PR 1 | Bug fix + role normalization; tests included; standalone |
| 2 | Append premium CSS block to styles.css | PR 2 | Purely additive; depends on PR 1 merged; visual-only |

## Phase 1: Foundation (Role Constants + Route Guard)

- [x] 1.1 Create `web/src/constants/roles.ts` with `ROLES` const, `Role` type, `ADMIN_ROLES`, `MANAGE_USERS_ROLES` arrays, and `isAdmin()`, `isSupervisor()`, `canManageUsers()` helpers per design interfaces
- [x] 1.2 Modify `web/src/components/protected-route.tsx`: add optional `requiredRoles?: string[]` prop; after `isLoading=false` auth check, redirect to `/inbox` if user role not in `requiredRoles`
- [x] 1.3 Modify `web/src/App.tsx`: pass `requiredRoles={ADMIN_ROLES}` to admin route `<ProtectedRoute>` wrappers

## Phase 2: Core Implementation (Fix Role Checks + Form Bug)

- [x] 2.1 Modify `web/src/pages/users-admin.page.tsx`: change all `<option value="...">` from UPPERCASE to PascalCase (`Admin`, `Supervisor`, `Tecnico`, `Usuario`); set default `formRole` to `'Usuario'`; replace inline role string checks with `canManageUsers()` and `isAdmin()` imports from `roles.ts`
- [x] 2.2 Modify `web/src/pages/empresas-admin.page.tsx`: replace `user.role !== 'Admin' && user.role !== 'admin'` (×2 occurrences) with `!isAdmin(user?.role)` using import from `roles.ts`
- [x] 2.3 Modify `web/src/components/layout.tsx`: import `canManageUsers` from `roles.ts`; replace inline `isAdmin` check; conditionally render "Usuarios" sidebar link only when `canManageUsers(user?.role)` is true

## Phase 3: Premium UI (Additive CSS)

- [x] 3.1 Append `/* ── Premium UI ── */` block to end of `web/src/styles.css` (~200 lines): gradients, layered shadows, transitions, typography improvements, button hover effects — zero existing selector modifications

## Phase 4: Testing

- [x] 4.1 Create `web/src/__tests__/roles.test.ts`: table-driven unit tests for `isAdmin()`, `isSupervisor()`, `canManageUsers()` — cover PascalCase inputs, undefined, empty string, garbled values
- [x] 4.2 Create `web/src/__tests__/protected-route.test.tsx`: render `ProtectedRoute` with mocked auth context; assert redirect to `/inbox` when role not in `requiredRoles`, assert children render when role matches
- [ ] 4.3 Manual QA: edit user with role `Tecnico` → verify `<select>` pre-selects "Tecnico" → save → verify role unchanged in DB
- [ ] 4.4 Manual QA: login as Usuario/Tecnico → verify no "Usuarios" sidebar link; login as Admin/Supervisor → verify link visible
