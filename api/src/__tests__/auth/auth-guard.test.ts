import { describe, it, expect, vi } from 'vitest';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  // ── Helpers ─────────────────────────────────────────────────────

  function createContext(authHeader?: string) {
    const request: any = { headers: {} };
    if (authHeader) {
      request.headers.authorization = authHeader;
    }
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  function createContextWithRequest(request: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  // ── No token ────────────────────────────────────────────────────

  it('should throw 401 when no Authorization header is present', async () => {
    const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
    const guard = new AuthGuard(mockAuthPort as any);

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw 401 when Authorization header is empty', async () => {
    const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
    const guard = new AuthGuard(mockAuthPort as any);

    await expect(
      guard.canActivate(createContext('Bearer ')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw 401 when Authorization header does not use Bearer scheme', async () => {
    const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
    const guard = new AuthGuard(mockAuthPort as any);

    await expect(
      guard.canActivate(createContext('Basic some-token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Invalid token ───────────────────────────────────────────────

  it('should throw 401 when token verification fails', async () => {
    const mockAuthPort = {
      verify: vi.fn().mockImplementation(() => {
        throw new Error('Invalid or expired token');
      }),
      sign: vi.fn(),
    };
    const guard = new AuthGuard(mockAuthPort as any);

    await expect(
      guard.canActivate(createContext('Bearer invalid-token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Valid token ─────────────────────────────────────────────────

  it('should allow access with a valid token', async () => {
    const mockAuthPort = {
      verify: vi.fn().mockReturnValue({ sub: 'user-1', role: 'user' }),
      sign: vi.fn(),
    };
    const guard = new AuthGuard(mockAuthPort as any);

    const result = await guard.canActivate(
      createContext('Bearer valid-token'),
    );

    expect(result).toBe(true);
  });

  it('should attach user identity to request when token is valid', async () => {
    const mockAuthPort = {
      verify: vi.fn().mockReturnValue({ sub: 'user-1', role: 'user' }),
      sign: vi.fn(),
    };
    const guard = new AuthGuard(mockAuthPort as any);
    const request: any = {
      headers: { authorization: 'Bearer valid-token' },
    };

    await guard.canActivate(createContextWithRequest(request));

    expect(request.user).toBeDefined();
    expect(request.user.userId).toBe('user-1');
    expect(request.user.role).toBe('user');
  });

  it('should pass through any role from the token payload', async () => {
    const mockAuthPort = {
      verify: vi.fn().mockReturnValue({ sub: 'admin-1', role: 'admin' }),
      sign: vi.fn(),
    };
    const guard = new AuthGuard(mockAuthPort as any);
    const request: any = {
      headers: { authorization: 'Bearer admin-token' },
    };

    await guard.canActivate(createContextWithRequest(request));

    expect(request.user.userId).toBe('admin-1');
    expect(request.user.role).toBe('admin');
  });
});
