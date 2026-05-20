# Proposal: Fix Role Casing + Premium UI

## Intent

The frontend role select form uses UPPERCASE values (`USUARIO`, `TECNICO`) while the API returns PascalCase (`Usuario`, `Tecnico`). When editing a user, the `<select>` never matches, silently defaulting to "Usuario" and **corrupting roles on save**. The "Usuarios" sidebar link is always visible (flashes before redirect for non-admin users). Role string comparisons are duplicated across pages with inconsistent casing fallbacks. The UI lacks premium visual polish.

## Scope

### In Scope
- Fix form `<option>` values to PascalCase (matching API) — eliminates the edit-pre-select data corruption bug
- Conditionally hide "Usuarios" sidebar link for non-admin/non-supervisor users (like "Empresas" already works)
- Create `web/src/constants/roles.ts` with canonical role values and helper functions (`isAdmin`, `isSupervisor`, `canManageUsers`)
- Replace all inline role string comparisons with helper functions (4 locations across 3 files)
- Upgrade `styles.css` with premium visual design: gradients, layered shadows, button hover effects, improved typography
- Enhance `ProtectedRoute` with optional `requiredRoles` prop for centralized role-based routing

### Out of Scope
- Backend role logic changes (API guards are correct)
- Prisma schema changes
- New admin-only pages or features
- Dark mode / theme system

## Capabilities

### New Capabilities
<!-- None for this change — visual upgrade and bug fix, no new domain capability introduced. -->

None

### Modified Capabilities
<!-- Existing specs remain unchanged. Role casing is an implementation-level concern, not a spec-level requirement change. The RBAC behavior is already specified in user-auth. -->

None

## Approach

**Comprehensive normalization** (Approach 2 from exploration). Create a single canonical constants file, normalize all frontend role values to PascalCase, fix the form select mismatch, centralize role checks via helpers, and apply premium CSS as additive-only changes (no removal of existing selectors).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web/src/constants/roles.ts` | New | Canonical role constants + helper functions |
| `web/src/pages/users-admin.page.tsx` | Modified | Fix form select values; use role helpers; premium table/card/button styling |
| `web/src/pages/empresas-admin.page.tsx` | Modified | Use role helpers; premium table/button styling |
| `web/src/components/layout.tsx` | Modified | Conditional sidebar rendering; premium sidebar styles |
| `web/src/components/protected-route.tsx` | Modified | Add `requiredRoles` prop |
| `web/src/styles.css` | Modified | Additive-only premium styles (gradients, layered shadows, typography, hover effects) |
| `web/src/App.tsx` | Potentially Modified | Wire `requiredRoles` to routes if ProtectedRoute enhanced |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Form edit pre-select bug — role silently resets to "Usuario" on save | **Active bug** | Fix by aligning option values to PascalCase. Test with Tecnico/Supervisor users. |
| CSS specificity conflicts with existing layouts | Low | Additive-only — no existing selector removal. Group new styles under clearly separated `/* Premium UI */` block. |
| ProtectedRoute `requiredRoles` causes redirect loops | Low | Wait for `isLoading=false` before evaluating roles. Fallback: render children only when role check passes. |
| Scale exceeds 400-line review budget | Medium | CSS changes are additive (~200 lines). If combined diff exceeds budget, split into chained PRs: PR#1 (bug fix + role constants) → PR#2 (premium UI). |

## Rollback Plan

1. CSS changes: delete the additive premium block from `styles.css`. No existing styles modified.
2. Role constants: revert `web/src/constants/roles.ts` creation and inline role string comparisons back.
3. ProtectedRoute: remove `requiredRoles` prop, revert to page-level redirect guards.
4. Form fix: revert `<option>` values to UPPERCASE (reintroduces the bug — rollback is not the default path).

## Dependencies

- None. All changes are frontend-only. API contracts unchanged.

## Success Criteria

- [ ] Editing a user with role "Tecnico" or "Supervisor" correctly pre-selects their role in the form dropdown
- [ ] "Usuarios" sidebar link is NOT visible for Usuario/Tecnico roles
- [ ] No `user?.role === 'Admin' || user?.role === 'admin'` string comparisons remain in UI code
- [ ] All role checks use helper functions from `web/src/constants/roles.ts`
- [ ] Premium styles render without layout breakage on existing pages (login, dashboard, admin)
- [ ] No regression: Admin users can still access and manage both Users and Empresas pages
