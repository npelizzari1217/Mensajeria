import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import { getErrorMessage, getEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from '../api/client';

interface EmpresaProfile {
  id: string;
  nombre: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmpresasAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState<EmpresaProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formNombre, setFormNombre] = useState('');
  const [saving, setSaving] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/inbox', { replace: true });
    }
  }, [user, navigate]);

  const fetchEmpresas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmpresas();
      setEmpresas(data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  function resetForm() {
    setFormNombre('');
    setEditingId(null);
    setShowCreate(false);
  }

  function startEdit(e: EmpresaProfile) {
    setEditingId(e.id);
    setFormNombre(e.nombre);
    setShowCreate(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formNombre.trim()) return;

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updateEmpresa(editingId, formNombre.trim());
      } else {
        await createEmpresa(formNombre.trim());
      }
      resetForm();
      await fetchEmpresas();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(empresaId: string) {
    if (!confirm('Eliminar esta empresa permanentemente?')) return;
    try {
      await deleteEmpresa(empresaId);
      await fetchEmpresas();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Don't render anything while redirecting
  if (user && user.role !== 'ADMIN') return null;
  if (loading) return <p className="text-muted">Cargando empresas...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Administrar Empresas</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowCreate(!showCreate);
          }}
        >
          {showCreate ? 'Cancelar' : 'Nueva Empresa'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <form onSubmit={handleSave} className="card mb-1">
          <h3>{editingId ? 'Editar Empresa' : 'Nueva Empresa'}</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="enombre">Nombre</label>
              <input
                id="enombre"
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Nombre de la empresa"
                required
              />
            </div>
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

      {empresas.length === 0 ? (
        <div className="empty-state">
          <p>No hay empresas registradas</p>
        </div>
      ) : (
        <table className="message-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id}>
                <td>{e.nombre}</td>
                <td>{new Date(e.createdAt).toLocaleDateString('es-AR')}</td>
                <td>
                  <div className="flex gap-05">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => startEdit(e)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(e.id)}
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
