import { GroupRepository, UserId, EmpresaId, Result, ok, err, GroupNotFoundError } from '@mensajeria/domain';
import { Inject } from '@nestjs/common';

/**
 * Resolves group members to recipient UserIds.
 * Used by SendMessageUseCase when a message targets a group.
 */
export class ResolveGroupRecipientsUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
  ) {}

  async execute(groupId: string, excludeUserId: string, empresaId: EmpresaId): Promise<Result<UserId[], Error>> {
    const groupResult = await this.groupRepo.findById(groupId, empresaId);
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    const excludeUid = UserId.create(excludeUserId);
    if (excludeUid.isErr()) return err(excludeUid.unwrapErr());

    const allMembers = group.getActiveMemberIds();
    // Exclude sender
    const recipients = allMembers.filter((m) => !m.equals(excludeUid.unwrap()));

    return ok(recipients);
  }
}
