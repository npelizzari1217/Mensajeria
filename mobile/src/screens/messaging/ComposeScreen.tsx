/**
 * ComposeScreen — Fase 7, T7.3
 *
 * Form para redactar y enviar un mensaje nuevo:
 *   - recipientIds: input de texto con UUIDs separados por coma
 *     (TODO F9+: reemplazar por un selector de usuarios con búsqueda)
 *   - subject: asunto del mensaje
 *   - body: cuerpo del mensaje
 *
 * Validación:
 *   - Al menos un destinatario válido (no vacío)
 *   - Asunto requerido (mínimo 3 chars)
 *   - Cuerpo requerido
 *
 * En éxito: navega a Sent (en MoreStack) o simplemente vuelve atrás.
 * Botón "Guardar borrador": llama saveDraft y navega a Drafts en éxito.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendMessage } from '../../api/messages';
import { saveDraft } from '../../api/drafts';
import { getErrorMessage } from '../../api/client';

// Compose is a tab-level screen — broad nav type for cross-tab jumps.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Nav = any;

export default function ComposeScreen() {
  const navigation = useNavigation<Nav>();

  const [recipientsText, setRecipientsText] = useState('');
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

  function parseRecipients(): string[] {
    return recipientsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    const ids = parseRecipients();

    if (ids.length === 0) {
      errors.recipients = 'Debés especificar al menos un destinatario';
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
    const ids = parseRecipients();
    const bodyTrimmed = body.trim();

    if (!bodyTrimmed) {
      setError('El cuerpo del mensaje es requerido para guardar un borrador.');
      return;
    }

    setSavingDraft(true);
    setError(null);

    try {
      await saveDraft({
        subject: subject.trim() || undefined,
        body: bodyTrimmed,
        recipientIds: ids,
      });

      Alert.alert(
        'Borrador guardado',
        'Tu borrador fue guardado correctamente.',
        [
          {
            text: 'Ver borradores',
            onPress: () => {
              navigation.navigate('More', {
                screen: 'Drafts',
              });
            },
          },
          {
            text: 'Continuar editando',
            style: 'cancel',
          },
        ],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSend() {
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      await sendMessage({
        recipientIds: parseRecipients(),
        subject: subject.trim(),
        body: body.trim(),
      });

      Alert.alert(
        'Mensaje enviado',
        'Tu mensaje fue enviado correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => {
              // Limpiar form
              setRecipientsText('');
              setSubject('');
              setBody('');
              // Volver o ir a Sent
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error de backend */}
        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        {/* Destinatarios */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Destinatarios{' '}
            <Text style={styles.labelHint}>(UUIDs separados por coma)</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              fieldErrors.recipients ? styles.inputError : null,
            ]}
            value={recipientsText}
            onChangeText={setRecipientsText}
            placeholder="uuid1, uuid2, ..."
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            multiline
            numberOfLines={2}
          />
          {/* TODO F9+: Reemplazar por selector con búsqueda de usuarios por nombre/email */}
          {fieldErrors.recipients ? (
            <Text style={styles.fieldError}>{fieldErrors.recipients}</Text>
          ) : null}
        </View>

        {/* Asunto */}
        <View style={styles.field}>
          <Text style={styles.label}>Asunto</Text>
          <TextInput
            style={[
              styles.input,
              fieldErrors.subject ? styles.inputError : null,
            ]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Asunto del mensaje"
            editable={!loading}
            returnKeyType="next"
          />
          {fieldErrors.subject ? (
            <Text style={styles.fieldError}>{fieldErrors.subject}</Text>
          ) : null}
        </View>

        {/* Cuerpo */}
        <View style={styles.field}>
          <Text style={styles.label}>Mensaje</Text>
          <TextInput
            style={[
              styles.textarea,
              fieldErrors.body ? styles.inputError : null,
            ]}
            value={body}
            onChangeText={setBody}
            placeholder="Escribí tu mensaje acá..."
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            editable={!loading}
          />
          {fieldErrors.body ? (
            <Text style={styles.fieldError}>{fieldErrors.body}</Text>
          ) : null}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={() => { void handleSend(); }}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Enviar mensaje</Text>
            )}
          </TouchableOpacity>

          {/* Guardar borrador */}
          <TouchableOpacity
            style={[
              styles.btnSecondary,
              (loading || savingDraft) && styles.btnDisabled,
            ]}
            onPress={() => { void handleSaveDraft(); }}
            disabled={loading || savingDraft}
            activeOpacity={0.8}
          >
            {savingDraft ? (
              <ActivityIndicator color="#6b7280" size="small" />
            ) : (
              <Text style={styles.btnSecondaryText}>Guardar borrador</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            disabled={loading}
          >
            <Text style={styles.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  alert: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  labelHint: {
    fontWeight: '400',
    color: '#9ca3af',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: '#ffffff',
    color: '#111827',
    minHeight: 160,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  btnSecondaryText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
