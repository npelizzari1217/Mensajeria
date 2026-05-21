import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  User,
  UserId,
  Email,
  RoleVO,
  Timestamp,
  EmpresaId,
  ok,
  err,
} from '@mensajeria/domain';
import { SelectEmpresaUseCase } from '../../application/auth/use-cases/select-empresa.use-case';
import { AuthPort } from '../../application/auth/ports/auth-port';
import { UserRepository } from '@mensajeria/domain';

function makeUser(role: string) {
  return User.reconstruct({
    id: UserId.reconstruct('550e8400-e29b-41d4-a716-446655440000'),
    email: Email.reconstruct('test@example.com'),
    name: 'Test User',
    role: RoleVO.reconstruct(role),
    hashedPassword: '$2b$12$hashedpasswordvalue',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

const EMPRESA_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('SelectEmpresaUseCase', () => {
  let useCase: SelectEmpresaUseCase;
  let mockRepo: UserRepository;
  let mockAuthPort: AuthPort;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      isMemberOf: vi.fn(),
      getEmpresas: vi.fn(),
      addToEmpresa: vi.fn(),
      findAllByEmpresaId: vi.fn(),
    };
    mockAuthPort = {
      sign: vi
        .fn()
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValue('mock-refresh-token'),
      verify: vi.fn(),
    };
    useCase = new SelectEmpresaUseCase(mockRepo, mockAuthPort, '7d');
  });

  function mockSuccessfulScenario(role: string) {
    (mockRepo.isMemberOf as any).mockResolvedValue(true);
    (mockRepo.findById as any).mockResolvedValue(ok(makeUser(role)));
    (mockRepo.getEmpresas as any).mockResolvedValue(
      ok([
        {
          empresaId: EmpresaId.reconstruct(EMPRESA_ID),
          nombre: 'Test Empresa',
          role: role.toUpperCase(), // Prisma-style uppercase that SHOULD be overwritten
          isActive: true,
        },
      ]),
    );
  }

  it('should sign JWT with PascalCase role from User entity (Admin)', async () => {
    mockSuccessfulScenario('Admin');

    const result = await useCase.execute(
      '550e8400-e29b-41d4-a716-446655440000',
      EMPRESA_ID,
    );

    expect(result.isOk()).toBe(true);

    const firstCall = (mockAuthPort.sign as any).mock.calls[0];
    expect(firstCall[0].role).toBe('Admin');
    expect(firstCall[0].sub).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(firstCall[0].empresaId).toBe(EMPRESA_ID);

    const response = result.unwrap();
    expect(response.empresa.role).toBe('Admin');
  });

  it('should sign JWT with PascalCase role from User entity (Supervisor)', async () => {
    mockSuccessfulScenario('Supervisor');

    const result = await useCase.execute(
      '550e8400-e29b-41d4-a716-446655440000',
      EMPRESA_ID,
    );

    expect(result.isOk()).toBe(true);

    const firstCall = (mockAuthPort.sign as any).mock.calls[0];
    expect(firstCall[0].role).toBe('Supervisor');

    const response = result.unwrap();
    expect(response.empresa.role).toBe('Supervisor');
  });

  it('should sign JWT with PascalCase role from User entity (Usuario)', async () => {
    mockSuccessfulScenario('Usuario');

    const result = await useCase.execute(
      '550e8400-e29b-41d4-a716-446655440000',
      EMPRESA_ID,
    );

    expect(result.isOk()).toBe(true);

    const firstCall = (mockAuthPort.sign as any).mock.calls[0];
    expect(firstCall[0].role).toBe('Usuario');

    const response = result.unwrap();
    expect(response.empresa.role).toBe('Usuario');
  });

  it('should sign JWT with PascalCase role from User entity (Tecnico)', async () => {
    mockSuccessfulScenario('Tecnico');

    const result = await useCase.execute(
      '550e8400-e29b-41d4-a716-446655440000',
      EMPRESA_ID,
    );

    expect(result.isOk()).toBe(true);

    const firstCall = (mockAuthPort.sign as any).mock.calls[0];
    expect(firstCall[0].role).toBe('Tecnico');

    const response = result.unwrap();
    expect(response.empresa.role).toBe('Tecnico');
  });

  it('should return error when user is not a member of the empresa', async () => {
    (mockRepo.isMemberOf as any).mockResolvedValue(false);

    const result = await useCase.execute(
      '550e8400-e29b-41d4-a716-446655440000',
      EMPRESA_ID,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBe('User is not a member of this empresa');
  });

  it('should return error when User entity is not found', async () => {
    (mockRepo.isMemberOf as any).mockResolvedValue(true);
    (mockRepo.findById as any).mockResolvedValue(
      err(new Error('User not found')),
    );

    const result = await useCase.execute(
      '550e8400-e29b-41d4-a716-446655440000',
      EMPRESA_ID,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBe('User not found');
  });
});
