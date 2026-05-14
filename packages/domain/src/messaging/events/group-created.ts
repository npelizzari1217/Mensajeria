import { DomainEvent } from '../../shared/events/domain-event';

export class GroupCreated implements DomainEvent {
  readonly eventName = 'group.created';
  readonly occurredAt = new Date();

  constructor(
    public readonly groupId: string,
    public readonly name: string,
    public readonly createdBy: string,
  ) {}
}
