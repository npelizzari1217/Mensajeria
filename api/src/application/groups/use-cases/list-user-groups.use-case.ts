import { GroupRepository, UserId, Result, ok, err } from '@mensajeria/domain';
import { GroupResponse } from '../dtos/create-group.dto';
import { Inject } from '@nestjs/common';

export class ListUserGroupsUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
  ) {}

  async execute(userId: string): Promise<Result<GroupResponse[], Error>> {
    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const groupsResult = await this.groupRepo.findByUser(uid);
    if (groupsResult.isErr()) return err(groupsResult.unwrapErr());

    const groups = groupsResult.unwrap();
    return ok(groups.map((g) => ({
      id: g.getId(),
      name: g.getName(),
      description: g.getDescription(),
      createdBy: g.getCreatedBy().get(),
      isActive: g.isActiveGroup(),
      memberCount: g.getMembers().length,
      createdAt: g.getCreatedAt().toString(),
      updatedAt: g.getUpdatedAt().toString(),
    })));
  }
}
