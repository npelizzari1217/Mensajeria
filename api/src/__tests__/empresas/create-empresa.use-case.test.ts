import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EmpresaNameAlreadyExistsError,
  ok,
  err,
} from '@mensajeria/domain';
import { CreateEmpresaUseCase } from '../../application/empresas/use-cases/create-empresa.use-case';
import type { EmpresaRepository } from '@mensajeria/domain';

describe('CreateEmpresaUseCase', () => {
  let useCase: CreateEmpresaUseCase;
  let mockRepo: EmpresaRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(ok(undefined)),
      delete: vi.fn(),
      existsByNombre: vi.fn().mockResolvedValue(false),
    };
    useCase = new CreateEmpresaUseCase(mockRepo);
  });

  it('creates empresa and returns its DTO', async () => {
    const result = await useCase.execute({ nombre: 'Mi Empresa' });

    expect(result.isOk()).toBe(true);
    const dto = result.unwrap();
    expect(dto.nombre).toBe('Mi Empresa');
    expect(dto.id).toBeDefined();
    expect(dto.createdAt).toBeDefined();
    expect(dto.updatedAt).toBeDefined();

    expect(mockRepo.existsByNombre).toHaveBeenCalledWith('Mi Empresa');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('returns validation error for empty nombre', async () => {
    const result = await useCase.execute({ nombre: '' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('cannot be empty');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('returns validation error for whitespace-only nombre', async () => {
    const result = await useCase.execute({ nombre: '   ' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('cannot be empty');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('returns validation error for nombre over 100 chars', async () => {
    const result = await useCase.execute({ nombre: 'A'.repeat(101) });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('100 characters');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('returns EmpresaNameAlreadyExistsError when nombre is taken', async () => {
    (mockRepo.existsByNombre as any).mockResolvedValue(true);

    const result = await useCase.execute({ nombre: 'Duplicada' });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(EmpresaNameAlreadyExistsError);
    expect((result.unwrapErr() as EmpresaNameAlreadyExistsError).code).toBe(
      'EMPRESA_NAME_ALREADY_EXISTS',
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('trims whitespace from nombre before creation', async () => {
    const result = await useCase.execute({ nombre: '  Trimmed  ' });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().nombre).toBe('Trimmed');
    expect(mockRepo.existsByNombre).toHaveBeenCalledWith('Trimmed');
  });
});
