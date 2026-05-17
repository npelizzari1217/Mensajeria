"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const result_1 = require("../result");
const MIN_LENGTH = 1;
const MAX_LENGTH = 200;
/**
 * Subject Value Object.
 *
 * Validates message subject length constraints (1–200 chars).
 * Trims whitespace and normalizes internal spacing.
 */
class Subject {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('Subject cannot be empty'));
        }
        const normalized = raw.trim().replace(/\s+/g, ' ');
        if (normalized.length < MIN_LENGTH) {
            return (0, result_1.err)(new Error(`Subject must be at least ${MIN_LENGTH} character(s)`));
        }
        if (normalized.length > MAX_LENGTH) {
            return (0, result_1.err)(new Error(`Subject must not exceed ${MAX_LENGTH} characters (got ${normalized.length})`));
        }
        return (0, result_1.ok)(new Subject(normalized));
    }
    static reconstruct(raw) {
        return new Subject(raw);
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
exports.Subject = Subject;
//# sourceMappingURL=subject.js.map