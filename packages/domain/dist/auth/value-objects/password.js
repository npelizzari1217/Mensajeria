"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Password = void 0;
const result_1 = require("../../shared/result");
const MIN_LENGTH = 8;
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
class Password {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    /**
     * Creates a Password VO by validating a plaintext candidate
     * against strength rules.
     *
     * This does NOT hash — it only validates policy.
     * Use `get()` to retrieve the plaintext for hashing in infrastructure.
     */
    static create(plaintext) {
        if (!plaintext || plaintext.length === 0) {
            return (0, result_1.err)(new Error('Password cannot be empty'));
        }
        if (plaintext.length < MIN_LENGTH) {
            return (0, result_1.err)(new Error(`Password must be at least ${MIN_LENGTH} characters`));
        }
        if (!/[A-Z]/.test(plaintext)) {
            return (0, result_1.err)(new Error('Password must contain at least one uppercase letter'));
        }
        if (!/[a-z]/.test(plaintext)) {
            return (0, result_1.err)(new Error('Password must contain at least one lowercase letter'));
        }
        if (!/[0-9]/.test(plaintext)) {
            return (0, result_1.err)(new Error('Password must contain at least one digit'));
        }
        return (0, result_1.ok)(new Password(plaintext));
    }
    /**
     * Creates a Password VO from an already-hashed value.
     * Used when reconstructing from persistence — skips strength validation.
     */
    static fromHash(hash) {
        return new Password(hash);
    }
    get() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return '********';
    }
}
exports.Password = Password;
//# sourceMappingURL=password.js.map