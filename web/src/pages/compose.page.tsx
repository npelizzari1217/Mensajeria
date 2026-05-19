import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../api/client';
import { listGroups, type GroupResponse } from '../api/groups';
import { saveDraft } from '../api/drafts';

interface Contact {
  id: string;
  email: string;
  name: string;
}

export default function ComposePage() {
  const navigate = useNavigate();

  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    recipients?: string;
    subject?: string;
    body?: string;
  }>({});

  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    listGroups()
      .then(setGroups)
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiClient
      .get('/auth/contacts')
      .then(({ data }) => setContacts(data.data ?? []))
      .catch(() => {});
  }, []);

  function addRecipient() {
    if (!selectedContact) return;
    if (recipientEmails.includes(selectedContact)) return;
    setRecipientEmails([...recipientEmails, selectedContact]);
    setSelectedContact('');
    if (selectedGroupId) setSelectedGroupId('');
  }

  function removeRecipient(email: string) {
    setRecipientEmails(recipientEmails.filter((e) => e !== email));
  }

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    const hasGroup = selectedGroupId !== '';
    const hasRecipients = recipientEmails.length > 0;

    if (!hasGroup && !hasRecipients) {
      errors.recipients = 'Debes agregar al menos un destinatario o seleccionar un grupo';
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

  async function handleSaveDraft() {
    setSavingDraft(true);
    setError(null);

    try {
      await saveDraft({
        subject: subject.trim() || undefined,
        body: body.trim(),
        recipientEmails: recipientEmails.length > 0 ? recipientEmails : undefined,
        groupId: selectedGroupId || undefined,
      });
      navigate('/drafts', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingDraft(false);
    }
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
        payload.recipientEmails = recipientEmails;
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
                  setRecipientEmails([]);
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

        {/* Contact selector + add button */}
        {!selectedGroupId && (
          <div className="form-group">
            <label htmlFor="contactSelect">
              Destinatarios
              {groups.length > 0 && ' — o usa el grupo de arriba'}
            </label>
            <div className="recipient-selector">
              <select
                id="contactSelect"
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                className={fieldErrors.recipients ? 'input-error' : ''}
              >
                <option value="">-- Seleccionar contacto --</option>
                {contacts
                  .filter((c) => !recipientEmails.includes(c.email))
                  .map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.name} ({c.email})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addRecipient}
                disabled={!selectedContact}
              >
                Agregar
              </button>
            </div>

            {/* Recipient list */}
            {recipientEmails.length > 0 && (
              <ul className="recipient-list">
                {recipientEmails.map((email) => {
                  const contact = contacts.find((c) => c.email === email);
                  return (
                    <li key={email} className="recipient-tag">
                      <span>{contact ? `${contact.name} (${email})` : email}</span>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeRecipient(email)}
                        title="Quitar destinatario"
                      >
                        &times;
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {fieldErrors.recipients && (
              <span className="field-error">{fieldErrors.recipients}</span>
            )}
          </div>
        )}

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
            disabled={savingDraft || !body.trim()}
            onClick={handleSaveDraft}
          >
            {savingDraft ? 'Guardando...' : 'Guardar Borrador'}
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
