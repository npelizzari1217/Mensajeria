import { DomainEvent } from '../../shared/events/domain-event';

export class GroupMemberRemoved implements DomainEvent {
  readonly eventName = 'group.member-removed';
  readonly occurredAt = new Date();

  constructor(
    public readonly groupId: string,
    public readonly userId: string,
    public readonly removedBy: string,
  ) {}
}
