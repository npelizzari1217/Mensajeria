import { UserId } from '../../shared/value-objects/user-id';
import { GroupRole } from '../value-objects/group-role';
import { Timestamp } from '../../shared/value-objects/timestamp';
/**
 * GroupMember entity.
 *
 * Represents a user's membership in a group with a specific role.
 */
export declare class GroupMember {
    private readonly id;
    private readonly groupId;
    private readonly userId;
    private role;
    private readonly joinedAt;
    private constructor();
    static create(groupId: string, userId: UserId, role: GroupRole): GroupMember;
    static reconstruct(props: GroupMemberProps): GroupMember;
    getId(): string;
    getGroupId(): string;
    getUserId(): UserId;
    getRole(): GroupRole;
    getJoinedAt(): Timestamp;
    changeRole(newRole: GroupRole): void;
    equals(other: GroupMember): boolean;
}
export interface GroupMemberProps {
    id: string;
    groupId: string;
    userId: UserId;
    role: GroupRole;
    joinedAt: Timestamp;
}
//# sourceMappingURL=group-member.d.ts.map