/**
 * Base interface for all domain events.
 *
 * Events are past-tense named records of something that happened
 * in the domain. They are immutable after creation.
 *
 * @example
 * class UserRegistered implements DomainEvent {
 *   readonly eventName = 'UserRegistered';
 *   readonly occurredAt = new Date();
 *   constructor(readonly userId: UserId, readonly email: Email) {}
 * }
 */
export interface DomainEvent {
    readonly eventName: string;
    readonly occurredAt: Date;
}
//# sourceMappingURL=domain-event.d.ts.map