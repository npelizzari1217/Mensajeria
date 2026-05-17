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
export type Result<T, E = Error> = Ok<T, E> | Err<T, E>;
export declare class Ok<T, E = Error> {
    private readonly value;
    readonly _tag: "Ok";
    constructor(value: T);
    isOk(): this is Ok<T, E>;
    isErr(): this is Err<T, E>;
    unwrap(): T;
    unwrapOr(_defaultValue: T): T;
    unwrapErr(): never;
    map<U>(fn: (value: T) => U): Result<U, E>;
    mapErr<F>(_fn: (error: E) => F): Result<T, F>;
    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
    getOrThrow(): T;
    match<U>(patterns: {
        Ok: (value: T) => U;
        Err: (error: E) => U;
    }): U;
}
export declare class Err<T, E = Error> {
    private readonly error;
    readonly _tag: "Err";
    constructor(error: E);
    isOk(): this is Ok<T, E>;
    isErr(): this is Err<T, E>;
    unwrap(): never;
    unwrapOr(defaultValue: T): T;
    unwrapErr(): E;
    map<U>(_fn: (value: T) => U): Result<U, E>;
    mapErr<F>(fn: (error: E) => F): Result<T, F>;
    flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E>;
    getOrThrow(): never;
    match<U>(patterns: {
        Ok: (value: T) => U;
        Err: (error: E) => U;
    }): U;
}
export declare function ok<T, E = Error>(value: T): Ok<T, E>;
export declare function err<T, E = Error>(error: E): Err<T, E>;
//# sourceMappingURL=result.d.ts.map