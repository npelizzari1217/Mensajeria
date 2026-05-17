"use strict";
/**
 * Result type — functional error handling without try/catch.
 *
 * Inspired by Rust's Result<T, E>. Enables composable, type-safe
 * error propagation through the domain layer without side effects.
 *
 * @example
 * const result = Email.create('user@example.com')
 * if (result.isOk()) {
 *   const email = result.unwrap()
 *   // use email...
 * } else {
 *   const error = result.unwrapErr()
 *   // handle error...
 * }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Err = exports.Ok = void 0;
exports.ok = ok;
exports.err = err;
class Ok {
    value;
    _tag = 'Ok';
    constructor(value) {
        this.value = value;
    }
    isOk() {
        return true;
    }
    isErr() {
        return false;
    }
    unwrap() {
        return this.value;
    }
    unwrapOr(_defaultValue) {
        return this.value;
    }
    unwrapErr() {
        throw new Error('Cannot unwrapErr on Ok');
    }
    map(fn) {
        return ok(fn(this.value));
    }
    mapErr(_fn) {
        return ok(this.value);
    }
    flatMap(fn) {
        return fn(this.value);
    }
    getOrThrow() {
        return this.value;
    }
    match(patterns) {
        return patterns.Ok(this.value);
    }
}
exports.Ok = Ok;
class Err {
    error;
    _tag = 'Err';
    constructor(error) {
        this.error = error;
    }
    isOk() {
        return false;
    }
    isErr() {
        return true;
    }
    unwrap() {
        throw this.error instanceof Error
            ? this.error
            : new Error(String(this.error));
    }
    unwrapOr(defaultValue) {
        return defaultValue;
    }
    unwrapErr() {
        return this.error;
    }
    map(_fn) {
        return err(this.error);
    }
    mapErr(fn) {
        return err(fn(this.error));
    }
    flatMap(_fn) {
        return err(this.error);
    }
    getOrThrow() {
        throw this.error instanceof Error
            ? this.error
            : new Error(String(this.error));
    }
    match(patterns) {
        return patterns.Err(this.error);
    }
}
exports.Err = Err;
function ok(value) {
    return new Ok(value);
}
function err(error) {
    return new Err(error);
}
//# sourceMappingURL=result.js.map