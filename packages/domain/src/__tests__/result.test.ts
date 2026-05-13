import { describe, it, expect } from 'vitest';
import { ok, err, Ok, Err } from '../shared/result';

describe('Result', () => {
  describe('ok()', () => {
    it('creates an Ok result', () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });

    it('unwraps the value', () => {
      const result = ok('hello');
      expect(result.unwrap()).toBe('hello');
    });

    it('returns the value with unwrapOr', () => {
      const result = ok(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it('throws on unwrapErr', () => {
      const result = ok(42);
      expect(() => result.unwrapErr()).toThrow();
    });

    it('maps the value', () => {
      const result = ok(42);
      const mapped = result.map((n) => n * 2);
      expect(mapped.unwrap()).toBe(84);
    });

    it('flatMaps the value', () => {
      const result = ok(42);
      const flatMapped = result.flatMap((n) => ok(n * 2));
      expect(flatMapped.unwrap()).toBe(84);
    });

    it('does not mapErr', () => {
      const result = ok(42);
      const mapped = result.mapErr((e) => new Error(`wrapped: ${e.message}`));
      expect(mapped.isOk()).toBe(true);
      expect(mapped.unwrap()).toBe(42);
    });

    it('matches Ok pattern', () => {
      const result = ok(42);
      const val = result.match({
        Ok: (v) => `got ${v}`,
        Err: (_e) => 'error',
      });
      expect(val).toBe('got 42');
    });
  });

  describe('err()', () => {
    it('creates an Err result', () => {
      const result = err(new Error('fail'));
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
    });

    it('throws on unwrap', () => {
      const result = err(new Error('fail'));
      expect(() => result.unwrap()).toThrow('fail');
    });

    it('returns default with unwrapOr', () => {
      const result = err(new Error('fail'));
      expect(result.unwrapOr(0)).toBe(0);
    });

    it('unwraps the error', () => {
      const result = err(new Error('fail'));
      expect(result.unwrapErr().message).toBe('fail');
    });

    it('does not map the value', () => {
      const result = err(new Error('fail'));
      const mapped = result.map((n) => n * 2);
      expect(mapped.isErr()).toBe(true);
    });

    it('maps the error', () => {
      const result = err(new Error('original'));
      const mapped = result.mapErr((e) => new Error(`mapped: ${e.message}`));
      expect(mapped.unwrapErr().message).toBe('mapped: original');
    });

    it('flatMap skips on error', () => {
      const result = err(new Error('fail'));
      const flatMapped = result.flatMap((n) => ok((n as number) * 2));
      expect(flatMapped.isErr()).toBe(true);
    });

    it('throws on getOrThrow', () => {
      const result = err(new Error('fail'));
      expect(() => result.getOrThrow()).toThrow('fail');
    });

    it('matches Err pattern', () => {
      const result = err(new Error('fail'));
      const val = result.match({
        Ok: (v) => `got ${v}`,
        Err: (e) => `error: ${e.message}`,
      });
      expect(val).toBe('error: fail');
    });
  });

  describe('type narrowing', () => {
    it('narrows type with isOk', () => {
      const result = Math.random() > 0.5 ? ok(42) : err(new Error('fail'));
      if (result.isOk()) {
        expect(result.unwrap()).toBe(42);
      } else {
        expect(result.unwrapErr().message).toBe('fail');
      }
    });
  });
});
