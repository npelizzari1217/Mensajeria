import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMessages, getErrorMessage, type SearchResult } from '../api/client';

// ── Helpers ─────────────────────────────────────────────────────────

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

type SearchStatus = 'idle' | 'loading' | 'error' | 'success';

// ── Component ───────────────────────────────────────────────────────

export default function SearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(p = page) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    setStatus('loading');
    setError(null);

    try {
      const result = await searchMessages(trimmed, p, pageSize);
      setResults(result.data);
      setTotal(result.total);
      setPage(p);
      setStatus('success');
    } catch (err) {
      setError(getErrorMessage(err));
      setResults([]);
      setStatus('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Buscar Mensajes</h1>
      </div>

      {/* Search input */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscá por palabra clave (mín. 2 caracteres)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={query.trim().length < 2 || status === 'loading'}
          onClick={() => handleSearch(1)}
        >
          {status === 'loading' ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Error */}
      {status === 'error' && <div className="alert alert-error">{error}</div>}

      {/* Loading */}
      {status === 'loading' && <p className="text-muted">Buscando mensajes...</p>}

      {/* Idle — placeholder */}
      {status === 'idle' && (
        <div className="empty-state">
          <p>Ingresá un término de búsqueda para encontrar mensajes.</p>
        </div>
      )}

      {/* Empty results */}
      {status === 'success' && results.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron mensajes para &quot;{query.trim()}&quot;</p>
        </div>
      )}

      {/* Results */}
      {status === 'success' && results.length > 0 && (
        <>
          <p className="search-summary">
            {total} resultado{total !== 1 ? 's' : ''} para &quot;{query.trim()}&quot;
          </p>

          <table className="message-table">
            <thead>
              <tr>
                <th>Remitente</th>
                <th>Asunto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {results.map((msg) => (
                <tr
                  key={msg.id}
                  className="msg-row"
                  onClick={() => navigate(`/messages/${msg.id}`)}
                >
                  <td className="msg-sender">{msg.senderName}</td>
                  <td className="msg-subject">{msg.subject}</td>
                  <td className="msg-date">{formatDate(msg.sentAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              type="button"
              className="btn btn-sm"
              disabled={page <= 1}
              onClick={() => handleSearch(page - 1)}
            >
              Anterior
            </button>
            <span className="page-info">
              Pagina {page} de {totalPages} ({total} resultados)
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={page >= totalPages}
              onClick={() => handleSearch(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
