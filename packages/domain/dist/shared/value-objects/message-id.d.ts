import { Result } from '../result';
/**
 * MessageId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a message.
 */
export declare class MessageId {
    private readonly value;
    private constructor();
    static create(raw: string): Result<MessageId, Error>;
    static reconstruct(raw: string): MessageId;
    get(): string;
    equals(other: MessageId): boolean;
    toString(): string;
}
//# sourceMappingURL=message-id.d.ts.map