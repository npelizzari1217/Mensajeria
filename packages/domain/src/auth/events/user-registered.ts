import { DomainEvent } from '../../shared/events/domain-event';
import { UserId } from '../../shared/value-objects/user-id';
import { Email } from '../../shared/value-objects/email';
import { RoleVO } from '../../shared/value-objects/role';

/**
 * Domain event emitted when a new user registers successfully.
 *
 * Handlers can use this to send welcome emails, create default
 * preferences, audit-log the registration, etc.
 */
export class UserRegistered implements DomainEvent {
  readonly eventName = 'UserRegistered';
  readonly occurredAt: Date = new Date();

  constructor(
    readonly userId: UserId,
    readonly email: Email,
    readonly name: string,
    readonly role: RoleVO,
  ) {}
}
