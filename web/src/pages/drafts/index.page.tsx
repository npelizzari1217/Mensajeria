import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listDrafts, deleteDraft, type DraftResponse } from '../../api/drafts';
import { getErrorMessage } from '../../api/client';

/**
 * DraftsListPage — list of saved drafts with actions.
 */
export default function DraftsListPage() {
  const [drafts, setDrafts] = useState<DraftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDrafts() {
    setLoading(true);
    setError(null);
    try {
      const data = await listDrafts();
      setDrafts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este borrador?')) return;
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleSend(id: string) {
    try {
      const { sendDraft } = await import('../../api/drafts');
      await sendDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Borradores</h1>
        </div>
        <p className="text-muted">Cargando borradores...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Borradores</h1>
        <Link to="/compose" className="btn btn-primary">
          Nuevo Mensaje
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {drafts.length === 0 ? (
        <div className="empty-state">
          <p>No tienes borradores guardados.</p>
          <Link to="/compose" className="btn btn-primary">
            Redactar mensaje
          </Link>
        </div>
      ) : (
        <div className="draft-list">
          {drafts.map((draft) => (
            <div key={draft.id} className="draft-card">
              <div className="draft-card-header">
                <strong>{draft.subject || '(Sin asunto)'}</strong>
                <span className="text-muted draft-date">
                  {formatDate(draft.updatedAt)}
                </span>
              </div>
              <p className="draft-body-preview">
                {draft.body.length > 120
                  ? draft.body.slice(0, 120) + '...'
                  : draft.body}
              </p>
              <div className="draft-meta">
                {draft.recipientIds.length > 0 && (
                  <span className="badge">
                    {draft.recipientIds.length} destinatario{draft.recipientIds.length !== 1 ? 's' : ''}
                  </span>
                )}
                {draft.groupId && <span className="badge">Grupo</span>}
              </div>
              <div className="draft-actions">
                <Link
                  to={`/drafts/${draft.id}`}
                  className="btn btn-sm btn-secondary"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleSend(draft.id)}
                  disabled={draft.recipientIds.length === 0 && !draft.groupId}
                  title={
                    draft.recipientIds.length === 0 && !draft.groupId
                      ? 'Agrega destinatarios antes de enviar'
                      : 'Enviar mensaje'
                  }
                >
                  Enviar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(draft.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
