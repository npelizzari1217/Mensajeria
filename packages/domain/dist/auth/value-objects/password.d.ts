import { Result } from '../../shared/result';
/**
 * Password Value Object.
 *
 * Validates password strength rules:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter (implied by mixed case requirement)
 * - At least 1 digit
 *
 * Stores the HASHED password, never the plaintext.
 * The `create()` factory receives a plaintext candidate and validates
 * strength rules. The `hash()` method produces the bcrypt-style hash.
 *
 * NOTE: In this domain layer we validate the plaintext policy.
 * Hashing is delegated to the infrastructure layer (BcryptPasswordHasher).
 * The entity stores `hashedPassword: string`, not `Password` VO,
 * because hashing is infrastructure concern. The Password VO validates
 * plaintext policy at the domain boundary.
 */
export declare class Password {
    private readonly value;
    private constructor();
    /**
     * Creates a Password VO by validating a plaintext candidate
     * against strength rules.
     *
     * This does NOT hash — it only validates policy.
     * Use `get()` to retrieve the plaintext for hashing in infrastructure.
     */
    static create(plaintext: string): Result<Password, Error>;
    /**
     * Creates a Password VO from an already-hashed value.
     * Used when reconstructing from persistence — skips strength validation.
     */
    static fromHash(hash: string): Password;
    get(): string;
    equals(other: Password): boolean;
    toString(): string;
}
//# sourceMappingURL=password.d.ts.map