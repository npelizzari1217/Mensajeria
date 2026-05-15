/**
 * PinnedScreen — Fase 11, T11.1
 *
 * Lista los mensajes fijados por el usuario autenticado.
 * Cada ítem incluye badge "📌 Fijado" para diferenciarlo de otras listas.
 * Tap → MessageDetail (en MessagesStack).
 *
 * Pull-to-refresh para recargar.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MessagesStackParamList, MoreStackParamList } from '../../navigation/types';
import { listPinned, type PinnedMessage } from '../../api/pinned';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../lib/formatters';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorCard } from '../../components/ErrorCard';

// ── Types ─────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<MoreStackParamList>;

// ── Component ─────────────────────────────────────────────────────────

export default function PinnedScreen() {
  const navigation = useNavigation<Nav>();

  const [messages, setMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load ───────────────────────────────────────────────────────────

  const loadPinned = useCallback(async () => {
    setError(null);
    try {
      const data = await listPinned();
      setMessages(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarga al volver a enfocar (ej: después de desfijar en MessageDetail)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadPinned();
    }, [loadPinned]),
  );

  // ── Navigate to detail ─────────────────────────────────────────────

  function handleOpenMessage(messageId: string) {
    navigation.navigate('MessageDetail', { messageId });
  }

  // ── Render helpers ─────────────────────────────────────────────────

  function renderItem({ item }: { item: PinnedMessage }) {
    const preview =
      item.body.length > 100 ? item.body.slice(0, 100) + '...' : item.body;

    return (
      <TouchableOpacity
        style={styles.messageCard}
        onPress={() => handleOpenMessage(item.messageId)}
        activeOpacity={0.75}
      >
        {/* Badge de fijado */}
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedBadgeText}>📌 Fijado</Text>
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.subject} numberOfLines={1}>
            {item.subject}
          </Text>
          <Text style={styles.date}>{formatDate(item.pinnedAt)}</Text>
        </View>

        <Text style={styles.sender} numberOfLines={1}>
          De: {item.senderName}
        </Text>

        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📌</Text>
        <Text style={styles.emptyTitle}>Sin mensajes fijados</Text>
        <Text style={styles.emptySubtitle}>
          Fijá un mensaje desde la vista de detalle para verlo acá.
        </Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (loading && !refreshing) {
    return <LoadingScreen message="Cargando mensajes fijados..." />;
  }

  if (error && messages.length === 0) {
    return (
      <ErrorCard
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadPinned();
        }}
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={
        messages.length === 0 ? styles.listEmpty : styles.listContent
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadPinned();
          }}
          tintColor="#3b82f6"
        />
      }
    />
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
  },
  listEmpty: {
    flex: 1,
  },
  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  pinnedBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pinnedBadgeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    flexShrink: 0,
  },
  sender: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
