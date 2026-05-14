import apiClient from './client';

// ── Types ───────────────────────────────────────────────────────────

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMemberResponse {
  id: string;
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

export interface GroupDetailResponse extends GroupResponse {
  members: GroupMemberResponse[];
}

// ── API Helpers ──────────────────────────────────────────────────────

export async function createGroup(
  name: string,
  description?: string,
): Promise<GroupResponse> {
  const { data } = await apiClient.post('/groups', { name, description });
  return data.data;
}

export async function listGroups(): Promise<GroupResponse[]> {
  const { data } = await apiClient.get('/groups');
  return data.data;
}

export async function getGroupDetail(id: string): Promise<GroupDetailResponse> {
  const { data } = await apiClient.get(`/groups/${id}`);
  return data.data;
}

export async function updateGroup(
  id: string,
  payload: { name?: string; description?: string },
): Promise<GroupResponse> {
  const { data } = await apiClient.patch(`/groups/${id}`, payload);
  return data.data;
}

export async function deactivateGroup(id: string): Promise<void> {
  await apiClient.delete(`/groups/${id}`);
}

export async function addGroupMember(
  groupId: string,
  userId: string,
  role?: string,
): Promise<GroupMemberResponse> {
  const { data } = await apiClient.post(`/groups/${groupId}/members`, {
    userId,
    role,
  });
  return data.data;
}

export async function removeGroupMember(
  groupId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`);
}

export async function changeMemberRole(
  groupId: string,
  userId: string,
  role: string,
): Promise<GroupMemberResponse> {
  const { data } = await apiClient.patch(
    `/groups/${groupId}/members/${userId}`,
    { role },
  );
  return data.data;
}
