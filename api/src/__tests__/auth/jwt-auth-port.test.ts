import { describe, it, expect } from 'vitest';
import { JwtAuthPort } from '../../infrastructure/auth/jwt-auth-port';

const SECRET = 'test-secret-for-jwt-tests';

describe('JwtAuthPort', () => {
  const port = new JwtAuthPort(SECRET, '15m');

  // ── Sign / Verify roundtrip ─────────────────────────────────────

  it('should sign and verify a valid token', () => {
    const payload = { sub: 'user-1', role: 'user' as const };
    const token = port.sign(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = port.verify(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.role).toBe('user');
  });

  it('should roundtrip the admin role correctly', () => {
    const payload = { sub: 'admin-uuid', role: 'admin' as const };
    const token = port.sign(payload);
    const decoded = port.verify(token);

    expect(decoded.sub).toBe('admin-uuid');
    expect(decoded.role).toBe('admin');
  });

  // ── Expiration ──────────────────────────────────────────────────

  it('should reject an expired token', () => {
    const shortPort = new JwtAuthPort(SECRET, '0s');
    const payload = { sub: 'user-1', role: 'user' as const };
    const token = shortPort.sign(payload);

    expect(() => shortPort.verify(token)).toThrow('expired');
  });

  // ── Signature validation ────────────────────────────────────────

  it('should reject a token signed with a different secret', () => {
    const otherPort = new JwtAuthPort('different-secret', '15m');
    const payload = { sub: 'user-1', role: 'user' as const };
    const token = otherPort.sign(payload);

    // Verify with original port — their secrets differ
    expect(() => port.verify(token)).toThrow('invalid signature');
  });

  // ── Malformed tokens ────────────────────────────────────────────

  it('should reject a completely malformed token', () => {
    expect(() => port.verify('not-a-valid-token')).toThrow();
  });

  it('should reject an empty string token', () => {
    expect(() => port.verify('')).toThrow();
  });

  it('should reject a token with only two parts', () => {
    // JWT format: header.payload.signature (3 parts)
    expect(() => port.verify('header.payload')).toThrow();
  });
});
