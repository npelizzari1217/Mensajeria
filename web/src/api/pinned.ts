import apiClient from '../api/client';

export interface PinnedMessage {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  pinnedAt: string;
}

export async function listPinned(): Promise<PinnedMessage[]> {
  const { data } = await apiClient.get('/pinned');
  return data.data;
}

export async function pinMessage(messageId: string): Promise<void> {
  await apiClient.post(`/pinned/${messageId}`);
}

export async function unpinMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/pinned/${messageId}`);
}
