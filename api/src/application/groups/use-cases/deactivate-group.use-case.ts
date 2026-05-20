import { GroupRepository, EmpresaId, Result, ok, err, GroupNotFoundError, NotGroupAdminError, UserId } from '@mensajeria/domain';
import { Inject } from '@nestjs/common';

export class DeactivateGroupUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
  ) {}

  async execute(groupId: string, requesterId: string, empresaId: string): Promise<Result<void, Error>> {
    const uidResult = UserId.create(requesterId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    const groupResult = await this.groupRepo.findById(groupId, eid.unwrap());
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    if (!group.isAdmin(uid)) {
      return err(new NotGroupAdminError(requesterId, groupId));
    }

    const deactivateResult = group.deactivate(uid);
    if (deactivateResult.isErr()) return err(deactivateResult.unwrapErr());

    return await this.groupRepo.update(group);
  }
}
