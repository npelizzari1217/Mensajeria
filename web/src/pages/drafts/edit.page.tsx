import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDraft, updateDraft, saveDraft } from '../../api/drafts';
import { getErrorMessage } from '../../api/client';

/**
 * DraftEditPage — edit or continue composing a draft.
 */
export default function DraftEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientIdsText, setRecipientIdsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getDraft(id)
      .then((draft) => {
        setSubject(draft.subject ?? '');
        setBody(draft.body);
        setRecipientIdsText(draft.recipientIds.join(', '));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      const recipientIds = recipientIdsText
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      await updateDraft(id, {
        subject: subject.trim() || null,
        body: body.trim(),
        recipientIds,
      });
      navigate('/drafts', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="text-muted">Cargando borrador...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Editar Borrador</h1>
      </div>

      <form onSubmit={handleSave} noValidate className="compose-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="recipientIds">Destinatarios (IDs separados por coma)</label>
          <textarea
            id="recipientIds"
            rows={2}
            value={recipientIdsText}
            onChange={(e) => setRecipientIdsText(e.target.value)}
            placeholder="UUIDs de los destinatarios"
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">Asunto</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del mensaje"
          />
        </div>

        <div className="form-group">
          <label htmlFor="body">Mensaje</label>
          <textarea
            id="body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe tu mensaje aqui..."
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/drafts')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
