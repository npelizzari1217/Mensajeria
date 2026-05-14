import { DomainEvent } from '../../shared/events/domain-event';

export class GroupMemberAdded implements DomainEvent {
  readonly eventName = 'group.member-added';
  readonly occurredAt = new Date();

  constructor(
    public readonly groupId: string,
    public readonly userId: string,
    public readonly addedBy: string,
  ) {}
}
