import {
  Group, GroupRepository, UserId, UserRepository,
  GroupNotFoundError, GroupAlreadyExistsError,
  Result, ok, err,
} from '@mensajeria/domain';
import { CreateGroupDTO, GroupResponse } from '../dtos/create-group.dto';
import { Inject } from '@nestjs/common';

export class CreateGroupUseCase {
  constructor(
    private readonly groupRepo: GroupRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(dto: CreateGroupDTO, requesterId: string): Promise<Result<GroupResponse, Error>> {
    const uid = UserId.create(requesterId);
    if (uid.isErr()) return err(uid.unwrapErr());

    const user = await this.userRepo.findById(uid.unwrap());
    if (user.isErr()) return err(user.unwrapErr());

    const groupResult = Group.create(dto.name, dto.description ?? null, uid.unwrap());
    if (groupResult.isErr()) return err(groupResult.unwrapErr());

    const group = groupResult.unwrap();
    const saveResult = await this.groupRepo.save(group);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    return ok(this.toResponse(group));
  }

  private toResponse(group: Group): GroupResponse {
    return {
      id: group.getId(),
      name: group.getName(),
      description: group.getDescription(),
      createdBy: group.getCreatedBy().get(),
      isActive: group.isActiveGroup(),
      memberCount: group.getMembers().length,
      createdAt: group.getCreatedAt().toString(),
      updatedAt: group.getUpdatedAt().toString(),
    };
  }
}
