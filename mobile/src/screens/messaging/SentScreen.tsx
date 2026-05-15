/**
 * SentScreen — Fase 7, T7.2
 *
 * Lista paginada de mensajes enviados con:
 *   - Pull-to-refresh
 *   - Paginación (botón "Cargar más")
 *   - Tap → navega a MessageDetail (en MoreStack)
 *   - Empty state
 *
 * Vive dentro de MoreStack → navega a 'MessageDetail' con { messageId }.
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
import type { MoreStackParamList } from '../../navigation/types';
import {
  listSent,
  type MessageListItem,
} from '../../api/messages';
import { MessageCard } from '../../components/MessageCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorBanner } from '../../components/ErrorBanner';
import { getErrorMessage } from '../../api/client';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Sent'>;

const PAGE_SIZE = 20;

export default function SentScreen() {
  const navigation = useNavigation<Nav>();

  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number, replace: boolean) => {
    try {
      const res = await listSent(p, PAGE_SIZE);
      setTotal(res.total);
      setMessages((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchPage(1, true).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await fetchPage(1, true);
    setRefreshing(false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || messages.length >= total) return;
    setLoadingMore(true);
    await fetchPage(page + 1, false);
    setLoadingMore(false);
  }, [loadingMore, messages.length, total, fetchPage, page]);

  function getRecipientNames(msg: MessageListItem): string[] {
    return msg.recipients.map(
      (r) => r.recipientName || r.recipientId.slice(0, 8),
    );
  }

  const hasMore = messages.length < total;

  if (loading) {
    return <LoadingScreen message="Cargando mensajes..." />;
  }

  return (
    <View style={styles.container}>
      {/* Error */}
      {error ? <ErrorBanner message={error} /> : null}

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
          <EmptyState message="No hay mensajes enviados" />
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
            recipientNames={getRecipientNames(item)}
            subject={item.subject}
            body={item.body}
            sentAt={item.sentAt}
            isUnread={false}
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
  },
  loadMoreText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
