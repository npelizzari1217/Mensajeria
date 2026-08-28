import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../auth/entities/user';
import { UserId } from '../shared/value-objects/user-id';
import { Email } from '../shared/value-objects/email';
import { Password } from '../auth/value-objects/password';
import { Timestamp } from '../shared/value-objects/timestamp';

const validEmail = 'user@example.com';
const validName = 'Juan Pérez';
const validPlaintext = 'SecurePass1';

function createValidUser(roleId?: number): User {
  const email = Email.create(validEmail).unwrap();
  const password = Password.create(validPlaintext).unwrap();
  const result = User.create({ email, name: validName, password, roleId });
  return result.unwrap();
}

describe('User', () => {
  describe('create()', () => {
    it('creates a user with default role 4 (Usuario)', () => {
      const user = createValidUser();
      expect(user.getRoleId()).toBe(4);
      expect(user.getName()).toBe(validName);
      expect(user.getEmail().get()).toBe(validEmail);
      expect(user.getId()).toBeInstanceOf(UserId);
    });

    it('creates a user with specified roleId', () => {
      const user = createValidUser(1);
      expect(user.getRoleId()).toBe(1);
    });

    it('fails with empty name', () => {
      const email = Email.create(validEmail).unwrap();
      const password = Password.create(validPlaintext).unwrap();
      const result = User.create({ email, name: '', password });
      expect(result.isErr()).toBe(true);
    });

    it('fails with whitespace-only name', () => {
      const email = Email.create(validEmail).unwrap();
      const password = Password.create(validPlaintext).unwrap();
      const result = User.create({ email, name: '   ', password });
      expect(result.isErr()).toBe(true);
    });

    it('trims the name', () => {
      const email = Email.create(validEmail).unwrap();
      const password = Password.create(validPlaintext).unwrap();
      const user = User.create({ email, name: '  Juan  ', password }).unwrap();
      expect(user.getName()).toBe('Juan');
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs a user from persistence data', () => {
      const id = UserId.reconstruct('550e8400-e29b-41d4-a716-446655440000');
      const email = Email.reconstruct('test@example.com');
      const createdAt = Timestamp.reconstruct('2025-01-01T00:00:00Z');
      const updatedAt = Timestamp.reconstruct('2025-01-01T00:00:00Z');

      const user = User.reconstruct({
        id,
        email,
        name: 'Test User',
        roleId: 1,
        hashedPassword: '$2b$10$hashedpassword123',
        createdAt,
        updatedAt,
      });

      expect(user.getId().equals(id)).toBe(true);
      expect(user.getEmail().equals(email)).toBe(true);
      expect(user.getName()).toBe('Test User');
      expect(user.getRoleId()).toBe(1);
      expect(user.getHashedPassword()).toBe('$2b$10$hashedpassword123');
    });
  });

  describe('canSendMessage()', () => {
    it('returns true for any user role', () => {
      const user = createValidUser();
      expect(user.canSendMessage()).toBe(true);
    });
  });

  describe('canAssignRole()', () => {
    it('returns true for Admin assigning any role', () => {
      const admin = createValidUser(1);
      expect(admin.canAssignRole(1)).toBe(true);   // Admin can assign Admin
      expect(admin.canAssignRole(2)).toBe(true);   // Admin can assign Supervisor
      expect(admin.canAssignRole(3)).toBe(true);   // Admin can assign Técnico
      expect(admin.canAssignRole(4)).toBe(true);   // Admin can assign Usuario
    });

    it('returns true for Supervisor assigning Técnico or Usuario', () => {
      const supervisor = createValidUser(2);
      expect(supervisor.canAssignRole(1)).toBe(false); // Supervisor cannot assign Admin
      expect(supervisor.canAssignRole(2)).toBe(false); // Supervisor cannot assign Supervisor
      expect(supervisor.canAssignRole(3)).toBe(true);  // Supervisor can assign Técnico
      expect(supervisor.canAssignRole(4)).toBe(true);  // Supervisor can assign Usuario
    });

    it('returns false for non-privileged roles', () => {
      const tecnico = createValidUser(3);
      expect(tecnico.canAssignRole(4)).toBe(false);

      const user = createValidUser(4);
      expect(user.canAssignRole(4)).toBe(false);
    });
  });

  describe('setHashedPassword()', () => {
    it('updates the hashed password', () => {
      const user = createValidUser();
      user.setHashedPassword('$2b$10$newhashedvalue');
      expect(user.getHashedPassword()).toBe('$2b$10$newhashedvalue');
    });
  });

  describe('changeName()', () => {
    it('updates the name', () => {
      const user = createValidUser();
      const result = user.changeName('New Name');
      expect(result.isOk()).toBe(true);
      expect(user.getName()).toBe('New Name');
    });

    it('fails with empty name', () => {
      const user = createValidUser();
      const result = user.changeName('');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('changeRoleId()', () => {
    it('updates the role', () => {
      const user = createValidUser(4);
      user.changeRoleId(2);
      expect(user.getRoleId()).toBe(2);
    });
  });

  describe('getIdentity()', () => {
    it('returns userId and roleId', () => {
      const user = createValidUser(1);
      const identity = user.getIdentity();
      expect(identity.userId.equals(user.getId())).toBe(true);
      expect(identity.roleId).toBe(1);
    });
  });
});
