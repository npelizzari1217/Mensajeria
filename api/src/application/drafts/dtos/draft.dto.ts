/**
 * SaveDraftDTO — input for SaveDraftUseCase.
 */
export interface SaveDraftDTO {
  userId: string;
  subject?: string;
  body: string;
  recipientEmails?: string[];
  groupId?: string;
}

/**
 * UpdateDraftDTO — input for UpdateDraftUseCase.
 */
export interface UpdateDraftDTO {
  subject?: string | null;
  body?: string;
  recipientEmails?: string[];
  groupId?: string | null;
}

/**
 * DraftResponse — single draft returned from queries.
 */
export interface DraftResponse {
  id: string;
  userId: string;
  subject: string | null;
  body: string;
  recipientEmails: string[];
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}
