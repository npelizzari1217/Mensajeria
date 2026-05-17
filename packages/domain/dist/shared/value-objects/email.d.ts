import { Result } from '../result';
/**
 * Email Value Object.
 *
 * Validates format and stores normalized (lowercased) value.
 * Comparison is case-insensitive by design.
 */
export declare class Email {
    private readonly value;
    private constructor();
    static create(raw: string): Result<Email, Error>;
    static reconstruct(raw: string): Email;
    get(): string;
    equals(other: Email): boolean;
    toString(): string;
}
//# sourceMappingURL=email.d.ts.map