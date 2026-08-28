import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import {
  getErrorMessage,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type RoleData,
} from '../api/client';
import { isAdmin } from '../constants/roles';

export default function RolesAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin(user.roleId ?? user.role)) {
      navigate('/inbox', { replace: true });
    }
  }, [user, navigate]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoles();
      setRoles(data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  function resetForm() {
    setFormName('');
    setFormDescription('');
    setEditingId(null);
    setShowCreate(false);
  }

  function startEdit(r: RoleData) {
    setEditingId(r.id);
    setFormName(r.name);
    setFormDescription(r.description ?? '');
    setShowCreate(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      if (editingId !== null) {
        await updateRole(editingId, formName.trim(), formDescription.trim() || undefined);
      } else {
        await createRole(formName.trim(), formDescription.trim() || undefined);
      }
      resetForm();
      await fetchRoles();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(roleId: number) {
    if (!confirm('¿Eliminar este rol permanentemente?\n\nSi hay usuarios con este rol, la operación fallará.')) return;
    try {
      await deleteRole(roleId);
      await fetchRoles();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Don't render anything while redirecting
  if (user && !isAdmin(user.roleId ?? user.role)) return null;
  if (loading) return <p className="text-muted">Cargando roles...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Administrar Roles</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowCreate(!showCreate);
          }}
        >
          {showCreate ? 'Cancelar' : 'Nuevo Rol'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <form onSubmit={handleSave} className="card mb-1">
          <h3>{editingId !== null ? 'Editar Rol' : 'Nuevo Rol'}</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="rname">Nombre</label>
              <input
                id="rname"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre del rol"
                required
              />
            </div>
            <div className="form-group flex-2">
              <label htmlFor="rdesc">Descripción</label>
              <input
                id="rdesc"
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripción del rol (opcional)"
              />
            </div>
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : editingId !== null ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      )}

      {roles.length === 0 ? (
        <div className="empty-state">
          <p>No hay roles registrados</p>
        </div>
      ) : (
        <table className="message-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.description || <span className="text-muted">—</span>}</td>
                <td>
                  <div className="flex gap-05">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => startEdit(r)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(r.id)}
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
