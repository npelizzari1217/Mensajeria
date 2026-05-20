import {
  GroupRepository, UserRepository, UserId, EmpresaId, Email, GroupRole,
  Result, ok, err, GroupNotFoundError, NotGroupAdminError, NotFoundError,
} from '@mensajeria/domain';
import { ChangeMemberRoleDTO, GroupMemberResponse } from '../dtos/create-group.dto';
import { Inject } from '@nestjs/common';

export class ChangeMemberRoleUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(
    groupId: string,
    dto: ChangeMemberRoleDTO,
    requesterId: string,
    empresaId: string,
  ): Promise<Result<GroupMemberResponse, Error>> {
    const uidResult = UserId.create(requesterId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    const groupResult = await this.groupRepo.findById(groupId, eid.unwrap());
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) return err(emailResult.unwrapErr());

    const userResult = await this.userRepo.findByEmail(emailResult.unwrap());
    if (userResult.isErr()) return err(new NotFoundError('User', dto.email));
    const user = userResult.unwrap();

    const newRole = GroupRole.create(dto.role);

    const changeResult = group.changeMemberRole(user.getId(), newRole, uid);
    if (changeResult.isErr()) return err(changeResult.unwrapErr());

    const saveResult = await this.groupRepo.update(group);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    const member = changeResult.unwrap();
    return ok({
      id: member.getId(),
      userId: member.getUserId().get(),
      name: user.getName(),
      role: member.getRole().get(),
      joinedAt: member.getJoinedAt().toString(),
    });
  }
}
