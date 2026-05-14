import { UserId } from '../../shared/value-objects/user-id';
import { GroupRole } from '../value-objects/group-role';
import { Timestamp } from '../../shared/value-objects/timestamp';
import crypto from 'crypto';

/**
 * GroupMember entity.
 *
 * Represents a user's membership in a group with a specific role.
 */
export class GroupMember {
  private constructor(
    private readonly id: string,
    private readonly groupId: string,
    private readonly userId: UserId,
    private role: GroupRole,
    private readonly joinedAt: Timestamp,
  ) {}

  static create(
    groupId: string,
    userId: UserId,
    role: GroupRole,
  ): GroupMember {
    return new GroupMember(
      crypto.randomUUID(),
      groupId,
      userId,
      role,
      Timestamp.now(),
    );
  }

  static reconstruct(props: GroupMemberProps): GroupMember {
    return new GroupMember(
      props.id,
      props.groupId,
      props.userId,
      props.role,
      props.joinedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getGroupId(): string {
    return this.groupId;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getRole(): GroupRole {
    return this.role;
  }

  getJoinedAt(): Timestamp {
    return this.joinedAt;
  }

  changeRole(newRole: GroupRole): void {
    this.role = newRole;
  }

  equals(other: GroupMember): boolean {
    return this.id === other.id;
  }
}

export interface GroupMemberProps {
  id: string;
  groupId: string;
  userId: UserId;
  role: GroupRole;
  joinedAt: Timestamp;
}
