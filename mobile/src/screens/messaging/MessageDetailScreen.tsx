/**
 * MessageDetailScreen — Fase 7, T7.4
 *
 * Recibe param: { messageId: string }
 * Carga: getMessage(id) al montar
 * Muestra: sender, subject, body, fecha, recipients
 * Auto: markAsRead(id) si el user es recipient y el mensaje no está leído
 * Reply: inline (sin screen separada — decisión técnica: más simple para el flujo mobile)
 * Ver hilo: navega a Thread con { messageId }
 * Pin/Unpin: toggles inmediatos
 *
 * Funciona en ambos stacks (MessagesStack y MoreStack) porque lee
 * los params via useRoute() y navega con useNavigation() genérico.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  MessagesStackParamList,
  MoreStackParamList,
} from '../../navigation/types';
import {
  getMessage,
  markAsRead,
  replyToMessage,
  type MessageListItem,
} from '../../api/messages';
import { pinMessage, unpinMessage } from '../../api/pinned';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../auth/auth.context';
import { formatDate } from '../../lib/formatters';
import { LoadingScreen } from '../../components/LoadingScreen';

// ── Types ─────────────────────────────────────────────────────────────

// La pantalla puede vivir en MessagesStack o MoreStack — acepta params de ambos
type AnyNav = NativeStackNavigationProp<
  MessagesStackParamList & MoreStackParamList
>;

type AnyRoute = RouteProp<
  MessagesStackParamList | MoreStackParamList,
  'MessageDetail'
>;

// ── Component ─────────────────────────────────────────────────────────

export default function MessageDetailScreen() {
  const navigation = useNavigation<AnyNav>();
  const route = useRoute<AnyRoute>();
  const { messageId } = route.params;
  const { user } = useAuth();

  const [message, setMessage] = useState<MessageListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply inline
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Pin
  const [pinned, setPinned] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // ── Load message ───────────────────────────────────────────────────

  const loadMessage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const msg = await getMessage(messageId);
      setMessage(msg);

      // Auto-marcar como leído si el usuario es recipient
      const isRecipient = msg.recipients.some(
        (r) => r.recipientId === user?.id,
      );
      if (isRecipient) {
        // Best-effort — ignoramos errores (puede ya estar leído)
        void markAsRead(messageId).catch(() => undefined);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [messageId, user]);

  useEffect(() => {
    void loadMessage();
  }, [loadMessage]);

  // ── Reply ──────────────────────────────────────────────────────────

  async function handleReply() {
    if (!replyBody.trim()) return;

    setReplyLoading(true);
    setReplyError(null);

    try {
      await replyToMessage(messageId, replyBody.trim());
      setReplyBody('');
      setShowReply(false);
      Alert.alert('Respuesta enviada', 'Tu respuesta fue enviada correctamente.');
    } catch (err) {
      setReplyError(getErrorMessage(err));
    } finally {
      setReplyLoading(false);
    }
  }

  // ── Pin ────────────────────────────────────────────────────────────

  async function handleTogglePin() {
    if (pinLoading) return;
    setPinLoading(true);

    try {
      if (pinned) {
        await unpinMessage(messageId);
        setPinned(false);
      } else {
        await pinMessage(messageId);
        setPinned(true);
      }
    } catch {
      // Silencioso — pin es best-effort
    } finally {
      setPinLoading(false);
    }
  }

  // ── Navigate to Thread ─────────────────────────────────────────────

  function handleViewThread() {
    navigation.navigate('Thread', { messageId });
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingScreen message="Cargando mensaje..." />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { void loadMessage(); }}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryBtn, { marginTop: 8, backgroundColor: '#f3f4f6' }]}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
          >
            <Text style={[styles.retryText, { color: '#6b7280' }]}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!message) return null;

  const recipientNames = message.recipients
    .map((r) => r.recipientName || r.recipientId.slice(0, 8))
    .join(', ');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cabecera del mensaje */}
      <View style={styles.headerCard}>
        <Text style={styles.subject}>{message.subject}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>De:</Text>
          <Text style={styles.metaValue}>{message.senderName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Para:</Text>
          <Text style={styles.metaValue}>{recipientNames}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Fecha:</Text>
          <Text style={styles.metaValue}>{formatDate(message.sentAt)}</Text>
        </View>
      </View>

      {/* Cuerpo */}
      <View style={styles.bodyCard}>
        {message.body.split('\n').map((line, i) => (
          <Text key={i} style={styles.bodyLine}>
            {line}
          </Text>
        ))}
      </View>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        {!showReply && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowReply(true)}
          >
            <Text style={styles.actionBtnText}>Responder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={handleViewThread}
        >
          <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
            Ver hilo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            pinned ? styles.actionBtnPinned : styles.actionBtnSecondary,
          ]}
          onPress={() => { void handleTogglePin(); }}
          disabled={pinLoading}
        >
          <Text
            style={[
              styles.actionBtnText,
              pinned ? styles.actionBtnTextPinned : styles.actionBtnTextSecondary,
            ]}
          >
            {pinLoading ? '...' : pinned ? 'Desfijar' : 'Fijar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reply inline */}
      {showReply && (
        <View style={styles.replyCard}>
          <Text style={styles.replyTitle}>Responder</Text>

          {replyError ? (
            <View style={styles.replyError}>
              <Text style={styles.replyErrorText}>{replyError}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.replyInput}
            value={replyBody}
            onChangeText={setReplyBody}
            placeholder="Escribí tu respuesta..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!replyLoading}
          />

          <View style={styles.replyActions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                (!replyBody.trim() || replyLoading) && styles.btnDisabled,
              ]}
              onPress={() => { void handleReply(); }}
              disabled={!replyBody.trim() || replyLoading}
            >
              {replyLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>Enviar respuesta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => {
                setShowReply(false);
                setReplyBody('');
                setReplyError(null);
              }}
              disabled={replyLoading}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  subject: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    width: 50,
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  bodyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bodyLine: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtnTextSecondary: {
    color: '#374151',
  },
  actionBtnPinned: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  actionBtnTextPinned: {
    color: '#92400e',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  replyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  replyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  replyError: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  replyErrorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#111827',
    marginBottom: 12,
  },
  replyActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
