import { Group, GroupMember, GroupRole, UserId, Timestamp } from '@mensajeria/domain';

export class GroupMapper {
  toDomain(prismaGroup: PrismaGroup): Group {
    const members = (prismaGroup.members ?? []).map((m) =>
      GroupMember.reconstruct({
        id: m.id,
        groupId: m.groupId,
        userId: UserId.reconstruct(m.userId),
        role: GroupRole.create(m.role),
        joinedAt: Timestamp.reconstruct(m.joinedAt.toISOString()),
      }),
    );

    return Group.reconstruct({
      id: prismaGroup.id,
      name: prismaGroup.name,
      description: prismaGroup.description,
      createdBy: UserId.reconstruct(prismaGroup.createdBy),
      members,
      isActive: prismaGroup.isActive,
      createdAt: Timestamp.reconstruct(prismaGroup.createdAt.toISOString()),
      updatedAt: Timestamp.reconstruct(prismaGroup.updatedAt.toISOString()),
    });
  }

  toPrisma(group: Group): PrismaGroupCreateInput {
    return {
      id: group.getId(),
      name: group.getName(),
      description: group.getDescription(),
      createdBy: group.getCreatedBy().get(),
      isActive: group.isActiveGroup(),
      createdAt: new Date(group.getCreatedAt().toString()),
      updatedAt: new Date(group.getUpdatedAt().toString()),
    };
  }
}

interface PrismaGroup {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  members?: PrismaGroupMember[];
}

interface PrismaGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: Date;
}

interface PrismaGroupCreateInput {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
