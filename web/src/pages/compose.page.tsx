import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../api/client';
import { listGroups, type GroupResponse } from '../api/groups';

/**
 * ComposePage — form to send a new message.
 *
 * Supports multiple recipients via comma-separated UUIDs in a textarea,
 * OR selecting a group to send to all its members.
 * On success → redirects to /sent.
 */
export default function ComposePage() {
  const navigate = useNavigate();

  const [recipientIdsText, setRecipientIdsText] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    recipientIds?: string;
    subject?: string;
    body?: string;
  }>({});

  const [groups, setGroups] = useState<GroupResponse[]>([]);

  // Fetch groups for the selector
  useEffect(() => {
    listGroups()
      .then(setGroups)
      .catch(() => {}); // Silently fail — groups are optional
  }, []);

  /**
   * Parses the comma-separated recipient IDs textarea value
   * into an array of trimmed non-empty strings.
   */
  function parseRecipientIds(): string[] {
    return recipientIdsText
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    const ids = parseRecipientIds();
    const hasGroup = selectedGroupId !== '';
    const hasManualIds = ids.length > 0;

    if (!hasGroup && !hasManualIds) {
      errors.recipientIds = 'Debes especificar destinatarios o seleccionar un grupo';
    }
    if (!subject.trim()) {
      errors.subject = 'El asunto es requerido';
    } else if (subject.trim().length < 3) {
      errors.subject = 'El asunto debe tener al menos 3 caracteres';
    }
    if (!body.trim()) {
      errors.body = 'El cuerpo del mensaje es requerido';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        subject: subject.trim(),
        body: body.trim(),
      };

      if (selectedGroupId) {
        payload.groupId = selectedGroupId;
      } else {
        payload.recipientIds = parseRecipientIds();
      }

      await apiClient.post('/messages', payload);
      navigate('/sent', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Nuevo Mensaje</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="compose-form">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Group selector */}
        {groups.length > 0 && (
          <div className="form-group">
            <label htmlFor="groupId">Enviar a grupo (opcional)</label>
            <select
              id="groupId"
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                if (e.target.value) {
                  setRecipientIdsText('');
                }
              }}
            >
              <option value="">-- Seleccionar grupo --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.memberCount} miembro{g.memberCount !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
            {selectedGroup && (
              <small className="text-muted">
                El mensaje se enviara a los {selectedGroup.memberCount} miembros del grupo
              </small>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="recipientIds">
            Destinatarios manuales (IDs separados por coma)
            {groups.length > 0 && ' — o usa el grupo de arriba'}
          </label>
          <textarea
            id="recipientIds"
            rows={3}
            value={recipientIdsText}
            onChange={(e) => {
              setRecipientIdsText(e.target.value);
              if (e.target.value) {
                setSelectedGroupId('');
              }
            }}
            className={fieldErrors.recipientIds ? 'input-error' : ''}
            placeholder="UUIDs de los destinatarios, separados por coma"
            disabled={!!selectedGroupId}
          />
          {fieldErrors.recipientIds && (
            <span className="field-error">{fieldErrors.recipientIds}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="subject">Asunto</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={fieldErrors.subject ? 'input-error' : ''}
            placeholder="Asunto del mensaje"
          />
          {fieldErrors.subject && (
            <span className="field-error">{fieldErrors.subject}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="body">Mensaje</label>
          <textarea
            id="body"
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={fieldErrors.body ? 'input-error' : ''}
            placeholder="Escribe tu mensaje aqui..."
          />
          {fieldErrors.body && (
            <span className="field-error">{fieldErrors.body}</span>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
