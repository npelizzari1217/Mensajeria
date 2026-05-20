import { describe, it, expect } from 'vitest';
import { ROLES, ADMIN_ROLES, MANAGE_USERS_ROLES, isAdmin, isSupervisor, canManageUsers } from '../constants/roles';

// ── Consts ───────────────────────────────────────────────────────────

describe('ROLES', () => {
  it('contains all four role values in PascalCase', () => {
    expect(ROLES.Admin).toBe('Admin');
    expect(ROLES.Supervisor).toBe('Supervisor');
    expect(ROLES.Tecnico).toBe('Tecnico');
    expect(ROLES.Usuario).toBe('Usuario');
  });
});

describe('ADMIN_ROLES', () => {
  it('contains only Admin', () => {
    expect(ADMIN_ROLES).toEqual([ROLES.Admin]);
  });
});

describe('MANAGE_USERS_ROLES', () => {
  it('contains Admin and Supervisor', () => {
    expect(MANAGE_USERS_ROLES).toEqual([ROLES.Admin, ROLES.Supervisor]);
  });
});

// ── isAdmin ──────────────────────────────────────────────────────────

describe('isAdmin', () => {
  it('returns true for PascalCase "Admin"', () => {
    expect(isAdmin('Admin')).toBe(true);
  });

  it('returns true for lowercase "admin" (backwards compatibility)', () => {
    expect(isAdmin('admin')).toBe(true);
  });

  it('returns true for mixed-case "ADMIN"', () => {
    expect(isAdmin('ADMIN')).toBe(true);
  });

  it('returns true for odd-case "AdMiN"', () => {
    expect(isAdmin('AdMiN')).toBe(true);
  });

  it('returns false for undefined', () => {
    expect(isAdmin(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAdmin('')).toBe(false);
  });

  it('returns false for other roles', () => {
    expect(isAdmin('Supervisor')).toBe(false);
    expect(isAdmin('Tecnico')).toBe(false);
    expect(isAdmin('Usuario')).toBe(false);
  });

  it('returns false for garbled values', () => {
    expect(isAdmin('not-a-role')).toBe(false);
    expect(isAdmin('administrator')).toBe(false);
    expect(isAdmin('root')).toBe(false);
  });
});

// ── isSupervisor ─────────────────────────────────────────────────────

describe('isSupervisor', () => {
  it('returns true for PascalCase "Supervisor"', () => {
    expect(isSupervisor('Supervisor')).toBe(true);
  });

  it('returns true for lowercase "supervisor" (backwards compatibility)', () => {
    expect(isSupervisor('supervisor')).toBe(true);
  });

  it('returns true for mixed-case "SUPERVISOR"', () => {
    expect(isSupervisor('SUPERVISOR')).toBe(true);
  });

  it('returns true for odd-case "SuPeRvIsOr"', () => {
    expect(isSupervisor('SuPeRvIsOr')).toBe(true);
  });

  it('returns false for undefined', () => {
    expect(isSupervisor(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isSupervisor('')).toBe(false);
  });

  it('returns false for other roles', () => {
    expect(isSupervisor('Admin')).toBe(false);
    expect(isSupervisor('Tecnico')).toBe(false);
    expect(isSupervisor('Usuario')).toBe(false);
  });

  it('returns false for garbled values', () => {
    expect(isSupervisor('not-a-role')).toBe(false);
    expect(isSupervisor('manager')).toBe(false);
  });
});

// ── canManageUsers ───────────────────────────────────────────────────

describe('canManageUsers', () => {
  it('returns true for Admin (PascalCase)', () => {
    expect(canManageUsers('Admin')).toBe(true);
  });

  it('returns true for Supervisor (PascalCase)', () => {
    expect(canManageUsers('Supervisor')).toBe(true);
  });

  it('returns true for lowercase "admin"', () => {
    expect(canManageUsers('admin')).toBe(true);
  });

  it('returns true for lowercase "supervisor"', () => {
    expect(canManageUsers('supervisor')).toBe(true);
  });

  it('returns false for Tecnico', () => {
    expect(canManageUsers('Tecnico')).toBe(false);
  });

  it('returns false for Usuario', () => {
    expect(canManageUsers('Usuario')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(canManageUsers(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(canManageUsers('')).toBe(false);
  });

  it('returns false for garbled values', () => {
    expect(canManageUsers('random')).toBe(false);
    expect(canManageUsers('super-user')).toBe(false);
  });
});
