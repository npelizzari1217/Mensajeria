/**
 * InboxScreen — Fase 7, T7.1
 *
 * Lista paginada de mensajes recibidos con:
 *   - Pull-to-refresh
 *   - Paginación (botón "Cargar más" cuando hay más páginas)
 *   - Filtros: Todos / No leídos / Leídos
 *   - Tap → navega a MessageDetail
 *   - Empty state
 *
 * Navegación: vive dentro de MessagesStack. Navega a 'MessageDetail' con { messageId }.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MessagesStackParamList } from '../../navigation/types';
import {
  listInbox,
  type MessageListItem,
} from '../../api/messages';
import { MessageCard } from '../../components/MessageCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorBanner } from '../../components/ErrorBanner';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../auth/auth.context';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'InboxList'>;
type StatusFilter = 'all' | 'read' | 'unread';

const PAGE_SIZE = 20;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'unread', label: 'No leídos' },
  { key: 'read', label: 'Leídos' },
];

export default function InboxScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchPage = useCallback(
    async (p: number, replace: boolean) => {
      try {
        const res = await listInbox(
          p,
          PAGE_SIZE,
          filter === 'all' ? undefined : filter,
        );
        setTotal(res.total);
        setMessages((prev) =>
          replace ? res.data : [...prev, ...res.data],
        );
        setPage(p);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [filter],
  );

  // Carga inicial y cuando cambia el filtro
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessages([]);

    void fetchPage(1, true).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await fetchPage(1, true);
    setRefreshing(false);
  }, [fetchPage]);

  // Cargar más páginas
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || messages.length >= total) return;
    setLoadingMore(true);
    await fetchPage(page + 1, false);
    setLoadingMore(false);
  }, [loadingMore, messages.length, total, fetchPage, page]);

  // Helpers — detectar no-leído
  function isUnread(msg: MessageListItem): boolean {
    if (!user) return false;
    const me = msg.recipients.find((r) => r.recipientId === user.id);
    return me ? me.status !== 'READ' : false;
  }

  // Filtros — UI
  const hasMore = messages.length < total;

  if (loading) {
    return <LoadingScreen message="Cargando mensajes..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              filter === f.key && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error */}
      {error ? <ErrorBanner message={error} /> : null}

      {/* Lista */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { void handleRefresh(); }}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <EmptyState message="No hay mensajes en la bandeja" />
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() => { void handleLoadMore(); }}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text style={styles.loadMoreText}>Cargar más</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <MessageCard
            id={item.id}
            senderName={item.senderName}
            subject={item.subject}
            body={item.body}
            sentAt={item.sentAt}
            isUnread={isUnread(item)}
            onPress={() =>
              navigation.navigate('MessageDetail', { messageId: item.id })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  loadMoreText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
