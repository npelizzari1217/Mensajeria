import {
  GroupRepository, UserId,
  Result, ok, err, GroupNotFoundError, NotGroupAdminError,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';

export class RemoveGroupMemberUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
  ) {}

  async execute(
    groupId: string,
    targetUserId: string,
    requesterId: string,
  ): Promise<Result<void, Error>> {
    const uidResult = UserId.create(requesterId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const groupResult = await this.groupRepo.findById(groupId);
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    const targetUid = UserId.create(targetUserId);
    if (targetUid.isErr()) return err(targetUid.unwrapErr());

    const removeResult = group.removeMember(targetUid.unwrap(), uid);
    if (removeResult.isErr()) return err(removeResult.unwrapErr());

    return await this.groupRepo.update(group);
  }
}
