import { UserId } from '../../shared/value-objects/user-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result, ok, err } from '../../shared/result';
import { GroupMember } from './group-member';
import { GroupRole } from '../value-objects/group-role';
import crypto from 'crypto';

/**
 * Group entity — aggregate root for the Groups bounded context.
 *
 * Represents a team or department within the organization.
 * Users can be members of groups with different roles.
 */
export class Group {
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string | null,
    private readonly createdBy: UserId,
    private readonly members: GroupMember[],
    private isActive: boolean,
    private readonly createdAt: Timestamp,
    private updatedAt: Timestamp,
  ) {}

  /**
   * Factory for NEW groups.
   */
  static create(
    name: string,
    description: string | null,
    createdBy: UserId,
  ): Result<Group, Error> {
    if (!name || name.trim().length === 0) {
      return err(new Error('Group name is required'));
    }
    if (name.length > 100) {
      return err(new Error('Group name must be 100 characters or less'));
    }

    const id = crypto.randomUUID();
    const now = Timestamp.now();

    const adminMember = GroupMember.create(id, createdBy, GroupRole.ADMIN);

    return ok(
      new Group(id, name.trim(), description, createdBy, [adminMember], true, now, now),
    );
  }

  /**
   * Reconstruction from persistence.
   */
  static reconstruct(props: GroupProps): Group {
    return new Group(
      props.id,
      props.name,
      props.description,
      props.createdBy,
      props.members,
      props.isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Identity ---

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string | null {
    return this.description;
  }

  getCreatedBy(): UserId {
    return this.createdBy;
  }

  getMembers(): readonly GroupMember[] {
    return [...this.members];
  }

  isActiveGroup(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  getUpdatedAt(): Timestamp {
    return this.updatedAt;
  }

  // --- Member management ---

  /**
   * Adds a member to the group with the given role.
   * Requires the requester to be a GroupAdmin.
   */
  addMember(
    userId: UserId,
    role: GroupRole,
    requesterId: UserId,
  ): Result<GroupMember, Error> {
    if (!this.isActive) {
      return err(new Error('Cannot add members to an inactive group'));
    }

    if (!this.isAdmin(requesterId)) {
      return err(new Error('Only group admins can add members'));
    }

    const existing = this.members.find((m) => m.getUserId().equals(userId));
    if (existing) {
      return err(new Error('User is already a member of this group'));
    }

    const member = GroupMember.create(this.id, userId, role);
    this.members.push(member);
    this.updatedAt = Timestamp.now();

    return ok(member);
  }

  /**
   * Removes a member from the group.
   */
  removeMember(userId: UserId, requesterId: UserId): Result<void, Error> {
    if (!this.isActive) {
      return err(new Error('Cannot remove members from an inactive group'));
    }

    if (!this.isAdmin(requesterId)) {
      return err(new Error('Only group admins can remove members'));
    }

    if (userId.equals(requesterId)) {
      return err(new Error('Admin cannot remove themselves. Use leaveGroup instead.'));
    }

    const index = this.members.findIndex((m) => m.getUserId().equals(userId));
    if (index === -1) {
      return err(new Error('User is not a member of this group'));
    }

    this.members.splice(index, 1);
    this.updatedAt = Timestamp.now();

    return ok(undefined);
  }

  /**
   * User leaves the group on their own.
   */
  leaveGroup(userId: UserId): Result<void, Error> {
    const index = this.members.findIndex((m) => m.getUserId().equals(userId));
    if (index === -1) {
      return err(new Error('User is not a member of this group'));
    }

    this.members.splice(index, 1);
    this.updatedAt = Timestamp.now();

    return ok(undefined);
  }

  /**
   * Changes a member's role.
   */
  changeMemberRole(
    userId: UserId,
    newRole: GroupRole,
    requesterId: UserId,
  ): Result<GroupMember, Error> {
    if (!this.isAdmin(requesterId)) {
      return err(new Error('Only group admins can change roles'));
    }

    const member = this.members.find((m) => m.getUserId().equals(userId));
    if (!member) {
      return err(new Error('User is not a member of this group'));
    }

    member.changeRole(newRole);
    this.updatedAt = Timestamp.now();

    return ok(member);
  }

  /**
   * Deactivates the group (soft delete).
   */
  deactivate(requesterId: UserId): Result<void, Error> {
    if (!this.isAdmin(requesterId)) {
      return err(new Error('Only group admins can deactivate the group'));
    }

    this.isActive = false;
    this.updatedAt = Timestamp.now();

    return ok(undefined);
  }

  // --- Queries ---

  isAdmin(userId: UserId): boolean {
    return this.members.some(
      (m) => m.getUserId().equals(userId) && m.getRole().isAdmin(),
    );
  }

  isMember(userId: UserId): boolean {
    return this.members.some((m) => m.getUserId().equals(userId));
  }

  getMember(userId: UserId): GroupMember | undefined {
    return this.members.find((m) => m.getUserId().equals(userId));
  }

  getActiveMemberIds(): UserId[] {
    return this.members.map((m) => m.getUserId());
  }

  equals(other: Group): boolean {
    return this.id === other.id;
  }
}

export interface GroupProps {
  id: string;
  name: string;
  description: string | null;
  createdBy: UserId;
  members: GroupMember[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
