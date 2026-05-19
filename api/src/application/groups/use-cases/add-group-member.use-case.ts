import {
  GroupRepository, UserRepository, UserId, Email, GroupRole,
  Result, ok, err, GroupNotFoundError, NotGroupAdminError, NotFoundError,
} from '@mensajeria/domain';
import { AddGroupMemberDTO, GroupMemberResponse } from '../dtos/create-group.dto';
import { Inject } from '@nestjs/common';

export class AddGroupMemberUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(
    groupId: string,
    dto: AddGroupMemberDTO,
    requesterId: string,
  ): Promise<Result<GroupMemberResponse, Error>> {
    const uidResult = UserId.create(requesterId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const groupResult = await this.groupRepo.findById(groupId);
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) return err(emailResult.unwrapErr());

    const userResult = await this.userRepo.findByEmail(emailResult.unwrap());
    if (userResult.isErr()) return err(new NotFoundError('User', dto.email));
    const user = userResult.unwrap();

    const role = dto.role ? GroupRole.create(dto.role) : GroupRole.MEMBER;

    const addResult = group.addMember(user.getId(), role, uid);
    if (addResult.isErr()) return err(addResult.unwrapErr());

    const saveResult = await this.groupRepo.update(group);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    const member = addResult.unwrap();
    return ok({
      id: member.getId(),
      userId: member.getUserId().get(),
      name: user.getName(),
      role: member.getRole().get(),
      joinedAt: member.getJoinedAt().toString(),
    });
  }
}
