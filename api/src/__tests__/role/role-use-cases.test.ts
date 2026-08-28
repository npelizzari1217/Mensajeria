import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Role,
  RoleId,
  RoleName,
  RoleRepository,
  ForbiddenDomainError,
  NotFoundError,
  RoleNameAlreadyExistsError,
  RoleHasUsersError,
} from '@mensajeria/domain';
import { ListRolesUseCase } from '../../application/role/use-cases/list-roles.use-case';
import { CreateRoleUseCase } from '../../application/role/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/role/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/role/use-cases/delete-role.use-case';
import { CallerContext } from '../../application/auth/dtos/caller-context.dto';

// ── Helpers ─────────────────────────────────────────────────────────

function makeCaller(roleId: number, role: string): CallerContext {
  return {
    callerId: `user-${roleId}`,
    callerRole: role,
    callerRoleId: roleId,
    callerEmpresaId: '00000000-0000-0000-0000-000000000001',
  };
}

function makeRole(id: number, name: string, description = `${name} role`): Role {
  return Role.reconstruct({
    id: RoleId.reconstruct(id),
    name: RoleName.reconstruct(name),
    description,
  });
}

// ── ListRolesUseCase ────────────────────────────────────────────────

describe('ListRolesUseCase', () => {
  let useCase: ListRolesUseCase;
  let mockRepo: RoleRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByName: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      hasUsers: vi.fn(),
    };
    useCase = new ListRolesUseCase(mockRepo);
  });

  it('Admin lists roles → ok', async () => {
    const roles = [makeRole(1, 'Admin'), makeRole(2, 'Supervisor')];
    (mockRepo.findAll as any).mockResolvedValue(roles);

    const result = await useCase.execute(makeCaller(1, 'Admin'));

    expect(result.isOk()).toBe(true);
    const dtos = result.unwrap();
    expect(dtos).toHaveLength(2);
    expect(dtos[0].id).toBe(1);
    expect(dtos[0].name).toBe('Admin');
    expect(dtos[1].id).toBe(2);
    expect(dtos[1].name).toBe('Supervisor');
    expect(mockRepo.findAll).toHaveBeenCalled();
  });

  it('Supervisor lists roles → ok', async () => {
    const roles = [makeRole(3, 'Técnico'), makeRole(4, 'Usuario')];
    (mockRepo.findAll as any).mockResolvedValue(roles);

    const result = await useCase.execute(makeCaller(2, 'Supervisor'));

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toHaveLength(2);
  });

  it('Técnico lists roles → ForbiddenError', async () => {
    const result = await useCase.execute(makeCaller(3, 'Tecnico'));

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
    expect(result.unwrapErr().message).toContain('Only Admin and Supervisor');
    expect(mockRepo.findAll).not.toHaveBeenCalled();
  });

  it('Usuario lists roles → ForbiddenError', async () => {
    const result = await useCase.execute(makeCaller(4, 'Usuario'));

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
  });
});

// ── CreateRoleUseCase ───────────────────────────────────────────────

describe('CreateRoleUseCase', () => {
  let useCase: CreateRoleUseCase;
  let mockRepo: RoleRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByName: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      hasUsers: vi.fn(),
    };
    useCase = new CreateRoleUseCase(mockRepo);
  });

  it('Admin creates role → ok (returns RoleProfileDTO)', async () => {
    const result = await useCase.execute({
      name: 'Auditor',
      description: 'Auditoría de mensajes',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isOk()).toBe(true);
    const profile = result.unwrap();
    expect(profile.name).toBe('Auditor');
    expect(profile.description).toBe('Auditoría de mensajes');
    expect(profile.id).toBe(1); // maxId 0 + 1
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('Admin creates role → auto-increment ID', async () => {
    const existing = [
      makeRole(1, 'Admin'),
      makeRole(2, 'Supervisor'),
      makeRole(3, 'Técnico'),
      makeRole(4, 'Usuario'),
    ];
    (mockRepo.findAll as any).mockResolvedValue(existing);

    const result = await useCase.execute({
      name: 'NuevoRol',
      description: 'Nuevo',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().id).toBe(5);
  });

  it('Admin creates role with duplicate name → RoleNameAlreadyExistsError', async () => {
    const existingRole = makeRole(5, 'Auditor');
    (mockRepo.findByName as any).mockResolvedValue(existingRole);

    const result = await useCase.execute({
      name: 'Auditor',
      description: 'Testing',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(RoleNameAlreadyExistsError);
    expect((result.unwrapErr() as RoleNameAlreadyExistsError).code).toBe('ROLE_NAME_ALREADY_EXISTS');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('Supervisor creates role → ForbiddenError', async () => {
    const result = await useCase.execute({
      name: 'Auditor',
      description: 'Testing',
      caller: makeCaller(2, 'Supervisor'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
    expect(result.unwrapErr().message).toContain('Only Admin can create');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('Técnico creates role → ForbiddenError', async () => {
    const result = await useCase.execute({
      name: 'Auditor',
      description: 'Testing',
      caller: makeCaller(3, 'Tecnico'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
  });

  it('Admin creates role with invalid name → validation error', async () => {
    const result = await useCase.execute({
      name: 'A',
      description: 'Too short',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('at least 2');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('Admin creates role with empty description → ok (uses empty string)', async () => {
    const result = await useCase.execute({
      name: 'EmptyDesc',
      description: '',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isOk()).toBe(false);
    expect(result.unwrapErr().message).toContain('description');
  });
});

// ── UpdateRoleUseCase ───────────────────────────────────────────────

describe('UpdateRoleUseCase', () => {
  let useCase: UpdateRoleUseCase;
  let mockRepo: RoleRepository;

  const existingRole = makeRole(5, 'Auditor', 'Auditor role');

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn().mockResolvedValue(existingRole),
      findByName: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      hasUsers: vi.fn(),
    };
    useCase = new UpdateRoleUseCase(mockRepo);
  });

  it('Admin modifies role → ok', async () => {
    const result = await useCase.execute({
      id: 5,
      name: 'Auditor Actualizado',
      description: 'Nueva descripción',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isOk()).toBe(true);
    const profile = result.unwrap();
    expect(profile.id).toBe(5);
    expect(profile.name).toBe('Auditor Actualizado');
    expect(profile.description).toBe('Nueva descripción');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('Admin modifies → role no existe → NotFoundError', async () => {
    (mockRepo.findById as any).mockResolvedValue(null);

    const result = await useCase.execute({
      id: 999,
      name: 'Ghost',
      description: 'Does not exist',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(NotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('Admin modifies → nombre duplicado → RoleNameAlreadyExistsError', async () => {
    const otherRole = makeRole(6, 'Super', 'Other role');
    (mockRepo.findByName as any).mockResolvedValue(otherRole);

    const result = await useCase.execute({
      id: 5,
      name: 'Super',
      description: 'New desc',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(RoleNameAlreadyExistsError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('Admin modifies → same name allowed (rename to self)', async () => {
    const sameRole = makeRole(5, 'Auditor');
    (mockRepo.findByName as any).mockResolvedValue(sameRole);

    const result = await useCase.execute({
      id: 5,
      name: 'Auditor',
      description: 'Updated description',
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().name).toBe('Auditor');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('Supervisor modifies role → ForbiddenError', async () => {
    const result = await useCase.execute({
      id: 5,
      name: 'Auditor',
      description: 'Test',
      caller: makeCaller(2, 'Supervisor'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
    expect(result.unwrapErr().message).toContain('Only Admin can update');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});

// ── DeleteRoleUseCase ───────────────────────────────────────────────

describe('DeleteRoleUseCase', () => {
  let useCase: DeleteRoleUseCase;
  let mockRepo: RoleRepository;

  const existingRole = makeRole(5, 'TempRole', 'Temporary');

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn().mockResolvedValue(existingRole),
      findByName: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      hasUsers: vi.fn().mockResolvedValue(false),
    };
    useCase = new DeleteRoleUseCase(mockRepo);
  });

  it('Admin deletes role sin usuarios → ok', async () => {
    const result = await useCase.execute({
      id: 5,
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isOk()).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalled();
  });

  it('Admin deletes role con usuarios → RoleHasUsersError', async () => {
    (mockRepo.hasUsers as any).mockResolvedValue(true);

    const result = await useCase.execute({
      id: 5,
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(RoleHasUsersError);
    expect((result.unwrapErr() as RoleHasUsersError).code).toBe('ROLE_HAS_USERS');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('Admin deletes → role no existe → NotFoundError', async () => {
    (mockRepo.findById as any).mockResolvedValue(null);

    const result = await useCase.execute({
      id: 999,
      caller: makeCaller(1, 'Admin'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(NotFoundError);
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('Supervisor deletes role → ForbiddenError', async () => {
    const result = await useCase.execute({
      id: 5,
      caller: makeCaller(2, 'Supervisor'),
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(ForbiddenDomainError);
    expect(result.unwrapErr().message).toContain('Only Admin can delete');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
