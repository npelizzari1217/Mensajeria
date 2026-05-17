import { Result } from '../result';
/**
 * UserId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a user.
 * Validation ensures the value is a well-formed UUID v4.
 */
export declare class UserId {
    private readonly value;
    private constructor();
    static create(raw: string): Result<UserId, Error>;
    /**
     * Trusted reconstruction for persistence — skips validation.
     * Use ONLY when restoring from a trusted source (DB, event store).
     */
    static reconstruct(raw: string): UserId;
    get(): string;
    equals(other: UserId): boolean;
    toString(): string;
}
//# sourceMappingURL=user-id.d.ts.map