import { Draft, EmpresaId, UserId, Timestamp } from '@mensajeria/domain';

export class DraftMapper {
  toDomain(prismaDraft: PrismaDraft): Draft {
    const recipientIds = (prismaDraft.recipientIds ?? []) as string[];

    return Draft.reconstruct({
      id: prismaDraft.id,
      userId: UserId.reconstruct(prismaDraft.userId),
      empresaId: EmpresaId.reconstruct(prismaDraft.empresaId),
      subject: prismaDraft.subject,
      body: prismaDraft.body,
      recipientIds,
      groupId: prismaDraft.groupId,
      createdAt: Timestamp.reconstruct(prismaDraft.createdAt.toISOString()),
      updatedAt: Timestamp.reconstruct(prismaDraft.updatedAt.toISOString()),
    });
  }

  toPrisma(draft: Draft): PrismaDraftCreateInput {
    return {
      id: draft.getId(),
      empresaId: draft.getEmpresaId().get(),
      userId: draft.getUserId().get(),
      subject: draft.getSubject(),
      body: draft.getBody(),
      recipientIds: [...draft.getRecipientIds()],
      groupId: draft.getGroupId(),
      createdAt: new Date(draft.getCreatedAt().toString()),
      updatedAt: new Date(draft.getUpdatedAt().toString()),
    };
  }
}

interface PrismaDraft {
  id: string;
  userId: string;
  empresaId: string;
  subject: string | null;
  body: string;
  recipientIds: unknown;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaDraftCreateInput {
  id: string;
  empresaId: string;
  userId: string;
  subject: string | null;
  body: string;
  recipientIds: string[];
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
