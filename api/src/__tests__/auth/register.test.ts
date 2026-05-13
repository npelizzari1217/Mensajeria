import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  User,
  UserId,
  Email,
  RoleVO,
  Timestamp,
  Result,
  ok,
  err,
  EmailAlreadyExistsError,
  EventBus,
} from '@mensajeria/domain';
import { RegisterUserUseCase } from '../../application/auth/use-cases/register-user.use-case';
import { PasswordHasher } from '../../application/auth/ports/password-hasher';
import { UserRepository } from '@mensajeria/domain';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockRepo: UserRepository;
  let mockHasher: PasswordHasher;
  let mockEventBus: EventBus;

  const validDTO = {
    email: 'test@example.com',
    password: 'ValidPass1',
    name: 'Test User',
  };

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn().mockResolvedValue(ok(undefined)),
      existsByEmail: vi.fn().mockResolvedValue(false),
    };
    mockHasher = {
      hash: vi.fn().mockResolvedValue('$2b$12$hashedpasswordvalue'),
      compare: vi.fn(),
    };
    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };
    useCase = new RegisterUserUseCase(mockRepo, mockHasher, mockEventBus);
  });

  it('should register a user successfully', async () => {
    const result = await useCase.execute(validDTO);

    expect(result.isOk()).toBe(true);
    const profile = result.unwrap();
    expect(profile.email).toBe('test@example.com');
    expect(profile.name).toBe('Test User');
    expect(profile.role).toBe('Usuario');
    expect(profile.id).toBeDefined();
    expect(profile.createdAt).toBeDefined();
  });

  it('should hash the password before saving', async () => {
    await useCase.execute(validDTO);

    expect(mockHasher.hash).toHaveBeenCalledWith('ValidPass1');
    expect(mockRepo.save).toHaveBeenCalled();
    const savedUser = (mockRepo.save as any).mock.calls[0][0] as User;
    expect(savedUser.getHashedPassword()).toBe('$2b$12$hashedpasswordvalue');
  });

  it('should return error for duplicate email', async () => {
    (mockRepo.existsByEmail as any).mockResolvedValue(true);

    const result = await useCase.execute(validDTO);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(EmailAlreadyExistsError);
  });

  it('should return error for invalid email', async () => {
    const result = await useCase.execute({ ...validDTO, email: 'not-an-email' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('Invalid email');
  });

  it('should return error for short password', async () => {
    const result = await useCase.execute({ ...validDTO, password: 'Short1' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('at least 8');
  });

  it('should return error for empty name', async () => {
    const result = await useCase.execute({ ...validDTO, name: '' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('empty');
  });

  it('should register with custom role', async () => {
    const result = await useCase.execute({ ...validDTO, role: 'Supervisor' });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().role).toBe('Supervisor');
  });

  it('should return error for invalid role', async () => {
    const result = await useCase.execute({ ...validDTO, role: 'GodMode' });

    expect(result.isErr()).toBe(true);
  });

  it('should never return password in the profile', async () => {
    const result = await useCase.execute(validDTO);

    expect(result.isOk()).toBe(true);
    const profile = result.unwrap() as any;
    expect(profile.password).toBeUndefined();
    expect(profile.hashedPassword).toBeUndefined();
  });

  it('should publish UserRegistered event after successful registration', async () => {
    await useCase.execute(validDTO);

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (mockEventBus.publish as any).mock.calls[0][0];
    expect(publishedEvent.eventName).toBe('UserRegistered');
    expect(publishedEvent.email.get()).toBe('test@example.com');
    expect(publishedEvent.name).toBe('Test User');
  });

  it('should NOT publish event when registration fails', async () => {
    (mockRepo.existsByEmail as any).mockResolvedValue(true);

    await useCase.execute(validDTO);

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
