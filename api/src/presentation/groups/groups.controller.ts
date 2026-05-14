import {
  Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus,
  UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { CreateGroupUseCase } from '../../application/groups/use-cases/create-group.use-case';
import { UpdateGroupUseCase } from '../../application/groups/use-cases/update-group.use-case';
import { DeactivateGroupUseCase } from '../../application/groups/use-cases/deactivate-group.use-case';
import { AddGroupMemberUseCase } from '../../application/groups/use-cases/add-group-member.use-case';
import { RemoveGroupMemberUseCase } from '../../application/groups/use-cases/remove-group-member.use-case';
import { ChangeMemberRoleUseCase } from '../../application/groups/use-cases/change-member-role.use-case';
import { ListUserGroupsUseCase } from '../../application/groups/use-cases/list-user-groups.use-case';
import { GetGroupDetailUseCase } from '../../application/groups/use-cases/get-group-detail.use-case';
import { CreateGroupDTO, UpdateGroupDTO, AddGroupMemberDTO, ChangeMemberRoleDTO } from '../../application/groups/dtos/create-group.dto';

@Controller('v1/groups')
@UseGuards(AuthGuard)
export class GroupsController {
  constructor(
    private readonly createGroup: CreateGroupUseCase,
    private readonly updateGroup: UpdateGroupUseCase,
    private readonly deactivateGroup: DeactivateGroupUseCase,
    private readonly addMember: AddGroupMemberUseCase,
    private readonly removeMember: RemoveGroupMemberUseCase,
    private readonly changeMemberRole: ChangeMemberRoleUseCase,
    private readonly listGroups: ListUserGroupsUseCase,
    private readonly getDetail: GetGroupDetailUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGroupDTO, @Req() req: any) {
    const result = await this.createGroup.execute(dto, req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Get()
  async list(@Req() req: any) {
    const result = await this.listGroups.execute(req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: any) {
    const result = await this.getDetail.execute(id, req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDTO, @Req() req: any) {
    const result = await this.updateGroup.execute(id, dto, req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string, @Req() req: any) {
    const result = await this.deactivateGroup.execute(id, req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMemberRoute(@Param('id') id: string, @Body() dto: AddGroupMemberDTO, @Req() req: any) {
    const result = await this.addMember.execute(id, dto, req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberRoute(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any) {
    const result = await this.removeMember.execute(id, userId, req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
  }

  @Patch(':id/members/:userId')
  async changeMemberRoleRoute(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: ChangeMemberRoleDTO,
    @Req() req: any,
  ) {
    const result = await this.changeMemberRole.execute(id, userId, dto, req.user.userId);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }
}
