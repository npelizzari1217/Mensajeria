/**
 * pinned.ts — API helpers para mensajes fijados en la app mobile.
 *
 * Espeja web/src/api/pinned.ts con adaptación al cliente mobile.
 *
 * ⚠️  NOTA DE PATHS:
 * El controller `PinnedController` tiene @Controller('v1/pinned').
 * El global prefix del API es 'v1'. Ver nota en drafts.ts sobre este patrón.
 *
 * Shapes confirmados leyendo:
 *   - api/src/presentation/pinned/pinned.controller.ts
 *   - web/src/api/pinned.ts
 */
import apiClient from './client';

// ── Types ─────────────────────────────────────────────────────────────

export interface PinnedMessage {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  pinnedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * GET /pinned
 * Retorna todos los mensajes fijados por el usuario autenticado.
 */
export async function listPinned(): Promise<PinnedMessage[]> {
  const { data } = await apiClient.get<{ data: PinnedMessage[] }>('/pinned');
  return data.data;
}

/**
 * POST /pinned/:messageId
 * Fija un mensaje.
 */
export async function pinMessage(messageId: string): Promise<void> {
  await apiClient.post(`/pinned/${messageId}`);
}

/**
 * DELETE /pinned/:messageId
 * Desfija un mensaje.
 */
export async function unpinMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/pinned/${messageId}`);
}
