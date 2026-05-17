"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserId = void 0;
const result_1 = require("../result");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * UserId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a user.
 * Validation ensures the value is a well-formed UUID v4.
 */
class UserId {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('UserId cannot be empty'));
        }
        if (!UUID_REGEX.test(raw.trim())) {
            return (0, result_1.err)(new Error(`Invalid UserId format: '${raw}' is not a valid UUID`));
        }
        return (0, result_1.ok)(new UserId(raw.trim()));
    }
    /**
     * Trusted reconstruction for persistence — skips validation.
     * Use ONLY when restoring from a trusted source (DB, event store).
     */
    static reconstruct(raw) {
        return new UserId(raw);
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
exports.UserId = UserId;
//# sourceMappingURL=user-id.js.map