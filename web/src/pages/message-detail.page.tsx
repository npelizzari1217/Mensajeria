import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../api/client';

// ── Types ───────────────────────────────────────────────────────────

interface MessageRecipient {
  recipientId: string;
  recipientName: string;
  status: string;
  readAt: string | null;
}

interface MessageDetail {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  parentMessageId: string | null;
  sentAt: string;
  createdAt: string;
  recipients: MessageRecipient[];
}

interface ThreadResponse {
  thread?: {
    id: string;
    subject: string;
    messageCount: number;
  };
  messages: MessageDetail[];
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

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [thread, setThread] = useState<MessageDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [showReply, setShowReply] = useState(false);

  // Fetch message detail
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: detailData } = await apiClient.get<{ data: MessageDetail }>(
          `/messages/${id}`,
        );
        if (cancelled) return;
        const msg = detailData.data;
        setMessage(msg);

        // Auto mark as read if user is a recipient and status is not READ
        const isRecipient = msg.recipients.length > 0;
        if (isRecipient) {
          try {
            await apiClient.patch(`/messages/${id}/read`);
          } catch {
            // Silently ignore — marking read is best-effort
          }
        }

        // Load thread
        const { data: threadData } = await apiClient.get<{ data: ThreadResponse }>(
          `/messages/${id}/thread`,
        );
        if (cancelled) return;
        setThread(threadData.data.messages ?? []);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Handle reply
  async function handleReply() {
    if (!id || !replyBody.trim()) return;

    setReplyLoading(true);
    try {
      await apiClient.post(`/messages/${id}/reply`, { body: replyBody.trim() });
      setReplyBody('');
      setShowReply(false);
      // Reload thread to show new reply
      const { data } = await apiClient.get<{ data: ThreadResponse }>(
        `/messages/${id}/thread`,
      );
      setThread(data.data.messages ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReplyLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page">
        <p className="text-muted">Cargando mensaje...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="page">
        <p>Mensaje no encontrado</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>

      {/* Message header */}
      <div className="message-detail-header">
        <h2>{message.subject}</h2>
        <div className="detail-meta">
          <div className="meta-row">
            <span className="meta-label">De:</span>
            <span className="meta-value">{message.senderName}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Para:</span>
            <span className="meta-value">
              {message.recipients
                .map((r) => r.recipientName || r.recipientId)
                .join(', ')}
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Fecha:</span>
            <span className="meta-value">{formatDate(message.sentAt)}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Estado:</span>
            <span className="meta-value">
              {message.recipients.some((r) => r.status === 'READ')
                ? 'Leido'
                : 'No leido'}
            </span>
          </div>
        </div>
      </div>

      {/* Message body */}
      <div className="message-body">
        {message.body.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      {/* Reply button */}
      {!showReply && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowReply(true)}
        >
          Responder
        </button>
      )}

      {/* Reply form */}
      {showReply && (
        <div className="reply-section">
          <h3>Responder</h3>
          <textarea
            rows={4}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Escribe tu respuesta..."
          />
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReply}
              disabled={replyLoading || !replyBody.trim()}
            >
              {replyLoading ? 'Enviando...' : 'Enviar respuesta'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowReply(false);
                setReplyBody('');
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Thread (conversation history) */}
      {thread.length > 0 && (
        <div className="thread-section">
          <h3>Conversacion ({thread.length} mensajes)</h3>
          {thread
            .filter((m) => m.id !== message.id)
            .map((m) => (
              <div key={m.id} className="thread-message">
                <div className="thread-meta">
                  <strong>{m.senderName}</strong>
                  <span className="text-muted">{formatDate(m.sentAt)}</span>
                </div>
                <div className="thread-body">
                  {m.body.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
