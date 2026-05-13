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

type StatusFilter = 'all' | 'unread' | 'read';

// ── Helpers ─────────────────────────────────────────────────────────

function getMyStatus(
  recipients: MessageRecipient[],
  userId?: string,
): string | null {
  if (!userId || recipients.length === 0) return null;
  const me = recipients.find((r) => r.recipientId === userId);
  return me?.status ?? null;
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

// ── Component ───────────────────────────────────────────────────────

export default function InboxPage() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        pageSize,
      };
      if (filter !== 'all') {
        params.status = filter;
      }
      const { data } = await apiClient.get<PaginatedResponse>(
        '/messages/inbox',
        { params },
      );
      setMessages(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'unread', label: 'Nuevos' },
    { key: 'read', label: 'Leidos' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recibidos</h1>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab ${filter === tab.key ? 'tab-active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Loading */}
      {loading && <p className="text-muted">Cargando mensajes...</p>}

      {/* Empty state */}
      {!loading && !error && messages.length === 0 && (
        <div className="empty-state">
          <p>No hay mensajes</p>
        </div>
      )}

      {/* Message list */}
      {!loading && messages.length > 0 && (
        <>
          <table className="message-table">
            <thead>
              <tr>
                <th>Remitente</th>
                <th>Asunto</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => {
                const myStatus = getMyStatus(msg.recipients);
                const isUnread = myStatus !== 'READ';
                return (
                  <tr
                    key={msg.id}
                    className={`msg-row ${isUnread ? 'msg-unread' : ''}`}
                    onClick={() => navigate(`/messages/${msg.id}`)}
                  >
                    <td className="msg-sender">{msg.senderName}</td>
                    <td className="msg-subject">{msg.subject}</td>
                    <td className="msg-date">{formatDate(msg.sentAt)}</td>
                    <td className="msg-status">
                      {isUnread ? (
                        <span className="badge badge-unread">No leido</span>
                      ) : (
                        <span className="badge badge-read">Leido</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
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
