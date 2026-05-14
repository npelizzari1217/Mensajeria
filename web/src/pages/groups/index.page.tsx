import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listGroups, createGroup, type GroupResponse } from '../../api/groups';
import { getErrorMessage } from '../../api/client';

export default function GroupsListPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGroups();
      setGroups(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createGroup(newName.trim(), newDesc.trim() || undefined);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      await fetchGroups();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Grupos</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancelar' : 'Nuevo Grupo'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-1">
          <div className="form-group">
            <label htmlFor="groupName">Nombre del grupo</label>
            <input
              id="groupName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Backend Team"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="groupDesc">Descripcion (opcional)</label>
            <input
              id="groupDesc"
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Ej: Equipo de desarrollo backend"
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !newName.trim()}
            >
              {creating ? 'Creando...' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && <p className="text-muted">Cargando grupos...</p>}

      {/* Empty */}
      {!loading && !error && groups.length === 0 && (
        <div className="empty-state">
          <p>No sos miembro de ningun grupo</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            Crear primer grupo
          </button>
        </div>
      )}

      {/* List */}
      {!loading && groups.length > 0 && (
        <div className="group-list">
          {groups.map((g) => (
            <div
              key={g.id}
              className="card group-card"
              onClick={() => navigate(`/groups/${g.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="group-card-header">
                <h3>{g.name}</h3>
                <span className="badge badge-info">
                  {g.memberCount} miembro{g.memberCount !== 1 ? 's' : ''}
                </span>
              </div>
              {g.description && (
                <p className="text-muted">{g.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
