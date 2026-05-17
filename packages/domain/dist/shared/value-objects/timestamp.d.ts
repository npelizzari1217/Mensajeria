import { Result } from '../result';
/**
 * Timestamp Value Object.
 *
 * Wraps a Date ensuring UTC representation.
 * All domain timestamps MUST be UTC — no timezone ambiguity.
 */
export declare class Timestamp {
    private readonly value;
    private constructor();
    static create(raw: Date | string | number): Result<Timestamp, Error>;
    /**
     * Creates a Timestamp set to "now" in UTC.
     */
    static now(): Timestamp;
    static reconstruct(raw: Date | string): Timestamp;
    get(): Date;
    equals(other: Timestamp): boolean;
    toString(): string;
    isAfter(other: Timestamp): boolean;
    isBefore(other: Timestamp): boolean;
}
//# sourceMappingURL=timestamp.d.ts.map