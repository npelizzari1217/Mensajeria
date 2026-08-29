import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  User,
  UserId,
  Email,
  Timestamp,
  RefreshTokenRepository,
  ok,
  err,
  InvalidCredentialsError,
} from '@mensajeria/domain';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { AuthPort, TokenPayload } from '../../application/auth/ports/auth-port';
import { PasswordHasher } from '../../application/auth/ports/password-hasher';
import { UserRepository } from '@mensajeria/domain';

function makeUser(email: string) {
  return User.reconstruct({
    id: UserId.reconstruct('550e8400-e29b-41d4-a716-446655440000'),
    email: Email.reconstruct(email),
    name: 'Test User',
    roleId: 4,
    hashedPassword: '$2b$12$hashedpasswordvalue',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

function makeMockRefreshTokenRepo(): RefreshTokenRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByToken: vi.fn(),
    deleteByUserId: vi.fn(),
    deleteExpired: vi.fn(),
  };
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockRepo: UserRepository;
  let mockHasher: PasswordHasher;
  let mockAuthPort: AuthPort;
  let mockRefreshTokenRepo: RefreshTokenRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
      getEmpresas: vi.fn().mockResolvedValue(ok([])),
    };
    mockHasher = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true),
    };
    mockAuthPort = {
      sign: vi
        .fn()
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValue('mock-refresh-token'),
      verify: vi.fn(),
    };
    mockRefreshTokenRepo = makeMockRefreshTokenRepo();
    useCase = new LoginUseCase(mockRepo, mockHasher, mockAuthPort, '7d', mockRefreshTokenRepo);
  });

  it('should login successfully with valid credentials', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue(ok(makeUser('test@example.com')));

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'ValidPass1',
    });

    expect(result.isOk()).toBe(true);
    const response = result.unwrap();
    expect(response.accessToken).toBeDefined();
    expect(response.refreshToken).toBeDefined();
    expect(response.user.email).toBe('test@example.com');
    expect(response.user.password).toBeUndefined();
  });

  it('should store refresh token in database on successful login', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue(ok(makeUser('test@example.com')));

    await useCase.execute({
      email: 'test@example.com',
      password: 'ValidPass1',
    });

    expect(mockRefreshTokenRepo.save).toHaveBeenCalledTimes(1);
    const savedRecord = (mockRefreshTokenRepo.save as any).mock.calls[0][0];
    expect(savedRecord.token).toBe('mock-refresh-token');
    expect(savedRecord.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(savedRecord.expiresAt).toBeInstanceOf(Date);
  });

  it('should return InvalidCredentialsError for wrong password', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue(ok(makeUser('test@example.com')));
    (mockHasher.compare as any).mockResolvedValue(false);

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'WrongPass1',
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(InvalidCredentialsError);
  });

  it('should return InvalidCredentialsError for non-existent email', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue(
      err(new InvalidCredentialsError()),
    );

    const result = await useCase.execute({
      email: 'nonexistent@example.com',
      password: 'ValidPass1',
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(InvalidCredentialsError);
    // Same message as wrong password — prevents enumeration
    expect(result.unwrapErr().message).toBe('Invalid email or password');
  });

  it('should return InvalidCredentialsError for invalid email format', async () => {
    const result = await useCase.execute({
      email: 'not-an-email',
      password: 'ValidPass1',
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(InvalidCredentialsError);
  });

  it('should not store refresh token on failed login', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue(
      err(new InvalidCredentialsError()),
    );

    const result = await useCase.execute({
      email: 'nonexistent@example.com',
      password: 'WrongPass1',
    });

    expect(result.isErr()).toBe(true);
    expect(mockRefreshTokenRepo.save).not.toHaveBeenCalled();
  });

  it('should sign tokens with correct payload', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue(ok(makeUser('test@example.com')));

    await useCase.execute({
      email: 'test@example.com',
      password: 'ValidPass1',
    });

    expect(mockAuthPort.sign).toHaveBeenCalledTimes(2);
    // First call — access token
    const firstCall = (mockAuthPort.sign as any).mock.calls[0];
    expect(firstCall[0].sub).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(firstCall[0].role).toBe(4);
    expect(firstCall[0].roleName).toBe('Usuario');
    // Second call — refresh token with custom expiresIn
    const secondCall = (mockAuthPort.sign as any).mock.calls[1];
    expect(secondCall[1]?.expiresIn).toBe('7d');
  });
});
