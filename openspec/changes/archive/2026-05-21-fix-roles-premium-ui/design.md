# Design: Fix Role Casing + Premium UI

## Technical Approach

Normalize all role values to PascalCase (`Admin`, `Supervisor`, `Tecnico`, `Usuario`) matching the API contract. Extract canonical constants + helpers into a shared module. Fix the edit pre-select bug by aligning `<option>` values. Guard sidebar links and routes via centralized role checks. Apply premium CSS as additive-only block — zero existing selector changes.

## Architecture Decisions

| Decision | Option A | Option B | Chosen | Rationale |
|----------|----------|----------|--------|-----------|
| Role constants location | `web/src/constants/roles.ts` | Inline per file | **A** | Single source of truth; dead-case fallbacks (`'admin'`, `'supervisor'`) removed everywhere |
| Role value casing | PascalCase (`'Admin'`) | UPPERCASE (`'ADMIN'`) | **A** | API returns PascalCase; form `<select>` pre-select bug exists because values don't match API |
| ProtectedRoute role guard | `requiredRoles` prop on route | Keep page-level `useEffect` redirects | **A** | Declarative, colocated with route definition; eliminates flash-before-redirect |
| CSS strategy | Additive block at end of `styles.css` | Inline styles / CSS modules | **A** | Zero regression risk; no existing selectors modified; easy rollback by deleting the block |

## Data Flow

```
API (role: "Tecnico" PascalCase)
  └→ auth.context (UserProfile.role = "Tecnico")
       ├→ roles.ts helpers: isAdmin(role), canManageUsers(role)
       │    ├→ layout.tsx → conditional "Usuarios" sidebar link
       │    └→ ProtectedRoute → requiredRoles guard
       └→ users-admin.page.tsx
            ├→ formRole state = "Usuario" (PascalCase default)
            ├→ <option value="Tecnico"> matches API on edit
            └→ PATCH /auth/users/:id → role: "Tecnico" (correct)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web/src/constants/roles.ts` | **Create** | Canonical role enum values + `isAdmin()`, `isSupervisor()`, `canManageUsers()` helpers |
| `web/src/pages/users-admin.page.tsx` | Modify | Fix `<option>` values to PascalCase; default formRole to `'Usuario'`; replace inline role checks with helpers; add premium table/card classes |
| `web/src/pages/empresas-admin.page.tsx` | Modify | Replace `user.role !== 'Admin' && user.role !== 'admin'` (×2) with `!isAdmin(user?.role)` |
| `web/src/components/layout.tsx` | Modify | Import `canManageUsers`; conditionally render "Usuarios" link (Admin+Supervisor); replace inline `isAdmin` check |
| `web/src/components/protected-route.tsx` | Modify | Accept optional `requiredRoles?: string[]`; after auth check, redirect non-matching roles to `/inbox` |
| `web/src/App.tsx` | Modify | Pass `requiredRoles` to admin routes via ProtectedRoute wrapper |
| `web/src/styles.css` | Modify | Append `/* ── Premium UI ── */` block: ~200 lines additive styles (gradients, shadows, transitions, typography) |

## Interfaces / Contracts

```typescript
// web/src/constants/roles.ts
export const ROLES = {
  Admin: 'Admin',
  Supervisor: 'Supervisor',
  Tecnico: 'Tecnico',
  Usuario: 'Usuario',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: Role[] = [ROLES.Admin];
export const MANAGE_USERS_ROLES: Role[] = [ROLES.Admin, ROLES.Supervisor];

export function isAdmin(role?: string): boolean {
  return role === ROLES.Admin;
}
export function isSupervisor(role?: string): boolean {
  return role === ROLES.Supervisor;
}
export function canManageUsers(role?: string): boolean {
  return isAdmin(role) || isSupervisor(role);
}
```

```typescript
// ProtectedRoute new prop
interface ProtectedRouteProps {
  requiredRoles?: string[];
}
// Usage in App.tsx:
<Route element={<ProtectedRoute requiredRoles={ADMIN_ROLES} />}>
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit (vitest) | `roles.ts` helpers | Table-driven: PascalCase, undefined, garbled inputs |
| Unit (vitest) | `ProtectedRoute` with `requiredRoles` | Render with auth context mock; assert redirect vs render |
| Manual QA | Edit user with role `Tecnico` | Open form → verify `<select>` pre-selects "Tecnico" → save → verify unchanged |
| Manual QA | Sidebar visibility | Login as Usuario/Tecnico → no "Usuarios" link; as Admin/Supervisor → link visible |
| Manual QA | Premium CSS | Visual inspection of login, sidebar, tables, cards, buttons across pages |

## Migration / Rollout

No migration required. Rollback: delete the `/* ── Premium UI ── */` block from `styles.css` and revert `roles.ts` imports (inline checks restored). No data migration — roles already stored as PascalCase in DB.

## Open Questions

None — all patterns confirmed in codebase.
