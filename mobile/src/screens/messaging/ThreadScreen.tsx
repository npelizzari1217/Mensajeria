/**
 * ThreadScreen — Fase 7, T7.5
 *
 * Recibe param: { messageId: string }
 * Carga: getThread(messageId) al montar
 * Muestra: lista cronológica de todos los mensajes del hilo
 * Reply: inline al pie de la pantalla
 *
 * Decisión técnica: reply inline (mismo approach que MessageDetail).
 * Un input fijo abajo mantiene el contexto del hilo visible mientras
 * el usuario escribe su respuesta. No requiere pantalla separada.
 *
 * Funciona en MessagesStack y MoreStack (misma estrategia que MessageDetail).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { MessagesStackParamList } from '../../navigation/types';
import {
  getThread,
  replyToMessage,
  type MessageListItem,
} from '../../api/messages';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../lib/formatters';
import { EmptyState } from '../../components/EmptyState';
import { LoadingScreen } from '../../components/LoadingScreen';

type AnyRoute = RouteProp<MessagesStackParamList, 'Thread'>;

export default function ThreadScreen() {
  const route = useRoute<AnyRoute>();
  const { messageId } = route.params;

  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const listRef = useRef<FlatList<MessageListItem>>(null);

  // ── Load thread ────────────────────────────────────────────────────

  const loadThread = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getThread(messageId);
      // Ordenados cronológicamente (el más antiguo primero)
      const sorted = [...(res.messages ?? [])].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
      );
      setMessages(sorted);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  // ── Reply ──────────────────────────────────────────────────────────

  async function handleReply() {
    if (!replyBody.trim()) return;

    setReplyLoading(true);
    setReplyError(null);

    try {
      const newMsg = await replyToMessage(messageId, replyBody.trim());
      setReplyBody('');
      // Agregar la nueva respuesta al hilo localmente
      setMessages((prev) => [...prev, newMsg]);
      // Scroll al final
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      setReplyError(getErrorMessage(err));
    } finally {
      setReplyLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingScreen message="Cargando conversación..." />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { void loadThread(); }}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Lista del hilo */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={
          <EmptyState message="No hay mensajes en este hilo" />
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          return (
            <View style={[styles.bubble, isFirst && styles.bubbleFirst]}>
              <View style={styles.bubbleHeader}>
                <Text style={styles.bubbleSender}>{item.senderName}</Text>
                <Text style={styles.bubbleDate}>{formatDate(item.sentAt)}</Text>
              </View>
              {isFirst && (
                <Text style={styles.bubbleSubject}>{item.subject}</Text>
              )}
              {item.body.split('\n').map((line, i) => (
                <Text key={i} style={styles.bubbleBody}>
                  {line}
                </Text>
              ))}
            </View>
          );
        }}
      />

      {/* Reply footer */}
      <View style={styles.replyFooter}>
        {replyError ? (
          <Text style={styles.replyErrorText}>{replyError}</Text>
        ) : null}

        <View style={styles.replyRow}>
          <TextInput
            style={styles.replyInput}
            value={replyBody}
            onChangeText={setReplyBody}
            placeholder="Escribí tu respuesta..."
            multiline
            maxLength={4000}
            editable={!replyLoading}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!replyBody.trim() || replyLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => { void handleReply(); }}
            disabled={!replyBody.trim() || replyLoading}
          >
            {replyLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

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
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyList: {
    flex: 1,
  },
  bubble: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleFirst: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bubbleSender: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  bubbleDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  bubbleSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  bubbleBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  replyFooter: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 12,
  },
  replyErrorText: {
    color: '#b91c1c',
    fontSize: 12,
    marginBottom: 6,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    maxHeight: 100,
    color: '#111827',
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
