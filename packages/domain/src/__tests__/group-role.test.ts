import { describe, it, expect } from 'vitest';
import { GroupRole } from '../messaging/value-objects/group-role';

describe('GroupRole', () => {
  it('should create ADMIN role', () => {
    const role = GroupRole.create('ADMIN');
    expect(role.get()).toBe('ADMIN');
    expect(role.isAdmin()).toBe(true);
    expect(role.isMember()).toBe(false);
  });

  it('should create MEMBER role', () => {
    const role = GroupRole.create('MEMBER');
    expect(role.get()).toBe('MEMBER');
    expect(role.isMember()).toBe(true);
    expect(role.isAdmin()).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(GroupRole.create('admin').get()).toBe('ADMIN');
    expect(GroupRole.create('Admin').get()).toBe('ADMIN');
    expect(GroupRole.create('member').get()).toBe('MEMBER');
  });

  it('should reject invalid role', () => {
    expect(() => GroupRole.create('OWNER')).toThrow('Invalid group role');
  });

  it('should compare equality', () => {
    const a = GroupRole.create('ADMIN');
    const b = GroupRole.create('ADMIN');
    const c = GroupRole.create('MEMBER');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('should have static instances', () => {
    expect(GroupRole.ADMIN.get()).toBe('ADMIN');
    expect(GroupRole.MEMBER.get()).toBe('MEMBER');
  });
});
