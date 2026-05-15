/**
 * groups.ts — API helpers para grupos en la app mobile.
 *
 * Espeja web/src/api/groups.ts con adaptación al cliente mobile.
 *
 * ⚠️  NOTA DE PATHS:
 * El controller `GroupsController` tiene @Controller('v1/groups').
 * El global prefix del API es 'v1'. Ver nota en drafts.ts sobre este patrón.
 *
 * Shapes confirmados leyendo:
 *   - api/src/presentation/groups/groups.controller.ts
 *   - web/src/api/groups.ts
 */
import apiClient from './client';

// ── Types ─────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * GET /groups
 * Retorna los grupos del usuario autenticado.
 */
export async function listUserGroups(): Promise<GroupResponse[]> {
  const { data } = await apiClient.get<{ data: GroupResponse[] }>('/groups');
  return data.data;
}

/**
 * GET /groups/:id
 * Retorna el detalle del grupo con lista de miembros.
 */
export async function getGroupDetail(id: string): Promise<GroupDetailResponse> {
  const { data } = await apiClient.get<{ data: GroupDetailResponse }>(
    `/groups/${id}`,
  );
  return data.data;
}

/**
 * POST /groups
 * Crea un nuevo grupo.
 */
export async function createGroup(
  name: string,
  description?: string,
): Promise<GroupResponse> {
  const { data } = await apiClient.post<{ data: GroupResponse }>('/groups', {
    name,
    description,
  });
  return data.data;
}

/**
 * PATCH /groups/:id
 */
export async function updateGroup(
  id: string,
  payload: { name?: string; description?: string },
): Promise<GroupResponse> {
  const { data } = await apiClient.patch<{ data: GroupResponse }>(
    `/groups/${id}`,
    payload,
  );
  return data.data;
}

/**
 * DELETE /groups/:id
 * Desactiva el grupo.
 */
export async function deactivateGroup(id: string): Promise<void> {
  await apiClient.delete(`/groups/${id}`);
}

/**
 * POST /groups/:groupId/members
 * Agrega un miembro al grupo.
 */
export async function addMember(
  groupId: string,
  userId: string,
  role?: string,
): Promise<GroupMemberResponse> {
  const { data } = await apiClient.post<{ data: GroupMemberResponse }>(
    `/groups/${groupId}/members`,
    { userId, role },
  );
  return data.data;
}

/**
 * DELETE /groups/:groupId/members/:userId
 * Remueve un miembro del grupo.
 */
export async function removeMember(
  groupId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`);
}

/**
 * PATCH /groups/:groupId/members/:userId
 * Cambia el rol de un miembro.
 */
export async function changeMemberRole(
  groupId: string,
  userId: string,
  role: string,
): Promise<GroupMemberResponse> {
  const { data } = await apiClient.patch<{ data: GroupMemberResponse }>(
    `/groups/${groupId}/members/${userId}`,
    { role },
  );
  return data.data;
}
