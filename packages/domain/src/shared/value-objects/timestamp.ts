import { Result, ok, err } from '../result';

/**
 * Timestamp Value Object.
 *
 * Wraps a Date ensuring UTC representation.
 * All domain timestamps MUST be UTC — no timezone ambiguity.
 */
export class Timestamp {
  private constructor(private readonly value: Date) {
    Object.freeze(this);
  }

  static create(raw: Date | string | number): Result<Timestamp, Error> {
    const date = raw instanceof Date ? raw : new Date(raw);
    if (!isValidDate(date)) {
      return err(new Error(`Invalid timestamp: '${raw}'`));
    }
    return ok(new Timestamp(toUTC(date)));
  }

  /**
   * Creates a Timestamp set to "now" in UTC.
   */
  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static reconstruct(raw: Date | string): Timestamp {
    const date = typeof raw === 'string' ? new Date(raw) : raw;
    return new Timestamp(toUTC(date));
  }

  get(): Date {
    return new Date(this.value.toISOString());
  }

  equals(other: Timestamp): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  toString(): string {
    return this.value.toISOString();
  }

  isAfter(other: Timestamp): boolean {
    return this.value.getTime() > other.value.getTime();
  }

  isBefore(other: Timestamp): boolean {
    return this.value.getTime() < other.value.getTime();
  }
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

function toUTC(d: Date): Date {
  return new Date(d.toISOString());
}
