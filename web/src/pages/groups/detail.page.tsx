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
import apiClient, { getErrorMessage } from '../../api/client';
import { useAuth } from '../../contexts/auth.context';

interface Contact {
  id: string;
  email: string;
  name: string;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    apiClient
      .get('/auth/contacts')
      .then(({ data }) => setContacts(data.data ?? []))
      .catch(() => {});
  }, []);

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
    if (!id || !selectedContact) return;
    setAdding(true);
    try {
      await addGroupMember(id, selectedContact, newMemberRole);
      setSelectedContact('');
      await fetchGroup();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(memberEmail: string) {
    if (!id || !confirm('Eliminar este miembro del grupo?')) return;
    try {
      await removeGroupMember(id, memberEmail);
      await fetchGroup();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleToggleRole(member: GroupMemberResponse) {
    if (!id) return;
    const contactByUserId = contacts.find((c) => c.id === member.userId);
    if (!contactByUserId) return;
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      await changeMemberRole(id, contactByUserId.email, newRole);
      await fetchGroup();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeactivate() {
    if (!id || !confirm('Desactivar este grupo? Los miembros no podran enviar mensajes a traves de el.'))
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

  const memberIds = group.members.map((m) => m.userId);
  const availableContacts = contacts.filter((c) => !memberIds.includes(c.id));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{group.name}</h1>
          {group.description && (
            <p className="text-muted">{group.description}</p>
          )}
          <small className="text-muted">
            {group.memberCount} miembro{group.memberCount !== 1 ? 's' : ''} - Creado el{' '}
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

      <div className="card">
        <div className="card-header">
          <h2>Miembros ({group.members.length})</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {isAdmin && (
          <form onSubmit={handleAddMember} className="p-1">
            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="contactSelect">Contacto</label>
                <select
                  id="contactSelect"
                  value={selectedContact}
                  onChange={(e) => setSelectedContact(e.target.value)}
                >
                  <option value="">-- Seleccionar contacto --</option>
                  {availableContacts.map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="memberRoleSelect">Rol</label>
                <select
                  id="memberRoleSelect"
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
                  disabled={adding || !selectedContact}
                >
                  {adding ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </form>
        )}

        {group.members.length > 0 ? (
          <table className="message-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Ingreso</th>
                <th>Acciones</th>
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
                  <td>
                    <div className="flex gap-05">
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleRole(m)}
                        >
                          {m.role === 'ADMIN' ? 'Degradar' : 'Ascender'}
                        </button>
                      )}
                      {isAdmin && m.userId !== user?.id && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            const c = contacts.find((ct) => ct.id === m.userId);
                            if (c) handleRemoveMember(c.email);
                          }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </td>
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
