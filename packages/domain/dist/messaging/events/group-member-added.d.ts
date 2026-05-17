import { DomainEvent } from '../../shared/events/domain-event';
export declare class GroupMemberAdded implements DomainEvent {
    readonly groupId: string;
    readonly userId: string;
    readonly addedBy: string;
    readonly eventName = "group.member-added";
    readonly occurredAt: Date;
    constructor(groupId: string, userId: string, addedBy: string);
}
//# sourceMappingURL=group-member-added.d.ts.map