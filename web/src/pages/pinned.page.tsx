import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listPinned, unpinMessage, type PinnedMessage } from '../api/pinned';
import { getErrorMessage } from '../api/client';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PinnedPage() {
  const [pinned, setPinned] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listPinned();
      setPinned(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleUnpin(messageId: string) {
    try {
      await unpinMessage(messageId);
      setPinned((prev) => prev.filter((p) => p.messageId !== messageId));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <div className="page"><p className="text-muted">Cargando...</p></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mensajes Fijados</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {pinned.length === 0 ? (
        <div className="empty-state">
          <p>No tienes mensajes fijados.</p>
          <p className="text-muted">Usa el boton "Fijar" en un mensaje para agregarlo aqui.</p>
        </div>
      ) : (
        <div className="pinned-list">
          {pinned.map((p) => (
            <div key={p.id} className="pinned-card">
              <div className="pinned-card-header">
                <Link to={`/messages/${p.messageId}`} className="pinned-subject">
                  {p.subject}
                </Link>
                <span className="text-muted">{formatDate(p.pinnedAt)}</span>
              </div>
              <p className="pinned-sender">De: {p.senderName}</p>
              <p className="pinned-body-preview">{p.body}</p>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => handleUnpin(p.messageId)}
              >
                Desfijar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
