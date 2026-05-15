import { Injectable } from '@nestjs/common';
import { Draft, DraftRepository, Result, ok, err } from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { DraftMapper } from '../mappers/draft-mapper';

@Injectable()
export class PrismaDraftRepository implements DraftRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: DraftMapper,
  ) {}

  private get db() {
    return this.prisma as any;
  }

  async save(draft: Draft): Promise<Result<void, Error>> {
    try {
      const data = this.mapper.toPrisma(draft);
      await this.db.draft.create({ data });
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to save draft'));
    }
  }

  async findById(id: string): Promise<Result<Draft | null, Error>> {
    try {
      const prismaDraft = await this.db.draft.findUnique({
        where: { id },
      });
      if (!prismaDraft) {
        return ok(null);
      }
      return ok(this.mapper.toDomain(prismaDraft));
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to find draft'));
    }
  }

  async findByUserId(userId: string): Promise<Result<Draft[], Error>> {
    try {
      const drafts = await this.db.draft.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      return ok(drafts.map((d: any) => this.mapper.toDomain(d)));
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to find user drafts'));
    }
  }

  async update(draft: Draft): Promise<Result<void, Error>> {
    try {
      const data = this.mapper.toPrisma(draft);
      await this.db.draft.update({
        where: { id: draft.getId() },
        data,
      });
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to update draft'));
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      await this.db.draft.delete({
        where: { id },
      });
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error('Failed to delete draft'));
    }
  }
}
