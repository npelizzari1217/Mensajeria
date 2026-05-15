/**
 * messages.ts — API helpers para mensajería en la app mobile.
 *
 * Espeja los endpoints de MessagingController (api/src/presentation/messaging/messaging.controller.ts).
 * Todos los responses vienen en el envelope estándar { data: ... }.
 *
 * Shapes confirmados leyendo:
 *   - api/src/presentation/messaging/messaging.controller.ts
 *   - web/src/pages/inbox.page.tsx (inbox shape)
 *   - web/src/pages/message-detail.page.tsx (detail + thread shape)
 */
import apiClient from './client';

// ── Shared types ─────────────────────────────────────────────────────

export interface MessageRecipient {
  recipientId: string;
  recipientName: string;
  status: string;         // 'READ' | 'DELIVERED' | ...
  readAt: string | null;
}

export interface MessageListItem {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  sentAt: string;
  createdAt: string;
  parentMessageId: string | null;
  recipients: MessageRecipient[];
}

export interface PaginatedMessages {
  data: MessageListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ThreadResponse {
  thread?: {
    id: string;
    subject: string;
    messageCount: number;
  };
  messages: MessageListItem[];
}

// ── Inbox ─────────────────────────────────────────────────────────────

/**
 * GET /v1/messages/inbox
 *
 * Notar: el controller devuelve result.unwrap() directamente, que ya tiene
 * { data, total, page, pageSize } — NO está envuelto en otro { data: ... }.
 * Confirmed by: messaging.controller.ts line 97.
 */
export async function listInbox(
  page = 1,
  pageSize = 20,
  status?: 'read' | 'unread',
): Promise<PaginatedMessages> {
  const params: Record<string, string | number> = { page, pageSize };
  if (status) params.status = status;

  const { data } = await apiClient.get<PaginatedMessages>('/messages/inbox', {
    params,
  });
  // El controller retorna el objeto paginado directamente (sin envelope extra)
  return data;
}

// ── Sent ──────────────────────────────────────────────────────────────

/**
 * GET /v1/messages/sent
 *
 * Mismo patrón que inbox: result.unwrap() directo.
 */
export async function listSent(
  page = 1,
  pageSize = 20,
): Promise<PaginatedMessages> {
  const { data } = await apiClient.get<PaginatedMessages>('/messages/sent', {
    params: { page, pageSize },
  });
  return data;
}

// ── Message Detail ────────────────────────────────────────────────────

/**
 * GET /v1/messages/:id
 *
 * Controller: return { data: result.unwrap() }
 * Axios interceptor ya stripea el primer { data: ... } del AxiosResponse,
 * así que accedemos a data.data para llegar al MessageListItem.
 */
export async function getMessage(id: string): Promise<MessageListItem> {
  const { data } = await apiClient.get<{ data: MessageListItem }>(
    `/messages/${id}`,
  );
  return data.data;
}

// ── Mark as Read ──────────────────────────────────────────────────────

/**
 * PATCH /v1/messages/:id/read
 */
export async function markAsRead(id: string): Promise<void> {
  await apiClient.patch(`/messages/${id}/read`);
}

// ── Send Message ──────────────────────────────────────────────────────

export interface SendMessagePayload {
  recipientIds?: string[];
  groupId?: string;
  subject: string;
  body: string;
}

/**
 * POST /v1/messages
 *
 * Soporta recipientIds (array de UUIDs) o groupId (un UUID de grupo).
 */
export async function sendMessage(
  payload: SendMessagePayload,
): Promise<MessageListItem> {
  const { data } = await apiClient.post<{ data: MessageListItem }>(
    '/messages',
    payload,
  );
  return data.data;
}

// ── Reply ─────────────────────────────────────────────────────────────

/**
 * POST /v1/messages/:id/reply
 */
export async function replyToMessage(
  parentId: string,
  body: string,
): Promise<MessageListItem> {
  const { data } = await apiClient.post<{ data: MessageListItem }>(
    `/messages/${parentId}/reply`,
    { body },
  );
  return data.data;
}

// ── Thread ────────────────────────────────────────────────────────────

/**
 * GET /v1/messages/:id/thread
 *
 * Controller: return { data: result.unwrap() }
 * result.unwrap() es un ThreadResponse con { thread?, messages }
 */
export async function getThread(id: string): Promise<ThreadResponse> {
  const { data } = await apiClient.get<{ data: ThreadResponse }>(
    `/messages/${id}/thread`,
  );
  return data.data;
}

// ── Search ────────────────────────────────────────────────────────────

/**
 * GET /v1/messages/search
 *
 * Controller: return result.unwrap() directamente (sin envelope extra).
 */
export async function searchMessages(
  q: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedMessages> {
  const { data } = await apiClient.get<PaginatedMessages>(
    '/messages/search',
    { params: { q, page, pageSize } },
  );
  return data;
}
