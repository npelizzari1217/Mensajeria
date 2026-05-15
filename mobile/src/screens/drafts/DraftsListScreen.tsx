/**
 * DraftsListScreen — Fase 9, T9.1
 *
 * Lista de borradores del usuario con acciones:
 *   - Tap → DraftEditScreen (editar)
 *   - Enviar directo (si tiene destinatarios)
 *   - Eliminar con confirmación (Alert nativo)
 *
 * Pull-to-refresh para recargar.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/types';
import {
  listDrafts,
  deleteDraft,
  sendDraft,
  type DraftResponse,
} from '../../api/drafts';
import { getErrorMessage } from '../../api/client';
import { formatDateShort } from '../../lib/formatters';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorCard } from '../../components/ErrorCard';

// ── Types ─────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<MoreStackParamList>;

// ── Component ─────────────────────────────────────────────────────────

export default function DraftsListScreen() {
  const navigation = useNavigation<Nav>();

  const [drafts, setDrafts] = useState<DraftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load ───────────────────────────────────────────────────────────

  const loadDrafts = useCallback(async () => {
    setError(null);
    try {
      const data = await listDrafts();
      setDrafts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarga al volver a enfocar la pantalla (ej: después de editar)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadDrafts();
    }, [loadDrafts]),
  );

  // ── Delete ─────────────────────────────────────────────────────────

  function confirmDelete(id: string) {
    Alert.alert(
      'Eliminar borrador',
      '¿Querés eliminar este borrador? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => { void handleDelete(id); },
        },
      ],
    );
  }

  async function handleDelete(id: string) {
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  }

  // ── Send ───────────────────────────────────────────────────────────

  function confirmSend(draft: DraftResponse) {
    const hasRecipients =
      draft.recipientIds.length > 0 || draft.groupId != null;
    if (!hasRecipients) {
      Alert.alert(
        'Sin destinatarios',
        'Este borrador no tiene destinatarios. Editalo antes de enviarlo.',
      );
      return;
    }

    Alert.alert(
      'Enviar borrador',
      `¿Enviás el mensaje "${draft.subject ?? '(sin asunto)'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => { void handleSend(draft.id); },
        },
      ],
    );
  }

  async function handleSend(id: string) {
    try {
      await sendDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      Alert.alert('Enviado', 'El mensaje fue enviado correctamente.');
    } catch (err) {
      Alert.alert('Error al enviar', getErrorMessage(err));
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────

  function renderItem({ item }: { item: DraftResponse }) {
    const hasRecipients =
      item.recipientIds.length > 0 || item.groupId != null;
    const preview =
      item.body.length > 80 ? item.body.slice(0, 80) + '...' : item.body;

    return (
      <TouchableOpacity
        style={styles.draftCard}
        onPress={() => navigation.navigate('DraftEdit', { id: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.draftHeader}>
          <Text style={styles.draftSubject} numberOfLines={1}>
            {item.subject ?? '(Sin asunto)'}
          </Text>
          <Text style={styles.draftDate}>{formatDateShort(item.updatedAt)}</Text>
        </View>

        <Text style={styles.draftPreview} numberOfLines={2}>
          {preview}
        </Text>

        {/* Meta badges */}
        <View style={styles.metaRow}>
          {item.recipientIds.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.recipientIds.length} dest.
              </Text>
            </View>
          )}
          {item.groupId ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Grupo</Text>
            </View>
          ) : null}
        </View>

        {/* Acciones */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => navigation.navigate('DraftEdit', { id: item.id })}
          >
            <Text style={styles.actionBtnTextSecondary}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtnPrimary,
              !hasRecipients && styles.btnDisabled,
            ]}
            onPress={() => confirmSend(item)}
          >
            <Text style={styles.actionBtnTextPrimary}>Enviar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnDanger}
            onPress={() => confirmDelete(item.id)}
          >
            <Text style={styles.actionBtnTextDanger}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>Sin borradores</Text>
        <Text style={styles.emptySubtitle}>
          Los mensajes que guardés como borrador aparecerán acá.
        </Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (loading && !refreshing) {
    return <LoadingScreen message="Cargando borradores..." />;
  }

  if (error && drafts.length === 0) {
    return (
      <ErrorCard
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadDrafts();
        }}
      />
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={drafts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={
        drafts.length === 0 ? styles.listEmpty : styles.listContent
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadDrafts();
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
  draftCard: {
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
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  draftSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  draftDate: {
    fontSize: 12,
    color: '#9ca3af',
    flexShrink: 0,
  },
  draftPreview: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    color: '#3730a3',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtnTextSecondary: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
  },
  actionBtnTextPrimary: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  actionBtnDanger: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionBtnTextDanger: {
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
  },
  btnDisabled: {
    opacity: 0.5,
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
