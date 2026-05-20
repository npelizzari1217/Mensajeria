import { Inject } from '@nestjs/common';
import {
  Draft, DraftRepository, UserRepository, UserId, EmpresaId, Email, Result, ok, err,
} from '@mensajeria/domain';
import { SaveDraftDTO, DraftResponse } from '../dtos/draft.dto';

export class SaveDraftUseCase {
  constructor(
    @Inject('DraftRepository') private readonly draftRepo: DraftRepository,
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(dto: SaveDraftDTO, empresaId: string): Promise<Result<DraftResponse, Error>> {
    const userIdResult = UserId.create(dto.userId);
    if (userIdResult.isErr()) return err(userIdResult.unwrapErr());

    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    if (!dto.body || dto.body.trim().length === 0) {
      return err(new Error('Draft body is required'));
    }

    // Resolve recipient emails to IDs for storage
    const recipientIds: string[] = [];
    if (dto.recipientEmails) {
      for (const rawEmail of dto.recipientEmails) {
        const emailResult = Email.create(rawEmail);
        if (emailResult.isErr()) continue;
        const userResult = await this.userRepo.findByEmail(emailResult.unwrap());
        if (userResult.isOk()) {
          recipientIds.push(userResult.unwrap().getId().get());
        }
      }
    }

    const draftResult = Draft.create({
      userId: userIdResult.unwrap(),
      empresaId: eid.unwrap(),
      subject: dto.subject ?? null,
      body: dto.body,
      recipientIds,
      groupId: dto.groupId ?? null,
    });

    if (draftResult.isErr()) return err(draftResult.unwrapErr());

    const draft = draftResult.unwrap();
    const saveResult = await this.draftRepo.save(draft);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    return ok(await this.toResponse(draft));
  }

  async toResponse(draft: Draft): Promise<DraftResponse> {
    // Resolve stored recipient IDs back to emails for the response
    const recipientEmails: string[] = [];
    for (const id of draft.getRecipientIds()) {
      const uidResult = UserId.create(id);
      if (uidResult.isErr()) continue;
      const userResult = await this.userRepo.findById(uidResult.unwrap());
      if (userResult.isOk()) {
        recipientEmails.push(userResult.unwrap().getEmail().get());
      }
    }

    return {
      id: draft.getId(),
      userId: draft.getUserId().get(),
      subject: draft.getSubject(),
      body: draft.getBody(),
      recipientEmails,
      groupId: draft.getGroupId(),
      createdAt: draft.getCreatedAt().toString(),
      updatedAt: draft.getUpdatedAt().toString(),
    };
  }
}
