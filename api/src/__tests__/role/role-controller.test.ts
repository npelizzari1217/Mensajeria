import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ForbiddenDomainError,
  NotFoundError,
  RoleNameAlreadyExistsError,
  RoleHasUsersError,
  ok,
  err,
} from '@mensajeria/domain';
import { RoleController } from '../../presentation/role/role.controller';

// ── Mocks ───────────────────────────────────────────────────────────

const ADMIN_USER = { userId: 'admin-1', role: 'Admin', roleId: 1, empresaId: 'empresa-a' };
const SUPERVISOR_USER = { userId: 'super-1', role: 'Supervisor', roleId: 2, empresaId: 'empresa-a' };

const MOCK_ROLE_PROFILE = {
  id: 5,
  name: 'Auditor',
  description: 'Auditor role',
};

// ── Suite ───────────────────────────────────────────────────────────

describe('RoleController', () => {
  let controller: RoleController;
  let mockListRoles: { execute: ReturnType<typeof vi.fn> };
  let mockCreateRole: { execute: ReturnType<typeof vi.fn> };
  let mockUpdateRole: { execute: ReturnType<typeof vi.fn> };
  let mockDeleteRole: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockListRoles = { execute: vi.fn() };
    mockCreateRole = { execute: vi.fn() };
    mockUpdateRole = { execute: vi.fn() };
    mockDeleteRole = { execute: vi.fn() };

    controller = new RoleController(
      mockListRoles as any,
      mockCreateRole as any,
      mockUpdateRole as any,
      mockDeleteRole as any,
    );
  });

  // ── findAll (list roles) ──────────────────────────────────────────

  describe('findAll', () => {
    it('returns 200 with role array for Admin', async () => {
      mockListRoles.execute.mockResolvedValue(ok([MOCK_ROLE_PROFILE]));

      const result = await controller.findAll(ADMIN_USER);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Auditor');
      expect(mockListRoles.execute).toHaveBeenCalled();
    });

    it('works for Supervisor caller', async () => {
      mockListRoles.execute.mockResolvedValue(ok([MOCK_ROLE_PROFILE]));

      const result = await controller.findAll(SUPERVISOR_USER);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
    });

    it('throws domain error when list forbidden', async () => {
      const forbidden = new ForbiddenDomainError('Only Admin and Supervisor can list roles');
      mockListRoles.execute.mockResolvedValue(err(forbidden));

      await expect(controller.findAll(ADMIN_USER)).rejects.toThrow(forbidden);
    });
  });

  // ── create ────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns 201 with created role for Admin', async () => {
      mockCreateRole.execute.mockResolvedValue(ok(MOCK_ROLE_PROFILE));

      const result = await controller.create(
        { name: 'Auditor', description: 'Audit role' },
        ADMIN_USER,
      );

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(5);
      expect(result.data.name).toBe('Auditor');
      expect(mockCreateRole.execute).toHaveBeenCalledWith({
        name: 'Auditor',
        description: 'Audit role',
        caller: expect.objectContaining({ callerRoleId: 1 }),
      });
    });

    it('throws ForbiddenDomainError when Supervisor tries to create', async () => {
      const forbidden = new ForbiddenDomainError('Only Admin can create roles');
      mockCreateRole.execute.mockResolvedValue(err(forbidden));

      await expect(
        controller.create({ name: 'Auditor' }, SUPERVISOR_USER),
      ).rejects.toThrow(forbidden);
    });

    it('throws RoleNameAlreadyExistsError on duplicate name', async () => {
      const dupError = new RoleNameAlreadyExistsError('Auditor');
      mockCreateRole.execute.mockResolvedValue(err(dupError));

      await expect(
        controller.create({ name: 'Auditor' }, ADMIN_USER),
      ).rejects.toThrow(dupError);
    });
  });

  // ── update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('returns 200 with updated role for Admin', async () => {
      const updated = { ...MOCK_ROLE_PROFILE, name: 'Auditor Actualizado' };
      mockUpdateRole.execute.mockResolvedValue(ok(updated));

      const result = await controller.update(
        5,
        { name: 'Auditor Actualizado', description: 'Updated' },
        ADMIN_USER,
      );

      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('Auditor Actualizado');
      expect(mockUpdateRole.execute).toHaveBeenCalledWith({
        id: 5,
        name: 'Auditor Actualizado',
        description: 'Updated',
        caller: expect.objectContaining({ callerRoleId: 1 }),
      });
    });

    it('throws NotFoundError when role does not exist', async () => {
      const notFound = new NotFoundError('Role', '999');
      mockUpdateRole.execute.mockResolvedValue(err(notFound));

      await expect(
        controller.update(999, { name: 'Ghost' }, ADMIN_USER),
      ).rejects.toThrow(notFound);
    });

    it('throws ForbiddenDomainError when Supervisor tries to update', async () => {
      const forbidden = new ForbiddenDomainError('Only Admin can update roles');
      mockUpdateRole.execute.mockResolvedValue(err(forbidden));

      await expect(
        controller.update(5, { name: 'Auditor' }, SUPERVISOR_USER),
      ).rejects.toThrow(forbidden);
    });
  });

  // ── remove ────────────────────────────────────────────────────────

  describe('remove', () => {
    it('returns 204 (no content) for Admin deleting role without users', async () => {
      mockDeleteRole.execute.mockResolvedValue(ok(undefined));

      await expect(
        controller.remove(5, ADMIN_USER),
      ).resolves.toBeUndefined();

      expect(mockDeleteRole.execute).toHaveBeenCalledWith({
        id: 5,
        caller: expect.objectContaining({ callerRoleId: 1 }),
      });
    });

    it('throws RoleHasUsersError when role has users assigned', async () => {
      const hasUsersError = new RoleHasUsersError(5);
      mockDeleteRole.execute.mockResolvedValue(err(hasUsersError));

      await expect(
        controller.remove(5, ADMIN_USER),
      ).rejects.toThrow(hasUsersError);
    });

    it('throws ForbiddenDomainError when Supervisor tries to delete', async () => {
      const forbidden = new ForbiddenDomainError('Only Admin can delete roles');
      mockDeleteRole.execute.mockResolvedValue(err(forbidden));

      await expect(
        controller.remove(5, SUPERVISOR_USER),
      ).rejects.toThrow(forbidden);
    });

    it('throws NotFoundError when role does not exist', async () => {
      const notFound = new NotFoundError('Role', '999');
      mockDeleteRole.execute.mockResolvedValue(err(notFound));

      await expect(
        controller.remove(999, ADMIN_USER),
      ).rejects.toThrow(notFound);
    });
  });
});
