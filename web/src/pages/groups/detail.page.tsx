import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getGroupDetail,
  deactivateGroup,
  addGroupMember,
  removeGroupMember,
  changeMemberRole,
  type GroupDetailResponse,
  type GroupMemberResponse,
} from '../../api/groups';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../contexts/auth.context';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add member form
  const [showAdd, setShowAdd] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');
  const [adding, setAdding] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGroupDetail(id);
      setGroup(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newMemberId.trim()) return;
    setAdding(true);
    try {
      await addGroupMember(id, newMemberId.trim(), newMemberRole);
      setNewMemberId('');
      setShowAdd(false);
      await fetchGroup();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!id || !confirm('¿Eliminar este miembro del grupo?')) return;
    try {
      await removeGroupMember(id, memberId);
      await fetchGroup();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleToggleRole(member: GroupMemberResponse) {
    if (!id) return;
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      await changeMemberRole(id, member.userId, newRole);
      await fetchGroup();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeactivate() {
    if (!id || !confirm('¿Desactivar este grupo? Los miembros no podran enviar mensajes a traves de el.'))
      return;
    try {
      await deactivateGroup(id);
      navigate('/groups', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const isAdmin = group?.members?.some(
    (m) => m.userId === user?.id && m.role === 'ADMIN',
  );

  if (loading) return <p className="text-muted">Cargando grupo...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!group) return <div className="empty-state"><p>Grupo no encontrado</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{group.name}</h1>
          {group.description && (
            <p className="text-muted">{group.description}</p>
          )}
          <small className="text-muted">
            {group.memberCount} miembro{group.memberCount !== 1 ? 's' : ''} • Creado el{' '}
            {new Date(group.createdAt).toLocaleDateString('es-AR')}
          </small>
        </div>
        <div className="flex gap-1">
          {isAdmin && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDeactivate}
            >
              Desactivar Grupo
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/groups')}
          >
            Volver
          </button>
        </div>
      </div>

      {/* Members section */}
      <div className="card">
        <div className="card-header">
          <h2>Miembros ({group.members.length})</h2>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setShowAdd(!showAdd)}
            >
              {showAdd ? 'Cancelar' : 'Agregar Miembro'}
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Add member form */}
        {showAdd && isAdmin && (
          <form onSubmit={handleAddMember} className="p-1">
            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="memberId">ID de Usuario</label>
                <input
                  id="memberId"
                  type="text"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  placeholder="UUID del usuario"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="memberRole">Rol</label>
                <select
                  id="memberRole"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  <option value="MEMBER">Miembro</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={adding || !newMemberId.trim()}
                >
                  {adding ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Members table */}
        {group.members.length > 0 ? (
          <table className="message-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Ingreso</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {group.members.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.name || m.userId}
                    {m.userId === user?.id && (
                      <span className="badge badge-info"> (vos)</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${m.role === 'ADMIN' ? 'badge-primary' : 'badge-default'}`}
                    >
                      {m.role === 'ADMIN' ? 'Admin' : 'Miembro'}
                    </span>
                  </td>
                  <td>
                    {new Date(m.joinedAt).toLocaleDateString('es-AR')}
                  </td>
                  {isAdmin && m.userId !== user?.id && (
                    <td>
                      <div className="flex gap-05">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleRole(m)}
                          title={
                            m.role === 'ADMIN'
                              ? 'Degradar a Miembro'
                              : 'Ascender a Admin'
                          }
                        >
                          {m.role === 'ADMIN' ? 'Degradar' : 'Ascender'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveMember(m.userId)}
                        >
                          Quitar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted p-1">Sin miembros</p>
        )}
      </div>
    </div>
  );
}
