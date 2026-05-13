import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../auth/entities/user';
import { UserId } from '../shared/value-objects/user-id';
import { Email } from '../shared/value-objects/email';
import { RoleVO, Role } from '../shared/value-objects/role';
import { Password } from '../auth/value-objects/password';
import { Timestamp } from '../shared/value-objects/timestamp';

const validEmail = 'user@example.com';
const validName = 'Juan Pérez';
const validPlaintext = 'SecurePass1';

function createValidUser(role?: RoleVO): User {
  const email = Email.create(validEmail).unwrap();
  const password = Password.create(validPlaintext).unwrap();
  const result = User.create({ email, name: validName, password, role });
  return result.unwrap();
}

describe('User', () => {
  describe('create()', () => {
    it('creates a user with default role Usuario', () => {
      const user = createValidUser();
      expect(user.getRole().get()).toBe(Role.Usuario);
      expect(user.getName()).toBe(validName);
      expect(user.getEmail().get()).toBe(validEmail);
      expect(user.getId()).toBeInstanceOf(UserId);
    });

    it('creates a user with specified role', () => {
      const role = RoleVO.create('Admin').unwrap();
      const user = createValidUser(role);
      expect(user.getRole().get()).toBe(Role.Admin);
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
      const role = RoleVO.reconstruct('Admin');
      const createdAt = Timestamp.reconstruct('2025-01-01T00:00:00Z');
      const updatedAt = Timestamp.reconstruct('2025-01-01T00:00:00Z');

      const user = User.reconstruct({
        id,
        email,
        name: 'Test User',
        role,
        hashedPassword: '$2b$10$hashedpassword123',
        createdAt,
        updatedAt,
      });

      expect(user.getId().equals(id)).toBe(true);
      expect(user.getEmail().equals(email)).toBe(true);
      expect(user.getName()).toBe('Test User');
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
    it('returns true for Admin', () => {
      const admin = createValidUser(RoleVO.create('Admin').unwrap());
      expect(admin.canAssignRole()).toBe(true);
    });

    it('returns false for non-Admin', () => {
      const user = createValidUser(RoleVO.create('Usuario').unwrap());
      expect(user.canAssignRole()).toBe(false);

      const tec = createValidUser(RoleVO.create('Tecnico').unwrap());
      expect(tec.canAssignRole()).toBe(false);
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

  describe('changeRole()', () => {
    it('updates the role', () => {
      const user = createValidUser();
      const newRole = RoleVO.create('Supervisor').unwrap();
      user.changeRole(newRole);
      expect(user.getRole().get()).toBe(Role.Supervisor);
    });
  });

  describe('getIdentity()', () => {
    it('returns userId and role', () => {
      const user = createValidUser();
      const identity = user.getIdentity();
      expect(identity.userId.equals(user.getId())).toBe(true);
      expect(identity.role.equals(user.getRole())).toBe(true);
    });
  });
});
