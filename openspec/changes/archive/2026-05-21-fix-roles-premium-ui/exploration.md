## Exploration: fix-roles-premium-ui

### Current State

**Role value pipeline** — four different representations exist across the stack:

| Layer | Format | Example |
|-------|--------|---------|
| Domain (`Role` enum) | PascalCase | `'Admin'`, `'Supervisor'`, `'Tecnico'`, `'Usuario'` |
| Prisma schema (`Role` enum) | UPPERCASE | `ADMIN`, `SUPERVISOR`, `TECNICO`, `USUARIO` |
| API response (all endpoints) | PascalCase (from domain) | `{ role: 'Admin' }` |
| Frontend form values | UPPERCASE | `"ADMIN"`, `"USUARIO"` |
| Frontend role comparisons | PascalCase + lowercase fallback | `role === 'Admin' \|\| role === 'admin'` |

The backend `RoleVO.create(raw)` in `packages/domain/src/shared/value-objects/role.ts` accepts case-insensitive input and normalizes to PascalCase. The Prisma mapper in `api/src/infrastructure/persistence/prisma/mappers/user-mapper.ts` translates between domain PascalCase and Prisma UPPERCASE. All use cases return `user.getRole().get()` which is PascalCase.

**API role guards are correct**: `@Roles(Role.Admin)` correctly references the domain enum. `ListUsersUseCase` correctly filters by `empresaId` for non-Admin callers. `RegisterUserUseCase` enforces Supervisor cannot assign Admin role or cross-empresa registration.

**Frontend auth flow**: `ProtectedRoute` only checks `isAuthenticated` — no role guards. Individual pages (users-admin, empresas-admin) implement their own `useEffect` redirects with role checks. Sidebar menu filtering uses an `isAdmin` variable.

**Current styles.css** (760 lines) already contains basic visual design: flat buttons, single-color sidebar, basic rounded corners, one gradient (login page), minimal shadows. No premium flair (gradient accents, layered shadows, typography hierarchy, enhanced hover states, glassmorphism effects).

### Affected Areas

- `web/src/components/layout.tsx` — Role check for Admin menu visibility (line 17). Currently works but brittle (inconsistent with rest of codebase). Premium UI: sidebar redesign.
- `web/src/pages/users-admin.page.tsx` — Role checks (lines 20-21), redirect logic (lines 26-30), form role select values (lines 205-208), role badge display (line 261). SELECT PRE-SELECT BUG: when editing a user, `setFormRole(u.role)` sets PascalCase but option values are UPPERCASE — the select always falls back to "Usuario". Premium UI: table, cards, buttons.
- `web/src/pages/empresas-admin.page.tsx` — Role checks and redirect (lines 28-32, 96). Premium UI: table, cards, buttons.
- `web/src/components/protected-route.tsx` — Only checks authentication, NOT roles. No centralized role-based routing.
- `web/src/styles.css` — Premium UI target. Gradients, layered shadows, button hover effects, typography improvements.
- `web/src/App.tsx` — Route definitions without role-scoped guards. If ProtectedRoute is enhanced, route config may need changes.
- `packages/domain/src/shared/value-objects/role.ts` — NOT directly affected, but the `Role` enum values are the source of truth. No changes needed.
- `api/src/presentation/auth/auth.controller.ts` — NOT affected. Backend role enforcement is correct.

### Additional Discoveries (not in initial exploration context)

#### Discovery 1: INITIAL EXPLORATION CONTEXT IS PARTIALLY INACCURATE

The exploration context claimed the frontend compares roles with `'ADMIN'`/`'SUPERVISOR'` (UPPERCASE) causing all checks to fail. **This is incorrect.** The actual code at each cited location uses:

- `layout.tsx:17` → `user?.role === 'Admin' || user?.role === 'admin'` — **works correctly**
- `users-admin.page.tsx:20-21` → `user?.role === 'Admin' || ...` and `... === 'Supervisor' || ...` — **works correctly**
- `users-admin.page.tsx:250` → `u.role === 'Admin' || u.role === 'admin'` — **works correctly**
- `empresas-admin.page.tsx:29,96` → `user.role !== 'Admin' && user.role !== 'admin'` — **works correctly**

The API returns PascalCase (`'Admin'`), and the frontend checks PascalCase with a lowercase safety net. Admin users CAN see the Empresas menu and CAN access the Users page.

#### Discovery 2: FORM EDITING ROLE PRE-SELECT BUG (real bug)

In `users-admin.page.tsx`:
- Form role select options use UPPERCASE values: `<option value="USUARIO">`, `<option value="TECNICO">`, `<option value="SUPERVISOR">`, `<option value="ADMIN">`
- When editing a user: `setFormRole(u.role)` — `u.role` comes from API as PascalCase (`'Usuario'`, `'Tecnico'`, etc.)
- The `<select value={formRole}>` won't match any `<option>` when `formRole` is PascalCase and options are UPPERCASE
- Result: the select always shows "Usuario" regardless of the user's actual role when editing. The role is silently changed to "Usuario" on save unless the user manually re-selects.

This is a **data integrity risk**: editing a user's name/email without touching the role dropdown will reset their role to "Usuario".

#### Discovery 3: CASE INCONSISTENCY IS THE ROOT PROBLEM, NOT BROKEN COMPARISONS

The real issue is technical debt: role values have different casing in different places (form UPPERCASE vs API PascalCase vs domain PascalCase vs Prisma UPPERCASE). The `RoleVO.create()` handles normalization gracefully, but the frontend form is out of sync. The PascalCase-formatted comparisons happen to work because they match the API response. The brittle comparisons (`|| 'admin'`) suggest the developer who wrote them wasn't sure about the casing either.

#### Discovery 4: NO CENTRALIZED ROLE GUARD IN FRONTEND

`ProtectedRoute` only checks `isAuthenticated`. Each admin page has duplicated redirect logic. If a new admin-only page is added, developers must remember to copy the role check pattern. A `ProtectedRoute` with optional `requiredRoles` prop would centralize this.

#### Discovery 5: SIDEBAR ALWAYS SHOWS "Usuarios" LINK

In `layout.tsx` line 27, the "Usuarios" link is always included in navLinks regardless of role. The page itself has a redirect for unauthorized users, so clicking it as a regular user shows a flash of the page before redirecting. Better to conditionally render the link (like "Empresas" already is).

#### Discovery 6: NO DEDICATED API CLIENT FUNCTION FOR USERS CRUD

`users-admin.page.tsx` calls `apiClient.get('/auth/contacts')` directly. Other pages like `empresas-admin.page.tsx` use dedicated client functions (`getEmpresas`, `createEmpresa`, etc.) from `api/client.ts`. Inconsistent pattern.

### Approaches

#### 1. **Minimal fix — align form values to API casing + conditional sidebar**

Fix the form select values to match PascalCase (`'Admin'`, `'Supervisor'`, `'Tecnico'`, `'Usuario'`), add conditional rendering for "Usuarios" sidebar link based on role, and optionally add a `requiredRoles` prop to `ProtectedRoute`.

- **Pros**: Small change, low regression risk, fixes the real edit-pre-select bug
- **Cons**: Doesn't address casing inconsistency across the codebase, doesn't add premium UI
- **Effort**: Low

#### 2. **Comprehensive normalization — single role format everywhere + premium UI**

- Create a shared constants file (`web/src/constants/roles.ts`) with canonical role constants and a helper function for role comparison
- Normalize ALL frontend role values to PascalCase (form values, select options)
- Enhance `ProtectedRoute` with `requiredRoles` prop
- Conditional sidebar rendering for admin links
- Comprehensive premium UI upgrade in `styles.css` (gradients, layered shadows, typography, hover effects)
- Optionally extract admin API functions into `api/client.ts`

- **Pros**: Eliminates the root cause (casing inconsistency), centralizes role logic, professional premium UI, harder to reintroduce similar bugs
- **Cons**: Larger change (~150-300 LOC spread across multiple files), needs thorough testing of all role checks
- **Effort**: Medium

#### 3. **Hybrid — fix the bug + premium UI only**

Fix only the form select mismatch and add premium UI styling. Leave role comparisons as-is (they work). Don't refactor ProtectedRoute or create shared constants.

- **Pros**: Less risky than full normalization, ships premium UI quickly
- **Cons**: Keeps casing inconsistency, no centralized guard, surface-level fix
- **Effort**: Low-Medium

### Recommendation

**Approach 2 — Comprehensive normalization**. The form editing bug is a data integrity issue that needs fixing. The casing inconsistency is technical debt that WILL cause confusion for future developers (it already caused incorrect bug reports in the exploration context). Adding premium UI fits naturally in the same change since it touches the same files. Centralizing role logic in shared constants makes the codebase more maintainable.

Specific implementation plan:
1. Create `web/src/constants/roles.ts` with `ROLE` constants and `isAdmin()`, `isSupervisor()`, `canManageUsers()` helpers
2. Fix form select values to use PascalCase (matching API response)
3. Enhance `ProtectedRoute` to accept `requiredRoles` prop
4. Update sidebar to conditionally render admin links using role helpers
5. Replace all inline role string comparisons with helper functions
6. Upgrade `styles.css` with premium visual design
7. Add dedicated admin API functions if needed

### Risks

- **Edit-pre-select bug causing silent role corruption**: If the fix isn't applied carefully, the form still defaults to "Usuario" on edit. Must test with `Tecnico` and `Supervisor` users specifically.
- **Case normalization introduces API contract dependency**: If the API ever changes role casing (unlikely given domain stability), frontend breaks. Mitigated by using the same `Role` enum export from domain (if feasible) or a canonical constants file that mirrors it.
- **Premium UI regression**: Visual changes could break existing layouts if CSS specificity isn't managed. Mitigated by additive-only CSS changes (no removal of existing selectors).
- **ProtectedRoute role enforcement**: Adding `requiredRoles` could cause redirect loops if not carefully implemented (e.g., checking roles before user data loads). Mitigated by waiting for `isLoading=false` before evaluating roles.
- **Scale of change**: ~5 files touched. Delivery strategy should consider chained PRs if near the 400-line budget. CSS changes alone may exceed that.

### Ready for Proposal

**Yes.** The exploration reveals that the initial bug report was partially inaccurate (role comparisons DO work), but uncovered a real bug (form edit pre-select mismatch) and systemic technical debt (role value casing inconsistency). Combined with the premium UI request, this constitutes a well-scoped change: fix the consistency, centralize role logic, upgrade visuals. Ready for sdd-propose.
