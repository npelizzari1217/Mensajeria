"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timestamp = void 0;
const result_1 = require("../result");
/**
 * Timestamp Value Object.
 *
 * Wraps a Date ensuring UTC representation.
 * All domain timestamps MUST be UTC — no timezone ambiguity.
 */
class Timestamp {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        const date = raw instanceof Date ? raw : new Date(raw);
        if (!isValidDate(date)) {
            return (0, result_1.err)(new Error(`Invalid timestamp: '${raw}'`));
        }
        return (0, result_1.ok)(new Timestamp(toUTC(date)));
    }
    /**
     * Creates a Timestamp set to "now" in UTC.
     */
    static now() {
        return new Timestamp(new Date());
    }
    static reconstruct(raw) {
        const date = typeof raw === 'string' ? new Date(raw) : raw;
        return new Timestamp(toUTC(date));
    }
    get() {
        return new Date(this.value.toISOString());
    }
    equals(other) {
        return this.value.getTime() === other.value.getTime();
    }
    toString() {
        return this.value.toISOString();
    }
    isAfter(other) {
        return this.value.getTime() > other.value.getTime();
    }
    isBefore(other) {
        return this.value.getTime() < other.value.getTime();
    }
}
exports.Timestamp = Timestamp;
function isValidDate(d) {
    return d instanceof Date && !isNaN(d.getTime());
}
function toUTC(d) {
    return new Date(d.toISOString());
}
//# sourceMappingURL=timestamp.js.map