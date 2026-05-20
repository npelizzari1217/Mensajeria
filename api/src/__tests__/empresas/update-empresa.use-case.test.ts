import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Empresa,
  EmpresaId,
  EmpresaNotFoundError,
  EmpresaNameAlreadyExistsError,
  Timestamp,
  ok,
  err,
} from '@mensajeria/domain';
import { UpdateEmpresaUseCase } from '../../application/empresas/use-cases/update-empresa.use-case';
import type { EmpresaRepository } from '@mensajeria/domain';

const EXISTING_ID = '550e8400-e29b-41d4-a716-446655440001';

function makeExistingEmpresa(nombre = 'Original'): Empresa {
  return Empresa.reconstruct({
    id: EmpresaId.reconstruct(EXISTING_ID),
    nombre,
    createdAt: Timestamp.reconstruct('2025-01-01T00:00:00.000Z'),
    updatedAt: Timestamp.reconstruct('2025-01-01T00:00:00.000Z'),
  });
}

describe('UpdateEmpresaUseCase', () => {
  let useCase: UpdateEmpresaUseCase;
  let mockRepo: EmpresaRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(ok(undefined)),
      delete: vi.fn(),
      existsByNombre: vi.fn().mockResolvedValue(false),
    };
    useCase = new UpdateEmpresaUseCase(mockRepo);
  });

  it('updates empresa nombre and returns updated DTO', async () => {
    const empresa = makeExistingEmpresa();
    (mockRepo.findById as any).mockResolvedValue(ok(empresa));

    const result = await useCase.execute(EXISTING_ID, { nombre: 'Nuevo Nombre' });

    expect(result.isOk()).toBe(true);
    const dto = result.unwrap();
    expect(dto.id).toBe(EXISTING_ID);
    expect(dto.nombre).toBe('Nuevo Nombre');
    expect(dto.createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('returns EmpresaNotFoundError for non-existent id', async () => {
    (mockRepo.findById as any).mockResolvedValue(
      err(new EmpresaNotFoundError('nonexistent')),
    );

    const result = await useCase.execute('nonexistent', { nombre: 'Nuevo' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(EmpresaNotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('returns EmpresaNameAlreadyExistsError when new name is taken by another empresa', async () => {
    const empresa = makeExistingEmpresa('Original');
    (mockRepo.findById as any).mockResolvedValue(ok(empresa));
    (mockRepo.existsByNombre as any).mockResolvedValue(true);

    const result = await useCase.execute(EXISTING_ID, { nombre: 'OtraEmpresa' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(EmpresaNameAlreadyExistsError);
    expect((result.unwrapErr() as EmpresaNameAlreadyExistsError).code).toBe(
      'EMPRESA_NAME_ALREADY_EXISTS',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('allows rename to the same nombre (no false conflict)', async () => {
    const empresa = makeExistingEmpresa('Mi Empresa');
    (mockRepo.findById as any).mockResolvedValue(ok(empresa));
    // existsByNombre returns true because the current name exists in the DB
    (mockRepo.existsByNombre as any).mockResolvedValue(true);

    const result = await useCase.execute(EXISTING_ID, { nombre: 'Mi Empresa' });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().nombre).toBe('Mi Empresa');
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
