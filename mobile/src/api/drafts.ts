/**
 * drafts.ts — API helpers para borradores en la app mobile.
 *
 * Espeja web/src/api/drafts.ts con adaptación al cliente mobile.
 *
 * ⚠️  NOTA DE PATHS:
 * El controller `DraftsController` tiene @Controller('v1/drafts').
 * El global prefix del API es 'v1'.
 * Esto genera el path /v1/v1/drafts en NestJS.
 * Sin embargo, el web (baseURL '/v1') llama a '/drafts' y funciona via proxy.
 * Para consistencia con el web, usamos los mismos paths relativos ('/drafts').
 * Si en producción hay discrepancia, revisar el controller y ajustar el path.
 *
 * Shapes confirmados leyendo:
 *   - api/src/presentation/drafts/drafts.controller.ts
 *   - web/src/api/drafts.ts
 */
import apiClient from './client';

// ── Types ─────────────────────────────────────────────────────────────

export interface DraftResponse {
  id: string;
  userId: string;
  subject: string | null;
  body: string;
  recipientIds: string[];
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDraftPayload {
  subject?: string;
  body: string;
  recipientIds?: string[];
  groupId?: string;
}

export interface UpdateDraftPayload {
  subject?: string | null;
  body?: string;
  recipientIds?: string[];
  groupId?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * GET /drafts
 * Retorna todos los borradores del usuario autenticado.
 */
export async function listDrafts(): Promise<DraftResponse[]> {
  const { data } = await apiClient.get<{ data: DraftResponse[] }>('/drafts');
  return data.data;
}

/**
 * GET /drafts/:id
 */
export async function getDraft(id: string): Promise<DraftResponse> {
  const { data } = await apiClient.get<{ data: DraftResponse }>(`/drafts/${id}`);
  return data.data;
}

/**
 * POST /drafts
 * Crea un nuevo borrador.
 */
export async function saveDraft(
  payload: SaveDraftPayload,
): Promise<DraftResponse> {
  const { data } = await apiClient.post<{ data: DraftResponse }>(
    '/drafts',
    payload,
  );
  return data.data;
}

/**
 * PATCH /drafts/:id
 * Actualiza un borrador existente.
 */
export async function updateDraft(
  id: string,
  payload: UpdateDraftPayload,
): Promise<DraftResponse> {
  const { data } = await apiClient.patch<{ data: DraftResponse }>(
    `/drafts/${id}`,
    payload,
  );
  return data.data;
}

/**
 * POST /drafts/:id/send
 * Envía el borrador como mensaje.
 */
export async function sendDraft(id: string): Promise<unknown> {
  const { data } = await apiClient.post<{ data: unknown }>(
    `/drafts/${id}/send`,
  );
  return data.data;
}

/**
 * DELETE /drafts/:id
 * Elimina el borrador (sin retorno de body).
 */
export async function deleteDraft(id: string): Promise<void> {
  await apiClient.delete(`/drafts/${id}`);
}
