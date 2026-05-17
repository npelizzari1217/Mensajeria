"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadId = void 0;
const result_1 = require("../../shared/result");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * ThreadId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a conversation thread.
 */
class ThreadId {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('ThreadId cannot be empty'));
        }
        if (!UUID_REGEX.test(raw.trim())) {
            return (0, result_1.err)(new Error(`Invalid ThreadId format: '${raw}' is not a valid UUID`));
        }
        return (0, result_1.ok)(new ThreadId(raw.trim()));
    }
    static reconstruct(raw) {
        return new ThreadId(raw);
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
exports.ThreadId = ThreadId;
//# sourceMappingURL=thread-id.js.map