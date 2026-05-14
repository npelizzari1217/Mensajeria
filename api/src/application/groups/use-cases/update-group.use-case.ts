import {
  GroupRepository, Result, ok, err, GroupNotFoundError, NotGroupAdminError,
} from '@mensajeria/domain';
import { UpdateGroupDTO, GroupResponse } from '../dtos/create-group.dto';
import { Inject } from '@nestjs/common';

export class UpdateGroupUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
  ) {}

  async execute(
    groupId: string,
    dto: UpdateGroupDTO,
    requesterId: string,
  ): Promise<Result<GroupResponse, Error>> {
    const groupResult = await this.groupRepo.findById(groupId);
    if (groupResult.isErr()) return err(groupResult.unwrapErr());

    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    return ok({
      id: group.getId(),
      name: dto.name ?? group.getName(),
      description: dto.description !== undefined ? dto.description : group.getDescription(),
      createdBy: group.getCreatedBy().get(),
      isActive: group.isActiveGroup(),
      memberCount: group.getMembers().length,
      createdAt: group.getCreatedAt().toString(),
      updatedAt: group.getUpdatedAt().toString(),
    });
  }
}
