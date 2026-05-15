import apiClient from './client';

// ── Types ───────────────────────────────────────────────────────────

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

// ── API Helpers ──────────────────────────────────────────────────────

export async function saveDraft(payload: {
  subject?: string;
  body: string;
  recipientIds?: string[];
  groupId?: string;
}): Promise<DraftResponse> {
  const { data } = await apiClient.post('/drafts', payload);
  return data.data;
}

export async function listDrafts(): Promise<DraftResponse[]> {
  const { data } = await apiClient.get('/drafts');
  return data.data;
}

export async function getDraft(id: string): Promise<DraftResponse> {
  const { data } = await apiClient.get(`/drafts/${id}`);
  return data.data;
}

export async function updateDraft(
  id: string,
  payload: {
    subject?: string | null;
    body?: string;
    recipientIds?: string[];
    groupId?: string | null;
  },
): Promise<DraftResponse> {
  const { data } = await apiClient.patch(`/drafts/${id}`, payload);
  return data.data;
}

export async function sendDraft(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`/drafts/${id}/send`);
  return data.data;
}

export async function deleteDraft(id: string): Promise<void> {
  await apiClient.delete(`/drafts/${id}`);
}
