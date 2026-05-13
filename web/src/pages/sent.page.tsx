import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../api/client';

// ── Types ───────────────────────────────────────────────────────────

interface MessageRecipient {
  recipientId: string;
  recipientName: string;
  status: string;
  readAt: string | null;
}

interface MessageListItem {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  sentAt: string;
  createdAt: string;
  recipients: MessageRecipient[];
}

interface PaginatedResponse {
  data: MessageListItem[];
  total: number;
  page: number;
  pageSize: number;
}

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

// ── Component ───────────────────────────────────────────────────────

export default function SentPage() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<PaginatedResponse>(
        '/messages/sent',
        { params: { page, pageSize } },
      );
      setMessages(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchSent();
  }, [fetchSent]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Enviados</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && <p className="text-muted">Cargando mensajes...</p>}

      {!loading && !error && messages.length === 0 && (
        <div className="empty-state">
          <p>No hay mensajes enviados</p>
        </div>
      )}

      {!loading && messages.length > 0 && (
        <>
          <table className="message-table">
            <thead>
              <tr>
                <th>Destinatario(s)</th>
                <th>Asunto</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr
                  key={msg.id}
                  className="msg-row"
                  onClick={() => navigate(`/messages/${msg.id}`)}
                >
                  <td className="msg-sender">
                    {msg.recipients
                      .map((r) => r.recipientName || r.recipientId.slice(0, 8))
                      .join(', ')}
                  </td>
                  <td className="msg-subject">{msg.subject}</td>
                  <td className="msg-date">{formatDate(msg.sentAt)}</td>
                  <td className="msg-status">
                    {msg.recipients.every((r) => r.status === 'READ') ? (
                      <span className="badge badge-read">Leido</span>
                    ) : (
                      <span className="badge badge-pending">Enviado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              type="button"
              className="btn btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="page-info">
              Pagina {page} de {totalPages} ({total} mensajes)
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
