import { Result } from '../../shared/result';
/**
 * ThreadId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a conversation thread.
 */
export declare class ThreadId {
    private readonly value;
    private constructor();
    static create(raw: string): Result<ThreadId, Error>;
    static reconstruct(raw: string): ThreadId;
    get(): string;
    equals(other: ThreadId): boolean;
    toString(): string;
}
//# sourceMappingURL=thread-id.d.ts.map