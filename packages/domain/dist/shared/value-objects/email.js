"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const result_1 = require("../result");
/**
 * Minimal RFC 5322 email regex — covers ~99% of real-world addresses.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * Email Value Object.
 *
 * Validates format and stores normalized (lowercased) value.
 * Comparison is case-insensitive by design.
 */
class Email {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('Email cannot be empty'));
        }
        const normalized = raw.trim().toLowerCase();
        if (!EMAIL_REGEX.test(normalized)) {
            return (0, result_1.err)(new Error(`Invalid email format: '${raw}'`));
        }
        if (normalized.length > 254) {
            return (0, result_1.err)(new Error('Email must not exceed 254 characters'));
        }
        return (0, result_1.ok)(new Email(normalized));
    }
    static reconstruct(raw) {
        return new Email(raw.toLowerCase());
    }
    get() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.Email = Email;
//# sourceMappingURL=email.js.map