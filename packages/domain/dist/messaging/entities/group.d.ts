import { UserId } from '../../shared/value-objects/user-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result } from '../../shared/result';
import { GroupMember } from './group-member';
import { GroupRole } from '../value-objects/group-role';
/**
 * Group entity — aggregate root for the Groups bounded context.
 *
 * Represents a team or department within the organization.
 * Users can be members of groups with different roles.
 */
export declare class Group {
    private readonly id;
    private readonly name;
    private readonly description;
    private readonly createdBy;
    private readonly members;
    private isActive;
    private readonly createdAt;
    private updatedAt;
    private constructor();
    /**
     * Factory for NEW groups.
     */
    static create(name: string, description: string | null, createdBy: UserId): Result<Group, Error>;
    /**
     * Reconstruction from persistence.
     */
    static reconstruct(props: GroupProps): Group;
    getId(): string;
    getName(): string;
    getDescription(): string | null;
    getCreatedBy(): UserId;
    getMembers(): readonly GroupMember[];
    isActiveGroup(): boolean;
    getCreatedAt(): Timestamp;
    getUpdatedAt(): Timestamp;
    /**
     * Adds a member to the group with the given role.
     * Requires the requester to be a GroupAdmin.
     */
    addMember(userId: UserId, role: GroupRole, requesterId: UserId): Result<GroupMember, Error>;
    /**
     * Removes a member from the group.
     */
    removeMember(userId: UserId, requesterId: UserId): Result<void, Error>;
    /**
     * User leaves the group on their own.
     */
    leaveGroup(userId: UserId): Result<void, Error>;
    /**
     * Changes a member's role.
     */
    changeMemberRole(userId: UserId, newRole: GroupRole, requesterId: UserId): Result<GroupMember, Error>;
    /**
     * Deactivates the group (soft delete).
     */
    deactivate(requesterId: UserId): Result<void, Error>;
    isAdmin(userId: UserId): boolean;
    isMember(userId: UserId): boolean;
    getMember(userId: UserId): GroupMember | undefined;
    getActiveMemberIds(): UserId[];
    equals(other: Group): boolean;
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
//# sourceMappingURL=group.d.ts.map