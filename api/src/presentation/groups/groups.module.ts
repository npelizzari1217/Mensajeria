import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { CreateGroupUseCase } from '../../application/groups/use-cases/create-group.use-case';
import { UpdateGroupUseCase } from '../../application/groups/use-cases/update-group.use-case';
import { DeactivateGroupUseCase } from '../../application/groups/use-cases/deactivate-group.use-case';
import { AddGroupMemberUseCase } from '../../application/groups/use-cases/add-group-member.use-case';
import { RemoveGroupMemberUseCase } from '../../application/groups/use-cases/remove-group-member.use-case';
import { ChangeMemberRoleUseCase } from '../../application/groups/use-cases/change-member-role.use-case';
import { ListUserGroupsUseCase } from '../../application/groups/use-cases/list-user-groups.use-case';
import { GetGroupDetailUseCase } from '../../application/groups/use-cases/get-group-detail.use-case';
import { ResolveGroupRecipientsUseCase } from '../../application/groups/use-cases/resolve-group-recipients.use-case';
import { PrismaGroupRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-group.repository';
import { GroupMapper } from '../../infrastructure/persistence/prisma/mappers/group-mapper';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { UserRepository } from '@mensajeria/domain';

@Module({
  controllers: [GroupsController],
  providers: [
    CreateGroupUseCase,
    UpdateGroupUseCase,
    DeactivateGroupUseCase,
    AddGroupMemberUseCase,
    RemoveGroupMemberUseCase,
    ChangeMemberRoleUseCase,
    ListUserGroupsUseCase,
    GetGroupDetailUseCase,
    ResolveGroupRecipientsUseCase,
    GroupMapper,
    {
      provide: 'GroupRepository',
      useFactory: (prisma: PrismaService, mapper: GroupMapper) =>
        new PrismaGroupRepository(prisma, mapper),
      inject: [PrismaService, GroupMapper],
    },
  ],
  exports: [ResolveGroupRecipientsUseCase],
})
export class GroupsModule {}
