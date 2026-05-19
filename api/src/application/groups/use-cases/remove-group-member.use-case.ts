import {
  GroupRepository, UserRepository, UserId, Email,
  Result, ok, err, GroupNotFoundError, NotGroupAdminError, NotFoundError,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';

export class RemoveGroupMemberUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(
    groupId: string,
    email: string,
    requesterId: string,
  ): Promise<Result<void, Error>> {
    const uidResult = UserId.create(requesterId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const groupResult = await this.groupRepo.findById(groupId);
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    const emailResult = Email.create(email);
    if (emailResult.isErr()) return err(emailResult.unwrapErr());

    const userResult = await this.userRepo.findByEmail(emailResult.unwrap());
    if (userResult.isErr()) return err(new NotFoundError('User', email));
    const user = userResult.unwrap();

    const removeResult = group.removeMember(user.getId(), uid);
    if (removeResult.isErr()) return err(removeResult.unwrapErr());

    return await this.groupRepo.update(group);
  }
}
