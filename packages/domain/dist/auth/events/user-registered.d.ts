import { DomainEvent } from '../../shared/events/domain-event';
import { UserId } from '../../shared/value-objects/user-id';
import { Email } from '../../shared/value-objects/email';
/**
 * Domain event emitted when a new user registers successfully.
 *
 * Handlers can use this to send welcome emails, create default
 * preferences, audit-log the registration, etc.
 */
export declare class UserRegistered implements DomainEvent {
    readonly userId: UserId;
    readonly email: Email;
    readonly name: string;
    readonly roleId: number;
    readonly roleName: string;
    readonly eventName = "UserRegistered";
    readonly occurredAt: Date;
    constructor(userId: UserId, email: Email, name: string, roleId: number, roleName: string);
}
//# sourceMappingURL=user-registered.d.ts.map