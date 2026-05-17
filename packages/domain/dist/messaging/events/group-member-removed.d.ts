import { DomainEvent } from '../../shared/events/domain-event';
export declare class GroupMemberRemoved implements DomainEvent {
    readonly groupId: string;
    readonly userId: string;
    readonly removedBy: string;
    readonly eventName = "group.member-removed";
    readonly occurredAt: Date;
    constructor(groupId: string, userId: string, removedBy: string);
}
//# sourceMappingURL=group-member-removed.d.ts.map