import { GroupRepository, UserId, EmpresaId, UserRepository, Result, ok, err, GroupNotFoundError } from '@mensajeria/domain';
import { GroupDetailResponse, GroupMemberResponse } from '../dtos/create-group.dto';
import { Inject } from '@nestjs/common';

export class GetGroupDetailUseCase {
  constructor(
    @Inject('GroupRepository') private readonly groupRepo: GroupRepository,
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(groupId: string, requesterId: string, empresaId: string): Promise<Result<GroupDetailResponse, Error>> {
    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    const groupResult = await this.groupRepo.findById(groupId, eid.unwrap());
    if (groupResult.isErr()) return err(groupResult.unwrapErr());
    const group = groupResult.unwrap();
    if (!group) return err(new GroupNotFoundError(groupId));

    // Resolve member names
    const members: GroupMemberResponse[] = [];
    for (const m of group.getMembers()) {
      const userResult = await this.userRepo.findById(m.getUserId());
      const name = userResult.isOk() ? userResult.unwrap().getName() : '';
      members.push({
        id: m.getId(),
        userId: m.getUserId().get(),
        name,
        role: m.getRole().get(),
        joinedAt: m.getJoinedAt().toString(),
      });
    }

    return ok({
      id: group.getId(),
      name: group.getName(),
      description: group.getDescription(),
      createdBy: group.getCreatedBy().get(),
      isActive: group.isActiveGroup(),
      memberCount: members.length,
      createdAt: group.getCreatedAt().toString(),
      updatedAt: group.getUpdatedAt().toString(),
      members,
    });
  }
}
