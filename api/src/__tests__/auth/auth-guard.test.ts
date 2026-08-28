import { describe, it, expect, vi } from 'vitest';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { UnauthorizedException } from '@nestjs/common';

function createMockAuthPort(verifyImpl?: any) {
  return {
    verify: verifyImpl ? vi.fn().mockImplementation(verifyImpl) : vi.fn(),
    sign: vi.fn(),
  } as any;
}

function createMockReflector() {
  return {
    get: vi.fn(),
    getAll: vi.fn(),
    getAllAndMerge: vi.fn(),
    getAllAndOverride: vi.fn().mockReturnValue(false),
  } as any;
}

describe('AuthGuard', () => {
  // ── Helpers ─────────────────────────────────────────────────────

  function makeGuard(mockAuthPort: any) {
    return new AuthGuard(mockAuthPort, createMockReflector());
  }

  function createContext(authHeader?: string) {
    const request: any = { headers: {} };
    if (authHeader) {
      request.headers.authorization = authHeader;
    }
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as any;
  }

  function createContextWithRequest(request: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as any;
  }

  // ── No token ────────────────────────────────────────────────────

  it('should throw 401 when no Authorization header is present', async () => {
    const guard = makeGuard(createMockAuthPort());

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw 401 when Authorization header is empty', async () => {
    const guard = makeGuard(createMockAuthPort());

    await expect(
      guard.canActivate(createContext('Bearer ')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw 401 when Authorization header does not use Bearer scheme', async () => {
    const guard = makeGuard(createMockAuthPort());

    await expect(
      guard.canActivate(createContext('Basic some-token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Invalid token ───────────────────────────────────────────────

  it('should throw 401 when token verification fails', async () => {
    const guard = makeGuard(
      createMockAuthPort(() => {
        throw new Error('Invalid or expired token');
      }),
    );

    await expect(
      guard.canActivate(createContext('Bearer invalid-token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Valid token ─────────────────────────────────────────────────

  it('should allow access with a valid token', async () => {
    const guard = makeGuard(
      createMockAuthPort(() => ({ sub: 'user-1', role: 4, roleName: 'Usuario' })),
    );

    const result = await guard.canActivate(
      createContext('Bearer valid-token'),
    );

    expect(result).toBe(true);
  });

  it('should attach user identity to request when token is valid', async () => {
    const guard = makeGuard(
      createMockAuthPort(() => ({ sub: 'user-1', role: 4, roleName: 'Usuario' })),
    );
    const request: any = {
      headers: { authorization: 'Bearer valid-token' },
    };

    await guard.canActivate(createContextWithRequest(request));

    expect(request.user).toBeDefined();
    expect(request.user.userId).toBe('user-1');
    expect(request.user.roleId).toBe(4);
    expect(request.user.role).toBe('Usuario');
  });

  it('should pass through any role from the token payload', async () => {
    const guard = makeGuard(
      createMockAuthPort(() => ({ sub: 'admin-1', role: 1, roleName: 'Admin' })),
    );
    const request: any = {
      headers: { authorization: 'Bearer admin-token' },
    };

    await guard.canActivate(createContextWithRequest(request));

    expect(request.user.userId).toBe('admin-1');
    expect(request.user.roleId).toBe(1);
    expect(request.user.role).toBe('Admin');
  });
});
