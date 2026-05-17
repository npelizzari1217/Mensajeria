import { Result } from '../result';
/**
 * MessageStatus enum — delivery lifecycle of a message to a recipient.
 *
 * PENDING  → initial state when message is sent
 * DELIVERED → recipient has received it (server-delivered)
 * READ     → recipient has opened/read it
 */
export declare enum MessageStatus {
    Pending = "Pending",
    Sent = "Sent",
    Delivered = "Delivered",
    Read = "Read"
}
/**
 * MessageStatus Value Object.
 *
 * Wraps a MessageStatus enum with safe construction.
 * Ensures only valid delivery states are represented.
 */
export declare class MessageStatusVO {
    private readonly value;
    private constructor();
    static create(raw: string): Result<MessageStatusVO, Error>;
    static reconstruct(raw: string): MessageStatusVO;
    get(): MessageStatus;
    equals(other: MessageStatusVO): boolean;
    toString(): string;
    static pending(): MessageStatusVO;
}
//# sourceMappingURL=message-status.d.ts.map