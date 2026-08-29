import { describe, it, expect } from 'vitest';
import { RoleId } from '../value-objects/role-id';
import { RoleName } from '../value-objects/role-name';
import { Role } from '../entities/role';

// ── RoleId ──────────────────────────────────────────────────────────

describe('RoleId', () => {
  describe('create()', () => {
    it('RoleId.create(1) → ok, equals funciona', () => {
      const result = RoleId.create(1);
      expect(result.isOk()).toBe(true);
      const id = result.unwrap();
      expect(id.get()).toBe(1);
      expect(id.equals(RoleId.reconstruct(1))).toBe(true);
    });

    it('RoleId.create(-1) → err', () => {
      const result = RoleId.create(-1);
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('positive');
    });

    it('RoleId.create(0) → err', () => {
      const result = RoleId.create(0);
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('positive');
    });

    it('RoleId.create(3.14) → err', () => {
      const result = RoleId.create(3.14);
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('integer');
    });
  });

  describe('isAtLeast()', () => {
    it('Admin(1) ≥ Supervisor(2) → true', () => {
      const admin = RoleId.reconstruct(1);
      const supervisor = RoleId.reconstruct(2);
      expect(admin.isAtLeast(supervisor)).toBe(true);
    });

    it('Supervisor(2) ≥ Admin(1) → false', () => {
      const supervisor = RoleId.reconstruct(2);
      const admin = RoleId.reconstruct(1);
      expect(supervisor.isAtLeast(admin)).toBe(false);
    });

    it('Supervisor(2) ≥ Supervisor(2) → true (equal)', () => {
      const supervisor = RoleId.reconstruct(2);
      expect(supervisor.isAtLeast(RoleId.reconstruct(2))).toBe(true);
    });

    it('Técnico(3) ≥ Supervisor(2) → false', () => {
      expect(RoleId.Tecnico.isAtLeast(RoleId.Supervisor)).toBe(false);
    });

    it('Admin(1) ≥ Admin(1) → true', () => {
      expect(RoleId.Admin.isAtLeast(RoleId.Admin)).toBe(true);
    });
  });

  describe('constants', () => {
    it('Admin = 1', () => expect(RoleId.Admin.get()).toBe(1));
    it('Supervisor = 2', () => expect(RoleId.Supervisor.get()).toBe(2));
    it('Técnico = 3', () => expect(RoleId.Tecnico.get()).toBe(3));
    it('Usuario = 4', () => expect(RoleId.Usuario.get()).toBe(4));
  });

  describe('equals()', () => {
    it('same values are equal', () => {
      expect(RoleId.reconstruct(1).equals(RoleId.reconstruct(1))).toBe(true);
    });

    it('different values are not equal', () => {
      expect(RoleId.reconstruct(1).equals(RoleId.reconstruct(2))).toBe(false);
    });
  });
});

// ── RoleName ────────────────────────────────────────────────────────

describe('RoleName', () => {
  describe('create()', () => {
    it('RoleName.create("Admin") → ok, equals funciona', () => {
      const result = RoleName.create('Admin');
      expect(result.isOk()).toBe(true);
      const name = result.unwrap();
      expect(name.get()).toBe('Admin');
      expect(name.equals(RoleName.reconstruct('Admin'))).toBe(true);
    });

    it('RoleName.create("A") → err (muy corto)', () => {
      const result = RoleName.create('A');
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('at least 2');
    });

    it('RoleName.create("") → err', () => {
      const result = RoleName.create('');
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('at least 2');
    });

    it('RoleName.create(51 chars) → err', () => {
      const longName = 'A'.repeat(51);
      const result = RoleName.create(longName);
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('50');
    });

    it('RoleName.create("Super Usuario") → ok (spaces allowed)', () => {
      const result = RoleName.create('Super Usuario');
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().get()).toBe('Super Usuario');
    });

    it('RoleName.create("Técnico") → ok (accented allowed)', () => {
      const result = RoleName.create('Técnico');
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().get()).toBe('Técnico');
    });

    it('RoleName.create("Admin123") → err (digits not allowed)', () => {
      const result = RoleName.create('Admin123');
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('letters');
    });

    it('RoleName.create with whitespace trims', () => {
      const result = RoleName.create('  Admin  ');
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().get()).toBe('Admin');
    });
  });

  describe('reconstruct()', () => {
    it('skips validation', () => {
      const name = RoleName.reconstruct('X');
      expect(name.get()).toBe('X');
    });
  });

  describe('equals()', () => {
    it('same names are equal', () => {
      expect(RoleName.create('Admin').unwrap().equals(RoleName.reconstruct('Admin'))).toBe(true);
    });

    it('different names are not equal', () => {
      expect(RoleName.create('Admin').unwrap().equals(RoleName.reconstruct('Supervisor'))).toBe(false);
    });
  });
});

// ── Role ────────────────────────────────────────────────────────────

describe('Role', () => {
  describe('create()', () => {
    it('Role.create(props) → ok, getters funcionan', () => {
      const id = RoleId.reconstruct(1);
      const name = RoleName.create('Admin').unwrap();
      const result = Role.create({ id, name, description: 'System administrator' });

      expect(result.isOk()).toBe(true);
      const role = result.unwrap();
      expect(role.id.get()).toBe(1);
      expect(role.getName().get()).toBe('Admin');
      expect(role.getDescription()).toBe('System administrator');
    });

    it('Role.create({ name: "", description: "..." }) → err (nombre inválido)', () => {
      const id = RoleId.reconstruct(5);
      const nameResult = RoleName.create('');
      expect(nameResult.isErr()).toBe(true);
    });

    it('Role.create with empty description → err', () => {
      const id = RoleId.reconstruct(5);
      const name = RoleName.create('CustomRole').unwrap();
      const result = Role.create({ id, name, description: '' });

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('description');
    });

    it('Role.create with whitespace-only description → err', () => {
      const id = RoleId.reconstruct(5);
      const name = RoleName.create('CustomRole').unwrap();
      const result = Role.create({ id, name, description: '   ' });

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('description');
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs from persistence data', () => {
      const id = RoleId.reconstruct(1);
      const name = RoleName.reconstruct('Admin');
      const role = Role.reconstruct({ id, name, description: 'Administrator role' });

      expect(role.id.get()).toBe(1);
      expect(role.getName().get()).toBe('Admin');
      expect(role.getDescription()).toBe('Administrator role');
    });
  });

  describe('rename()', () => {
    it('cambia el nombre', () => {
      const id = RoleId.reconstruct(1);
      const name = RoleName.create('Admin').unwrap();
      const role = Role.create({ id, name, description: 'Admin role' }).unwrap();

      const newName = RoleName.create('Administrador').unwrap();
      role.rename(newName);

      expect(role.getName().get()).toBe('Administrador');
    });
  });

  describe('changeDescription()', () => {
    it('updates the description', () => {
      const id = RoleId.reconstruct(1);
      const name = RoleName.create('Admin').unwrap();
      const role = Role.create({ id, name, description: 'Old desc' }).unwrap();

      role.changeDescription('New description');

      expect(role.getDescription()).toBe('New description');
    });

    it('throws on empty description', () => {
      const id = RoleId.reconstruct(1);
      const name = RoleName.create('Admin').unwrap();
      const role = Role.create({ id, name, description: 'Old desc' }).unwrap();

      expect(() => role.changeDescription('')).toThrow('Description cannot be empty');
    });
  });

  describe('isHigherThan()', () => {
    const admin = Role.reconstruct({
      id: RoleId.reconstruct(1),
      name: RoleName.reconstruct('Admin'),
      description: 'Admin',
    });
    const supervisor = Role.reconstruct({
      id: RoleId.reconstruct(2),
      name: RoleName.reconstruct('Supervisor'),
      description: 'Supervisor',
    });
    const tecnico = Role.reconstruct({
      id: RoleId.reconstruct(3),
      name: RoleName.reconstruct('Técnico'),
      description: 'Técnico',
    });
    const usuario = Role.reconstruct({
      id: RoleId.reconstruct(4),
      name: RoleName.reconstruct('Usuario'),
      description: 'Usuario',
    });

    it('Admin > Usuario → true', () => {
      expect(admin.isHigherThan(usuario)).toBe(true);
    });

    it('Admin > Supervisor → true', () => {
      expect(admin.isHigherThan(supervisor)).toBe(true);
    });

    it('Usuario > Admin → false', () => {
      expect(usuario.isHigherThan(admin)).toBe(false);
    });

    it('Supervisor > Técnico → true', () => {
      expect(supervisor.isHigherThan(tecnico)).toBe(true);
    });

    it('Técnico > Usuario → true', () => {
      expect(tecnico.isHigherThan(usuario)).toBe(true);
    });

    it('Admin > Admin → false (same rank)', () => {
      expect(admin.isHigherThan(admin)).toBe(false);
    });
  });

  describe('isAtLeast()', () => {
    const admin = Role.reconstruct({
      id: RoleId.reconstruct(1),
      name: RoleName.reconstruct('Admin'),
      description: 'Admin',
    });
    const supervisor = Role.reconstruct({
      id: RoleId.reconstruct(2),
      name: RoleName.reconstruct('Supervisor'),
      description: 'Supervisor',
    });
    const tecnico = Role.reconstruct({
      id: RoleId.reconstruct(3),
      name: RoleName.reconstruct('Técnico'),
      description: 'Técnico',
    });
    const usuario = Role.reconstruct({
      id: RoleId.reconstruct(4),
      name: RoleName.reconstruct('Usuario'),
      description: 'Usuario',
    });

    it('Admin ≥ Supervisor → true', () => {
      expect(admin.isAtLeast(RoleId.Supervisor)).toBe(true);
    });

    it('Admin ≥ Usuario → true', () => {
      expect(admin.isAtLeast(RoleId.Usuario)).toBe(true);
    });

    it('Usuario ≥ Admin → false', () => {
      expect(usuario.isAtLeast(RoleId.Admin)).toBe(false);
    });

    it('Supervisor ≥ Técnico → true', () => {
      expect(supervisor.isAtLeast(RoleId.Tecnico)).toBe(true);
    });

    it('Usuario ≥ Supervisor → false', () => {
      expect(usuario.isAtLeast(RoleId.Supervisor)).toBe(false);
    });

    it('Técnico ≥ Técnico → true (equal)', () => {
      expect(tecnico.isAtLeast(RoleId.Tecnico)).toBe(true);
    });
  });
});
