import { Result } from '../result';
/**
 * Subject Value Object.
 *
 * Validates message subject length constraints (1–200 chars).
 * Trims whitespace and normalizes internal spacing.
 */
export declare class Subject {
    private readonly value;
    private constructor();
    static create(raw: string): Result<Subject, Error>;
    static reconstruct(raw: string): Subject;
    get(): string;
    equals(other: Subject): boolean;
    toString(): string;
}
//# sourceMappingURL=subject.d.ts.map