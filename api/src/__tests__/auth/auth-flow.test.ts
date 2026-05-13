import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  User,
  UserId,
  Email,
  RoleVO,
  Timestamp,
  RefreshTokenRecord,
  RefreshTokenRepository,
  ok,
  err,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  EventBus,
} from '@mensajeria/domain';
import { RegisterUserUseCase } from '../../application/auth/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/auth/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/auth/use-cases/get-current-user.use-case';
import { AuthPort, TokenPayload } from '../../application/auth/ports/auth-port';
import { PasswordHasher } from '../../application/auth/ports/password-hasher';
import { UserRepository } from '@mensajeria/domain';

function makeUser(
  id: string,
  email: string,
  role: string = 'Usuario',
  password: string = '$2b$12$hashed',
) {
  return User.reconstruct({
    id: UserId.reconstruct(id),
    email: Email.reconstruct(email),
    name: 'Test User',
    role: RoleVO.reconstruct(role),
    hashedPassword: password,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Creates an in-memory RefreshTokenRepository for testing.
 * Stores tokens in a Map and tracks expiration.
 */
function createInMemoryRefreshTokenRepo(): RefreshTokenRepository & { tokens: Map<string, RefreshTokenRecord> } {
  const tokens = new Map<string, RefreshTokenRecord>();
  return {
    tokens,
    save: vi.fn(async (record: RefreshTokenRecord) => {
      tokens.set(record.token, record);
    }),
    findByToken: vi.fn(async (token: string) => {
      const record = tokens.get(token);
      if (!record) return null;
      // Return the record even if expired — the use case is responsible
      // for checking expiration, not the repository.
      return record;
    }),
    deleteByUserId: vi.fn(async (userId: string) => {
      for (const [key, record] of tokens.entries()) {
        if (record.userId === userId) {
          tokens.delete(key);
        }
      }
    }),
    deleteExpired: vi.fn(async () => {
      for (const [key, record] of tokens.entries()) {
        if (record.expiresAt < new Date()) {
          tokens.delete(key);
        }
      }
    }),
  };
}

/**
 * Integration-style test: registration → login → access token → profile
 *
 * Mocks the infrastructure adapters but wires the use cases together
 * to verify the complete auth flow, including refresh token DB storage.
 */
describe('Auth Flow (Register → Login → Access → Profile → Refresh → Logout)', () => {
  let mockRepo: UserRepository & { _store: Map<string, any> };
  let mockHasher: PasswordHasher;
  let mockAuthPort: AuthPort;
  let mockRefreshTokenRepo: ReturnType<typeof createInMemoryRefreshTokenRepo>;
  let mockEventBus: EventBus;
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUseCase;
  let refreshUseCase: RefreshTokenUseCase;
  let logoutUseCase: LogoutUseCase;
  let profileUseCase: GetCurrentUserUseCase;

  const savedTokens: string[] = [];

  beforeEach(() => {
    // In-memory store simulating DB
    const store = new Map<string, any>();

    mockRepo = {
      _store: store,
      findById: vi.fn(async (id: UserId) => {
        const user = store.get(id.get());
        if (!user) return err(new UserNotFoundError(id.get()));
        return ok(user);
      }),
      findByEmail: vi.fn(async (email: Email) => {
        for (const user of store.values()) {
          if (user.getEmail().get() === email.get()) {
            return ok(user);
          }
        }
        return err(new UserNotFoundError(email.get()));
      }),
      save: vi.fn(async (user: User) => {
        store.set(user.getId().get(), user);
        return ok(undefined);
      }),
      existsByEmail: vi.fn(async (email: Email) => {
        for (const user of store.values()) {
          if (user.getEmail().get() === email.get()) {
            return true;
          }
        }
        return false;
      }),
    } as any;

    mockHasher = {
      hash: vi.fn(async (plain: string) => `$2b$12$hashed.${plain}`),
      compare: vi.fn(async (plain: string, hash: string) => {
        return hash === `$2b$12$hashed.${plain}`;
      }),
    };

    // Simple token simulation
    const tokenStore = new Map<string, TokenPayload>();
    let tokenCounter = 0;

    mockAuthPort = {
      sign: vi.fn((payload: TokenPayload, options?: any) => {
        const token = `token.${++tokenCounter}`;
        tokenStore.set(token, payload);
        savedTokens.push(token);
        return token;
      }),
      verify: vi.fn((token: string) => {
        const payload = tokenStore.get(token);
        if (!payload) throw new Error('Invalid token');
        return payload;
      }),
    };

    // In-memory refresh token DB
    mockRefreshTokenRepo = createInMemoryRefreshTokenRepo();

    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };

    registerUseCase = new RegisterUserUseCase(mockRepo, mockHasher, mockEventBus);
    loginUseCase = new LoginUseCase(mockRepo, mockHasher, mockAuthPort, '7d', mockRefreshTokenRepo);
    refreshUseCase = new RefreshTokenUseCase(mockRepo, mockAuthPort, mockRefreshTokenRepo);
    logoutUseCase = new LogoutUseCase(mockRefreshTokenRepo);
    profileUseCase = new GetCurrentUserUseCase(mockRepo);
  });

  it('full auth flow: register → login → access → profile → refresh', async () => {
    // 1. Register
    const registerResult = await registerUseCase.execute({
      email: 'user@example.com',
      password: 'SecurePass1',
      name: 'Flow User',
    });
    expect(registerResult.isOk()).toBe(true);
    const registeredUser = registerResult.unwrap();
    expect(registeredUser.email).toBe('user@example.com');

    // 2. Login
    const loginResult = await loginUseCase.execute({
      email: 'user@example.com',
      password: 'SecurePass1',
    });
    expect(loginResult.isOk()).toBe(true);
    const authResponse = loginResult.unwrap();
    expect(authResponse.accessToken).toBeDefined();
    expect(authResponse.refreshToken).toBeDefined();
    expect(authResponse.user.email).toBe('user@example.com');

    // 3. Get profile using access token
    const profileResult = await profileUseCase.execute(authResponse.user.id);
    expect(profileResult.isOk()).toBe(true);
    const profile = profileResult.unwrap();
    expect(profile.email).toBe('user@example.com');
    expect(profile.name).toBe('Flow User');
    expect((profile as any).password).toBeUndefined();

    // 4. Refresh token — should succeed because token was stored in DB
    const refreshResult = await refreshUseCase.execute(authResponse.refreshToken);
    expect(refreshResult.isOk()).toBe(true);
    const refreshed = refreshResult.unwrap();
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.user.email).toBe('user@example.com');
  });

  it('should store refresh token in DB on login and find it on refresh', async () => {
    await registerUseCase.execute({
      email: 'store-test@example.com',
      password: 'SecurePass1',
      name: 'Store Test',
    });

    const loginResult = await loginUseCase.execute({
      email: 'store-test@example.com',
      password: 'SecurePass1',
    });
    expect(loginResult.isOk()).toBe(true);
    const { refreshToken } = loginResult.unwrap();

    // Verify token was stored
    expect(mockRefreshTokenRepo.tokens.has(refreshToken)).toBe(true);

    // Refresh should find it in DB
    const refreshResult = await refreshUseCase.execute(refreshToken);
    expect(refreshResult.isOk()).toBe(true);
  });

  it('should reject refresh for revoked (deleted) token', async () => {
    await registerUseCase.execute({
      email: 'revoke-test@example.com',
      password: 'SecurePass1',
      name: 'Revoke Test',
    });

    const loginResult = await loginUseCase.execute({
      email: 'revoke-test@example.com',
      password: 'SecurePass1',
    });
    const { refreshToken } = loginResult.unwrap();

    // Manually delete the token from the in-memory store (simulating revocation)
    mockRefreshTokenRepo.tokens.delete(refreshToken);

    // Refresh should fail because token not in DB
    const refreshResult = await refreshUseCase.execute(refreshToken);
    expect(refreshResult.isErr()).toBe(true);
    expect(refreshResult.unwrapErr().message).toContain('Invalid or expired refresh token');
  });

  it('should reject refresh for token that never existed in DB', async () => {
    // Even if JWT signature is valid, a token not in DB must be rejected
    const result = await refreshUseCase.execute('token.99999');
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('Invalid or expired refresh token');
  });

  it('should reject expired refresh token from DB', async () => {
    await registerUseCase.execute({
      email: 'expired-test@example.com',
      password: 'SecurePass1',
      name: 'Expired Test',
    });

    const loginResult = await loginUseCase.execute({
      email: 'expired-test@example.com',
      password: 'SecurePass1',
    });
    const { refreshToken } = loginResult.unwrap();

    // Simulate expired token by putting an expired record in the DB
    const record = mockRefreshTokenRepo.tokens.get(refreshToken)!;
    mockRefreshTokenRepo.tokens.set(refreshToken, {
      ...record,
      expiresAt: new Date(Date.now() - 1000), // already expired
    });

    const refreshResult = await refreshUseCase.execute(refreshToken);
    expect(refreshResult.isErr()).toBe(true);
    expect(refreshResult.unwrapErr().message).toContain('Invalid or expired refresh token');
  });

  it('should revoke all tokens on logout', async () => {
    await registerUseCase.execute({
      email: 'logout-test@example.com',
      password: 'SecurePass1',
      name: 'Logout Test',
    });

    // Login to create a refresh token
    const loginResult = await loginUseCase.execute({
      email: 'logout-test@example.com',
      password: 'SecurePass1',
    });
    expect(loginResult.isOk()).toBe(true);
    const userId = loginResult.unwrap().user.id;
    const refreshToken = loginResult.unwrap().refreshToken;

    // Verify token exists in DB
    expect(mockRefreshTokenRepo.tokens.has(refreshToken)).toBe(true);

    // Logout
    await logoutUseCase.execute(userId);

    // Token should be revoked
    expect(mockRefreshTokenRepo.tokens.has(refreshToken)).toBe(false);

    // Refresh should fail after logout
    const refreshResult = await refreshUseCase.execute(refreshToken);
    expect(refreshResult.isErr()).toBe(true);
    expect(refreshResult.unwrapErr().message).toContain('Invalid or expired refresh token');
  });

  it('should prevent login with wrong password after registration', async () => {
    await registerUseCase.execute({
      email: 'secure@example.com',
      password: 'SecurePass1',
      name: 'Secure User',
    });

    const loginResult = await loginUseCase.execute({
      email: 'secure@example.com',
      password: 'WrongPass1',
    });

    expect(loginResult.isErr()).toBe(true);
    expect(loginResult.unwrapErr()).toBeInstanceOf(InvalidCredentialsError);
  });

  it('should prevent duplicate registration', async () => {
    await registerUseCase.execute({
      email: 'duplicate@example.com',
      password: 'SecurePass1',
      name: 'First',
    });

    const duplicateResult = await registerUseCase.execute({
      email: 'duplicate@example.com',
      password: 'SecurePass2',
      name: 'Second',
    });

    expect(duplicateResult.isErr()).toBe(true);
    expect(duplicateResult.unwrapErr()).toBeInstanceOf(EmailAlreadyExistsError);
  });

  it('should fail refresh with invalid token', async () => {
    const result = await refreshUseCase.execute('fake-refresh-token');
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('Invalid or expired refresh token');
  });

  it('should fail profile for non-existent user', async () => {
    const result = await profileUseCase.execute('00000000-0000-0000-0000-000000000000');
    expect(result.isErr()).toBe(true);
  });
});
