/**
 * SearchScreen — Fase 8, T8.1
 *
 * Pantalla de búsqueda de mensajes accesibles al usuario.
 *
 * Flujo:
 *   - Input de texto + botón "Buscar"
 *   - Al presionar buscar: llama searchMessages(query, page, pageSize)
 *   - Resultados en FlatList con MessageCard, paginados (load more)
 *   - Tap en un resultado → MessageDetail (en MessagesStack)
 *
 * Validación:
 *   - Query vacía bloquea la búsqueda con mensaje al user
 *
 * Vive en el tab Search (AppTabsParamList) y navega a MessageDetail
 * dentro del stack correcto via navigate cross-tab.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchMessages, type MessageListItem } from '../../api/messages';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../lib/formatters';

// ── Types ─────────────────────────────────────────────────────────────

// SearchScreen is a tab-level screen — we use a broad navigation type
// for cross-tab jumps (Search → Inbox → MessageDetail).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Nav = any;

const PAGE_SIZE = 20;

// ── Component ─────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Guardamos el query activo para el load-more (no el del input)
  const activeQueryRef = useRef('');

  // ── Search ─────────────────────────────────────────────────────────

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) {
      setQueryError('Ingresá un término de búsqueda antes de continuar.');
      return;
    }

    setQueryError(null);
    setError(null);
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    setPage(1);
    activeQueryRef.current = trimmed;

    try {
      const res = await searchMessages(trimmed, 1, PAGE_SIZE);
      setResults(res.data);
      setTotal(res.total);
      setPage(1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Load more ──────────────────────────────────────────────────────

  async function handleLoadMore() {
    if (loadingMore || loading) return;
    if (results.length >= total) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const res = await searchMessages(activeQueryRef.current, nextPage, PAGE_SIZE);
      setResults((prev) => [...prev, ...res.data]);
      setPage(nextPage);
    } catch {
      // Silencioso en load more — el user puede reintentar
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────

  function renderItem({ item }: { item: MessageListItem }) {
    const preview =
      item.body.length > 100 ? item.body.slice(0, 100) + '...' : item.body;

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          navigation.navigate('Inbox', {
            screen: 'MessageDetail',
            params: { messageId: item.id },
          });
        }}
        activeOpacity={0.75}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultSubject} numberOfLines={1}>
            {item.subject}
          </Text>
          <Text style={styles.resultDate}>{formatDate(item.sentAt)}</Text>
        </View>
        <Text style={styles.resultSender} numberOfLines={1}>
          De: {item.senderName}
        </Text>
        <Text style={styles.resultPreview} numberOfLines={2}>
          {preview}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) return null;
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Buscá tus mensajes</Text>
          <Text style={styles.emptySubtitle}>
            Ingresá palabras clave del asunto o cuerpo del mensaje.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>Sin resultados</Text>
        <Text style={styles.emptySubtitle}>
          No encontramos mensajes para "{activeQueryRef.current}".
        </Text>
      </View>
    );
  }

  function renderFooter() {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <TextInput
          style={[styles.searchInput, queryError ? styles.inputError : null]}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            if (queryError) setQueryError(null);
          }}
          placeholder="Buscar mensajes..."
          returnKeyType="search"
          onSubmitEditing={() => { void handleSearch(); }}
          autoCorrect={false}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.searchBtn, loading && styles.btnDisabled]}
          onPress={() => { void handleSearch(); }}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Errores */}
      {queryError ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{queryError}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => { void handleSearch(); }}>
            <Text style={styles.retryLink}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Contador de resultados */}
      {hasSearched && !loading && !error && results.length > 0 ? (
        <Text style={styles.resultCount}>
          {total} resultado{total !== 1 ? 's' : ''} para "{activeQueryRef.current}"
        </Text>
      ) : null}

      {/* Lista */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={results.length === 0 ? styles.listEmpty : styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  searchBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  inlineError: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  inlineErrorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  errorBanner: {
    margin: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 14,
    flex: 1,
  },
  retryLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  resultCount: {
    fontSize: 13,
    color: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  listEmpty: {
    flex: 1,
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  resultDate: {
    fontSize: 12,
    color: '#9ca3af',
    flexShrink: 0,
  },
  resultSender: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  resultPreview: {
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
