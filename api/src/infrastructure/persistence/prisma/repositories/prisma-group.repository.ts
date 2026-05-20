import { Injectable } from '@nestjs/common';
import { Group, GroupRepository, UserId, EmpresaId, Result, ok, err } from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { GroupMapper } from '../mappers/group-mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaGroupRepository implements GroupRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: GroupMapper,
  ) {}

  private get db() {
    return this.prisma as any;
  }

  async save(group: Group): Promise<Result<void, Error>> {
    try {
      const data = this.mapper.toPrisma(group);
      await this.db.group.create({ data });

      for (const member of group.getMembers()) {
        await this.db.groupMember.create({
          data: {
            id: member.getId(),
            groupId: member.getGroupId(),
            userId: member.getUserId().get(),
            role: member.getRole().get(),
            joinedAt: new Date(member.getJoinedAt().toString()),
          },
        });
      }

      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to save group'));
    }
  }

  async findById(id: string, empresaId: EmpresaId): Promise<Result<Group | null, Error>> {
    try {
      const prismaGroup = await this.db.group.findUnique({
        where: { id, empresaId: empresaId.get() },
        include: { members: true },
      });
      if (!prismaGroup) {
        return ok(null);
      }
      return ok(this.mapper.toDomain(prismaGroup));
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to find group'));
    }
  }

  async findByUser(userId: UserId, empresaId: EmpresaId): Promise<Result<Group[], Error>> {
    try {
      const prismaGroups = await this.db.group.findMany({
        where: {
          isActive: true,
          empresaId: empresaId.get(),
          members: {
            some: { userId: userId.get() },
          },
        },
        include: { members: true },
      });
      return ok(prismaGroups.map((g: any) => this.mapper.toDomain(g)));
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to find user groups'));
    }
  }

  async findAll(): Promise<Result<Group[], Error>> {
    try {
      const prismaGroups = await this.db.group.findMany({
        where: { isActive: true },
        include: { members: true },
      });
      return ok(prismaGroups.map((g: any) => this.mapper.toDomain(g)));
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to list groups'));
    }
  }

  async update(group: Group): Promise<Result<void, Error>> {
    try {
      const data = this.mapper.toPrisma(group);
      await this.db.group.update({
        where: { id: group.getId() },
        data,
      });

      await this.db.groupMember.deleteMany({
        where: { groupId: group.getId() },
      });

      for (const member of group.getMembers()) {
        await this.db.groupMember.create({
          data: {
            id: member.getId(),
            groupId: member.getGroupId(),
            userId: member.getUserId().get(),
            role: member.getRole().get(),
            joinedAt: new Date(member.getJoinedAt().toString()),
          },
        });
      }

      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to update group'));
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      await this.db.group.update({
        where: { id },
        data: { isActive: false },
      });
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to delete group'));
    }
  }
}
