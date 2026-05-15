/**
 * GroupsListScreen — Fase 10, T10.1
 *
 * Lista los grupos del usuario autenticado.
 * Cada ítem muestra: nombre, descripción, conteo de miembros.
 * Tap → GroupDetailScreen con el id del grupo.
 * Botón "+" (header) abre un modal simple para crear un grupo nuevo.
 *
 * Pull-to-refresh para recargar.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/types';
import {
  listUserGroups,
  createGroup,
  type GroupResponse,
} from '../../api/groups';
import { getErrorMessage } from '../../api/client';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorCard } from '../../components/ErrorCard';

// ── Types ─────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<MoreStackParamList>;

// ── Component ─────────────────────────────────────────────────────────

export default function GroupsListScreen() {
  const navigation = useNavigation<Nav>();

  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal crear grupo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Header: botón "+" ──────────────────────────────────────────────

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>＋</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // ── Load ───────────────────────────────────────────────────────────

  const loadGroups = useCallback(async () => {
    setError(null);
    try {
      const data = await listUserGroups();
      setGroups(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadGroups();
    }, [loadGroups]),
  );

  // ── Create group ───────────────────────────────────────────────────

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError('El nombre del grupo es requerido.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const created = await createGroup(
        newName.trim(),
        newDescription.trim() || undefined,
      );
      setGroups((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewName('');
      setNewDescription('');
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────

  function renderItem({ item }: { item: GroupResponse }) {
    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => navigation.navigate('GroupDetail', { id: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.groupInfo}>
          <Text style={styles.groupName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.groupDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.groupMeta}>
            <Text style={styles.groupMetaText}>
              {item.memberCount} miembro{item.memberCount !== 1 ? 's' : ''}
            </Text>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactivo</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>Sin grupos</Text>
        <Text style={styles.emptySubtitle}>
          Tocá "＋" para crear tu primer grupo de mensajería.
        </Text>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (loading && !refreshing) {
    return <LoadingScreen message="Cargando grupos..." />;
  }

  if (error && groups.length === 0) {
    return (
      <ErrorCard
        message={error}
        onRetry={() => {
          setLoading(true);
          void loadGroups();
        }}
      />
    );
  }

  return (
    <>
      <FlatList
        style={styles.container}
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          groups.length === 0 ? styles.listEmpty : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadGroups();
            }}
            tintColor="#3b82f6"
          />
        }
      />

      {/* Modal: Crear grupo */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear grupo</Text>

            {createError ? (
              <View style={styles.createError}>
                <Text style={styles.createErrorText}>{createError}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nombre *</Text>
              <TextInput
                style={styles.fieldInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Nombre del grupo"
                editable={!creating}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldTextarea]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Descripción del grupo..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!creating}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnSecondary, creating && styles.btnDisabled]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setNewDescription('');
                  setCreateError(null);
                }}
                disabled={creating}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, creating && styles.btnDisabled]}
                onPress={() => { void handleCreate(); }}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Crear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  groupDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupMetaText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  inactiveBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    color: '#d1d5db',
    marginLeft: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBtnText: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: '600',
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  createError: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  createErrorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  fieldTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalBtnSecondaryText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
