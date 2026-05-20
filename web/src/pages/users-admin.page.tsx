import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../api/client';
import { useAuth } from '../contexts/auth.context';
import { isAdmin, isSupervisor } from '../constants/roles';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Empresa {
  id: string;
  nombre: string;
}

export default function UsersAdminPage() {
  const { user, empresaId: currentEmpresaId } = useAuth();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin(user?.role);
  const userIsSupervisor = isSupervisor(user?.role);

  // Redirect non-admin/non-supervisor users
  useEffect(() => {
    if (user && !userIsAdmin && !userIsSupervisor) {
      navigate('/inbox', { replace: true });
    }
  }, [user, userIsAdmin, userIsSupervisor, navigate]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Usuario');
  const [formEmpresaId, setFormEmpresaId] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/auth/contacts');
      setUsers(data.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load empresas list for ADMIN — used in the new-user form
  useEffect(() => {
    if (userIsAdmin) {
      apiClient
        .get('/empresas')
        .then((r) => setEmpresas(r.data.data ?? []))
        .catch(() => {}); // silent — not critical
    }
  }, [userIsAdmin]);

  function resetForm() {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Usuario');
    setFormEmpresaId('');
    setEditingId(null);
    setShowCreate(false);
  }

  function startEdit(u: UserProfile) {
    setEditingId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormRole(u.role);
    setShowCreate(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    if (!editingId && !formPassword) return;

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await apiClient.patch(`/auth/users/${editingId}`, {
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
        });
      } else {
        const empresaId = userIsAdmin ? formEmpresaId : currentEmpresaId;
        await apiClient.post('/auth/register', {
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          empresaId,
        });
      }
      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Eliminar este usuario permanentemente?')) return;
    try {
      await apiClient.delete(`/auth/users/${userId}`);
      await fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Don't render anything while redirecting
  if (user && !userIsAdmin && !userIsSupervisor) return null;
  if (loading) return <p className="text-muted">Cargando usuarios...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Administrar Usuarios</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowCreate(!showCreate);
          }}
        >
          {showCreate ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <form onSubmit={handleSave} className="card mb-1">
          <h3>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="uname">Nombre</label>
              <input
                id="uname"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="uemail">Email</label>
              <input
                id="uemail"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            {!editingId && (
              <div className="form-group flex-1">
                <label htmlFor="upass">Password</label>
                <input
                  id="upass"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimo 8 caracteres"
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="urole">Rol</label>
              <select
                id="urole"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
              >
                <option value="Usuario">Usuario</option>
                <option value="Tecnico">Tecnico</option>
                <option value="Supervisor">Supervisor</option>
                {userIsAdmin && <option value="Admin">Admin</option>}
              </select>
            </div>
            {!editingId && userIsAdmin && (
              <div className="form-group">
                <label htmlFor="uempresa">Empresa</label>
                <select
                  id="uempresa"
                  value={formEmpresaId}
                  onChange={(e) => setFormEmpresaId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar empresa</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <div className="empty-state">
          <p>No hay usuarios registrados</p>
        </div>
      ) : (
        <table className="message-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${isAdmin(u.role) ? 'badge-primary' : 'badge-default'}`}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
                <td>
                  <div className="flex gap-05">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => startEdit(u)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(u.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
