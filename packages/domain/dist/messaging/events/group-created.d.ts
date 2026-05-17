import { DomainEvent } from '../../shared/events/domain-event';
export declare class GroupCreated implements DomainEvent {
    readonly groupId: string;
    readonly name: string;
    readonly createdBy: string;
    readonly eventName = "group.created";
    readonly occurredAt: Date;
    constructor(groupId: string, name: string, createdBy: string);
}
//# sourceMappingURL=group-created.d.ts.map