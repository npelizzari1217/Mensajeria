import { describe, it, expect } from 'vitest';
import { Group } from '../messaging/entities/group';
import { GroupRole } from '../messaging/value-objects/group-role';
import { UserId } from '../shared/value-objects/user-id';
import { Timestamp } from '../shared/value-objects/timestamp';

describe('Group', () => {
  const userId = UserId.reconstruct('user-1');
  const userId2 = UserId.reconstruct('user-2');
  const userId3 = UserId.reconstruct('user-3');

  describe('create', () => {
    it('should create a group with creator as ADMIN', () => {
      const result = Group.create('Developers', 'Backend team', userId);
      expect(result.isOk()).toBe(true);
      const group = result.unwrap();
      expect(group.getName()).toBe('Developers');
      expect(group.getDescription()).toBe('Backend team');
      expect(group.isActiveGroup()).toBe(true);
      expect(group.getCreatedBy().equals(userId)).toBe(true);
      expect(group.isAdmin(userId)).toBe(true);
      expect(group.getMembers()).toHaveLength(1);
    });

    it('should create without description', () => {
      const result = Group.create('Designers', null, userId);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().getDescription()).toBeNull();
    });

    it('should reject empty name', () => {
      const result = Group.create('', 'desc', userId);
      expect(result.isErr()).toBe(true);
    });

    it('should reject whitespace-only name', () => {
      const result = Group.create('   ', 'desc', userId);
      expect(result.isErr()).toBe(true);
    });

    it('should reject name over 100 chars', () => {
      const result = Group.create('A'.repeat(101), 'desc', userId);
      expect(result.isErr()).toBe(true);
    });

    it('should trim name', () => {
      const result = Group.create('  DevOps  ', 'team', userId);
      expect(result.unwrap().getName()).toBe('DevOps');
    });
  });

  describe('addMember', () => {
    it('should add member by admin', () => {
      const group = Group.create('Test', null, userId).unwrap();
      const result = group.addMember(userId2, GroupRole.MEMBER, userId);
      expect(result.isOk()).toBe(true);
      expect(group.getMembers()).toHaveLength(2);
      expect(group.isMember(userId2)).toBe(true);
    });

    it('should reject add by non-admin', () => {
      const group = Group.create('Test', null, userId).unwrap();
      const result = group.addMember(userId2, GroupRole.MEMBER, userId2);
      expect(result.isErr()).toBe(true);
    });

    it('should reject duplicate member', () => {
      const group = Group.create('Test', null, userId).unwrap();
      group.addMember(userId2, GroupRole.MEMBER, userId);
      const result = group.addMember(userId2, GroupRole.MEMBER, userId);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('removeMember', () => {
    it('should remove member by admin', () => {
      const group = Group.create('Test', null, userId).unwrap();
      group.addMember(userId2, GroupRole.MEMBER, userId);
      const result = group.removeMember(userId2, userId);
      expect(result.isOk()).toBe(true);
      expect(group.getMembers()).toHaveLength(1);
      expect(group.isMember(userId2)).toBe(false);
    });

    it('should prevent admin self-removal', () => {
      const group = Group.create('Test', null, userId).unwrap();
      const result = group.removeMember(userId, userId);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('leaveGroup', () => {
    it('should let member leave', () => {
      const group = Group.create('Test', null, userId).unwrap();
      group.addMember(userId2, GroupRole.MEMBER, userId);
      const result = group.leaveGroup(userId2);
      expect(result.isOk()).toBe(true);
      expect(group.isMember(userId2)).toBe(false);
    });

    it('should reject leave for non-member', () => {
      const group = Group.create('Test', null, userId).unwrap();
      const result = group.leaveGroup(userId2);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('changeMemberRole', () => {
    it('should change role by admin', () => {
      const group = Group.create('Test', null, userId).unwrap();
      group.addMember(userId2, GroupRole.MEMBER, userId);
      const result = group.changeMemberRole(userId2, GroupRole.ADMIN, userId);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().getRole().isAdmin()).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate group', () => {
      const group = Group.create('Test', null, userId).unwrap();
      const result = group.deactivate(userId);
      expect(result.isOk()).toBe(true);
      expect(group.isActiveGroup()).toBe(false);
    });

    it('should reject operations on inactive group', () => {
      const group = Group.create('Test', null, userId).unwrap();
      group.addMember(userId2, GroupRole.MEMBER, userId);
      group.deactivate(userId);
      const result = group.addMember(userId3, GroupRole.MEMBER, userId);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct from props', () => {
      const now = Timestamp.now();
      const group = Group.reconstruct({
        id: 'fixed-id',
        name: 'Reconstructed',
        description: 'desc',
        createdBy: userId,
        members: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      expect(group.getId()).toBe('fixed-id');
      expect(group.getName()).toBe('Reconstructed');
      expect(group.getMembers()).toHaveLength(0);
    });
  });

  describe('getActiveMemberIds', () => {
    it('should return all member user IDs', () => {
      const group = Group.create('Test', null, userId).unwrap();
      group.addMember(userId2, GroupRole.MEMBER, userId);
      group.addMember(userId3, GroupRole.MEMBER, userId);
      const ids = group.getActiveMemberIds();
      expect(ids).toHaveLength(3);
    });
  });
});
