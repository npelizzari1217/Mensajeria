/**
 * InboxQueryDTO — input for GetInboxUseCase.
 *
 * filter: optional status filter — 'unread' for unread only, 'read' for read only.
 * page: 1-indexed page number (default 1).
 * pageSize: items per page (default 20, max 100).
 */
export interface InboxQueryDTO {
  userId: string;
  filter?: 'unread' | 'read';
  page: number;
  pageSize: number;
}
