import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ForbiddenDomainError,
  ok,
  EventBus,
} from '@mensajeria/domain';
import { RegisterUserUseCase } from '../../application/auth/use-cases/register-user.use-case';
import { PasswordHasher } from '../../application/auth/ports/password-hasher';
import type { UserRepository } from '@mensajeria/domain';

describe('RegisterUserUseCase — CallerContext enforcement', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepo: UserRepository;
  let mockHasher: PasswordHasher;
  let mockEventBus: EventBus;

  const validBase = {
    email: 'newuser@example.com',
    password: 'ValidPass1',
    name: 'Test User',
  };

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn().mockResolvedValue(ok(undefined)),
      existsByEmail: vi.fn().mockResolvedValue(false),
      findAll: vi.fn(),
      delete: vi.fn(),
      getEmpresas: vi.fn(),
      isMemberOf: vi.fn(),
      addToEmpresa: vi.fn().mockResolvedValue(ok(undefined)),
      findAllByEmpresaId: vi.fn(),
    };
    mockHasher = {
      hash: vi.fn().mockResolvedValue('$2b$12$hashedpasswordvalue'),
      compare: vi.fn(),
    };
    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };
    useCase = new RegisterUserUseCase(mockUserRepo, mockHasher, mockEventBus);
  });

  // ── Scenario 1: ADMIN registers user for any empresa ──
  it('ADMIN can register user in any empresa', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-b',
      caller: {
        callerId: 'admin-1',
        callerRole: 'Admin',
        callerRoleId: 1,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isOk()).toBe(true);
    const profile = result.unwrap();
    expect(profile.email).toBe('newuser@example.com');
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockUserRepo.addToEmpresa).toHaveBeenCalled();
  });

  it('ADMIN can register user with Admin role (roleId: 1)', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-b',
      roleId: 1,
      caller: {
        callerId: 'admin-1',
        callerRole: 'Admin',
        callerRoleId: 1,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().role.id).toBe(1);
    expect(result.unwrap().role.name).toBe('Admin');
  });

  // ── Scenario 2: SUPERVISOR registers user for own empresa ──
  it('SUPERVISOR can register user in own empresa', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      caller: {
        callerId: 'supervisor-1',
        callerRole: 'Supervisor',
        callerRoleId: 2,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isOk()).toBe(true);
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockUserRepo.addToEmpresa).toHaveBeenCalled();
  });

  // ── Scenario 3: SUPERVISOR tries another empresa → Forbidden ──
  it('SUPERVISOR cannot register user in another empresa', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-b',
      caller: {
        callerId: 'supervisor-1',
        callerRole: 'Supervisor',
        callerRoleId: 2,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isErr()).toBe(true);
    const err = result.unwrapErr();
    expect(err).toBeInstanceOf(ForbiddenDomainError);
    expect((err as ForbiddenDomainError).code).toBe('FORBIDDEN');
    expect(err.message).toContain('own empresa');
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  // ── Scenario 4: SUPERVISOR tries to assign Admin role → Forbidden ──
  it('SUPERVISOR cannot assign Admin role (roleId: 1)', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      roleId: 1,
      caller: {
        callerId: 'supervisor-1',
        callerRole: 'Supervisor',
        callerRoleId: 2,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isErr()).toBe(true);
    const err = result.unwrapErr();
    expect(err).toBeInstanceOf(ForbiddenDomainError);
    expect((err as ForbiddenDomainError).code).toBe('FORBIDDEN');
    expect(err.message).toContain('Admin role');
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  // ── Scenario 5: TECNICO tries to register → Forbidden ──
  it('TECNICO cannot register users', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      caller: {
        callerId: 'tecnico-1',
        callerRole: 'Tecnico',
        callerRoleId: 3,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isErr()).toBe(true);
    const err = result.unwrapErr();
    expect(err).toBeInstanceOf(ForbiddenDomainError);
    expect((err as ForbiddenDomainError).code).toBe('FORBIDDEN');
    expect(err.message).toContain('Only Admin or Supervisor');
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  it('USUARIO cannot register users', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      caller: {
        callerId: 'user-1',
        callerRole: 'Usuario',
        callerRoleId: 4,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  // ── roleId-based user creation ──────────────────────────────────────

  it('User.create({ roleId: 4 }) → Usuario per default', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      // roleId defaults to 4
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().role.id).toBe(4);
    expect(result.unwrap().role.name).toBe('Usuario');
  });

  it('Admin(1) can create Admins(1) — full privilege', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      roleId: 1,
      caller: {
        callerId: 'admin-1',
        callerRole: 'Admin',
        callerRoleId: 1,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().role.id).toBe(1);
    expect(result.unwrap().role.name).toBe('Admin');
  });

  it('Supervisor(2) cannot create Admins(1)', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      roleId: 1,
      caller: {
        callerId: 'supervisor-1',
        callerRole: 'Supervisor',
        callerRoleId: 2,
        callerEmpresaId: 'empresa-a',
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
    expect(result.unwrapErr().message).toContain('Admin role');
  });

  // ── Backward compatibility: no caller context ──
  it('works without callerContext (backward compatible)', async () => {
    const result = await useCase.execute({
      ...validBase,
      empresaId: 'empresa-a',
      // no caller
    });

    expect(result.isOk()).toBe(true);
    expect(mockUserRepo.save).toHaveBeenCalled();
  });
});
