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

export class Ok<T, E = Error> {
  readonly _tag = 'Ok' as const;

  constructor(private readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapErr(): never {
    throw new Error('Cannot unwrapErr on Ok');
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return ok(this.value) as unknown as Result<T, F>;
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  getOrThrow(): T {
    return this.value;
  }

  match<U>(patterns: { Ok: (value: T) => U; Err: (error: E) => U }): U {
    return patterns.Ok(this.value);
  }
}

export class Err<T, E = Error> {
  readonly _tag = 'Err' as const;

  constructor(private readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  unwrap(): never {
    throw this.error instanceof Error
      ? this.error
      : new Error(String(this.error));
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  unwrapErr(): E {
    return this.error;
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return err(this.error) as unknown as Result<U, E>;
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return err(fn(this.error));
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return err(this.error) as unknown as Result<U, E>;
  }

  getOrThrow(): never {
    throw this.error instanceof Error
      ? this.error
      : new Error(String(this.error));
  }

  match<U>(patterns: { Ok: (value: T) => U; Err: (error: E) => U }): U {
    return patterns.Err(this.error);
  }
}

export function ok<T, E = Error>(value: T): Ok<T, E> {
  return new Ok(value);
}

export function err<T, E = Error>(error: E): Err<T, E> {
  return new Err(error);
}
