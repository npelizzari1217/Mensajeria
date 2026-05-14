import {
  GroupRepository, GroupRole, UserId,
  Result, ok, err, GroupNotFoundError, NotGroupAdminError,
} from '@mensajeria/domain';
import { ChangeMemberRoleDTO, GroupMemberResponse } from '../dtos/create-group.dto';
import { Inject } from '@nestjs/common';

export class ChangeMemberRoleUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
  ) {}

  async execute(
    groupId: string,
    targetUserId: string,
    dto: ChangeMemberRoleDTO,
    requesterId: string,
  ): Promise<Result<GroupMemberResponse, Error>> {
    const uidResult = UserId.create(requesterId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const groupResult = await this.groupRepo.findById(groupId);
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    const targetUid = UserId.create(targetUserId);
    if (targetUid.isErr()) return err(targetUid.unwrapErr());

    const newRole = GroupRole.create(dto.role);

    const changeResult = group.changeMemberRole(targetUid.unwrap(), newRole, uid);
    if (changeResult.isErr()) return err(changeResult.unwrapErr());

    const saveResult = await this.groupRepo.update(group);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    const member = changeResult.unwrap();
    return ok({
      id: member.getId(),
      userId: member.getUserId().get(),
      name: '',
      role: member.getRole().get(),
      joinedAt: member.getJoinedAt().toString(),
    });
  }
}
