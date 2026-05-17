import { Result } from '../result';
/**
 * MessageBody Value Object.
 *
 * Validates message body length constraints (max 10,000 chars).
 * Does NOT enforce a minimum — an empty body is allowed (e.g.
 * for messages where the subject is sufficient context).
 */
export declare class MessageBody {
    private readonly value;
    private constructor();
    static create(raw: string): Result<MessageBody, Error>;
    static reconstruct(raw: string): MessageBody;
    get(): string;
    equals(other: MessageBody): boolean;
    toString(): string;
}
//# sourceMappingURL=message-body.d.ts.map