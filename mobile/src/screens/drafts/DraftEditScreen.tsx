/**
 * DraftEditScreen — Fase 9, T9.2
 *
 * Modos:
 *   - Modo edición: recibe `id` via route.params → carga getDraft(id)
 *   - Modo nuevo: sin `id` → form en blanco (puede recibir initialContent)
 *
 * Botones:
 *   - "Guardar" → updateDraft(id, ...) o saveDraft(...) si es nuevo
 *   - "Enviar"  → sendDraft(id) después de guardar si es necesario
 *   - "Descartar" → deleteDraft(id) con confirmación, luego goBack()
 *
 * Los campos son: destinatarios (UUIDs separados por coma), asunto, cuerpo.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/types';
import {
  getDraft,
  saveDraft,
  updateDraft,
  sendDraft,
  deleteDraft,
  type DraftResponse,
} from '../../api/drafts';
import { getErrorMessage } from '../../api/client';
import { LoadingScreen } from '../../components/LoadingScreen';

// ── Types ─────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<MoreStackParamList, 'DraftEdit'>;
type Route = RouteProp<MoreStackParamList, 'DraftEdit'>;

// ── Component ─────────────────────────────────────────────────────────

export default function DraftEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const draftId = route.params?.id ?? null;
  const isNew = draftId == null;

  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(!isNew);

  // Form fields
  const [recipientsText, setRecipientsText] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Button states
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Error / feedback
  const [error, setError] = useState<string | null>(null);

  // ── Load draft (modo edición) ──────────────────────────────────────

  const loadDraft = useCallback(async () => {
    if (isNew || !draftId) return;
    setLoadingDraft(true);
    setError(null);
    try {
      const data = await getDraft(draftId);
      setDraft(data);
      setSubject(data.subject ?? '');
      setBody(data.body);
      setRecipientsText(data.recipientIds.join(', '));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingDraft(false);
    }
  }, [isNew, draftId]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  // ── Helpers ────────────────────────────────────────────────────────

  function parseRecipients(): string[] {
    return recipientsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // ── Guardar ────────────────────────────────────────────────────────

  async function handleSave(): Promise<DraftResponse | null> {
    setSaving(true);
    setError(null);

    const recipientIds = parseRecipients();
    const subjectTrimmed = subject.trim() || null;
    const bodyTrimmed = body.trim();

    if (!bodyTrimmed) {
      setError('El cuerpo del borrador no puede estar vacío.');
      setSaving(false);
      return null;
    }

    try {
      let saved: DraftResponse;
      if (isNew || !draftId) {
        saved = await saveDraft({
          subject: subjectTrimmed ?? undefined,
          body: bodyTrimmed,
          recipientIds,
        });
      } else {
        saved = await updateDraft(draftId, {
          subject: subjectTrimmed,
          body: bodyTrimmed,
          recipientIds,
        });
      }
      setDraft(saved);
      return saved;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndGoBack() {
    const saved = await handleSave();
    if (saved) {
      navigation.goBack();
    }
  }

  // ── Enviar ─────────────────────────────────────────────────────────

  async function handleSend() {
    const recipientIds = parseRecipients();
    if (recipientIds.length === 0) {
      Alert.alert(
        'Sin destinatarios',
        'Agregá al menos un destinatario antes de enviar.',
      );
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Primero guardamos para asegurar consistencia
      let currentId = draftId;

      if (!currentId) {
        const saved = await saveDraft({
          subject: subject.trim() || undefined,
          body: body.trim(),
          recipientIds,
        });
        currentId = saved.id;
      } else {
        await updateDraft(currentId, {
          subject: subject.trim() || null,
          body: body.trim(),
          recipientIds,
        });
      }

      await sendDraft(currentId);

      Alert.alert(
        'Mensaje enviado',
        'Tu borrador fue enviado correctamente.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  // ── Descartar ──────────────────────────────────────────────────────

  function confirmDiscard() {
    if (!draftId && !body.trim() && !subject.trim()) {
      // Form vacío — simplemente volver
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Descartar borrador',
      draftId
        ? '¿Eliminás este borrador? Esta acción no se puede deshacer.'
        : '¿Descartás los cambios sin guardar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: draftId ? 'Eliminar' : 'Descartar',
          style: 'destructive',
          onPress: () => { void handleDiscard(); },
        },
      ],
    );
  }

  async function handleDiscard() {
    if (draftId) {
      try {
        await deleteDraft(draftId);
      } catch {
        // Si falla el delete, igual volvemos
      }
    }
    navigation.goBack();
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (loadingDraft) {
    return <LoadingScreen message="Cargando borrador..." />;
  }

  const isBusy = saving || sending;

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
        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Destinatarios */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Destinatarios{' '}
            <Text style={styles.labelHint}>(UUIDs separados por coma)</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={recipientsText}
            onChangeText={setRecipientsText}
            placeholder="uuid1, uuid2, ..."
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={2}
            editable={!isBusy}
          />
        </View>

        {/* Asunto */}
        <View style={styles.field}>
          <Text style={styles.label}>Asunto</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Asunto del mensaje (opcional)"
            editable={!isBusy}
            returnKeyType="next"
          />
        </View>

        {/* Cuerpo */}
        <View style={styles.field}>
          <Text style={styles.label}>Mensaje</Text>
          <TextInput
            style={styles.textarea}
            value={body}
            onChangeText={setBody}
            placeholder="Escribí tu mensaje acá..."
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            editable={!isBusy}
          />
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          {/* Guardar */}
          <TouchableOpacity
            style={[styles.btnPrimary, isBusy && styles.btnDisabled]}
            onPress={() => { void handleSaveAndGoBack(); }}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Guardar borrador</Text>
            )}
          </TouchableOpacity>

          {/* Enviar */}
          <TouchableOpacity
            style={[styles.btnSuccess, isBusy && styles.btnDisabled]}
            onPress={() => { void handleSend(); }}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.btnSuccessText}>Enviar mensaje</Text>
            )}
          </TouchableOpacity>

          {/* Descartar */}
          <TouchableOpacity
            style={[styles.btnDanger, isBusy && styles.btnDisabled]}
            onPress={confirmDiscard}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            <Text style={styles.btnDangerText}>
              {draftId ? 'Eliminar borrador' : 'Descartar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
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
    minHeight: 180,
    textAlignVertical: 'top',
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
  btnSuccess: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnSuccessText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  btnDangerText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
