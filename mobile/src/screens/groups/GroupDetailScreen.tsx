/**
 * GroupDetailScreen — Fase 10, T10.2
 *
 * Muestra el detalle de un grupo con:
 *   - Header: nombre, descripción, conteo de miembros
 *   - Lista de miembros: nombre, userId, rol
 *
 * Acciones solo para admins:
 *   - Agregar miembro (input con userId + rol)
 *   - Remover miembro (con confirmación)
 *   - Cambiar rol de un miembro
 *   - Desactivar grupo (con confirmación)
 *
 * El role del user actual se determina buscándolo en members.
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/types';
import {
  getGroupDetail,
  addMember,
  removeMember,
  changeMemberRole,
  deactivateGroup,
  type GroupDetailResponse,
  type GroupMemberResponse,
} from '../../api/groups';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../auth/auth.context';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ErrorCard } from '../../components/ErrorCard';

// ── Types ─────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<MoreStackParamList, 'GroupDetail'>;
type Route = RouteProp<MoreStackParamList, 'GroupDetail'>;

// ── Component ─────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal agregar miembro
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('MEMBER');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Modal cambiar rol
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<GroupMemberResponse | null>(null);
  const [newRoleValue, setNewRoleValue] = useState('');
  const [changingRole, setChangingRole] = useState(false);

  // ── Load group ─────────────────────────────────────────────────────

  const loadGroup = useCallback(async () => {
    setError(null);
    try {
      const data = await getGroupDetail(id);
      setGroup(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  // ── Determine user role ────────────────────────────────────────────

  const currentUserRole = group?.members.find(
    (m) => m.userId === user?.id,
  )?.role;
  const isAdmin = currentUserRole === 'ADMIN';

  // ── Add member ─────────────────────────────────────────────────────

  async function handleAddMember() {
    if (!newUserId.trim()) {
      setAddError('Ingresá el ID del usuario.');
      return;
    }

    setAdding(true);
    setAddError(null);

    try {
      const newMember = await addMember(id, newUserId.trim(), newRole);
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: [...prev.members, newMember],
              memberCount: prev.memberCount + 1,
            }
          : prev,
      );
      setShowAddModal(false);
      setNewUserId('');
      setNewRole('MEMBER');
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  // ── Remove member ──────────────────────────────────────────────────

  function confirmRemoveMember(member: GroupMemberResponse) {
    Alert.alert(
      'Remover miembro',
      `¿Removés a ${member.name} del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => { void handleRemoveMember(member.userId); },
        },
      ],
    );
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeMember(id, userId);
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.userId !== userId),
              memberCount: Math.max(0, prev.memberCount - 1),
            }
          : prev,
      );
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  }

  // ── Change role ────────────────────────────────────────────────────

  function openRoleModal(member: GroupMemberResponse) {
    setSelectedMember(member);
    setNewRoleValue(member.role);
    setShowRoleModal(true);
  }

  async function handleChangeRole() {
    if (!selectedMember || !newRoleValue.trim()) return;

    setChangingRole(true);
    try {
      const updated = await changeMemberRole(
        id,
        selectedMember.userId,
        newRoleValue.trim().toUpperCase(),
      );
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) =>
                m.userId === updated.userId ? updated : m,
              ),
            }
          : prev,
      );
      setShowRoleModal(false);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setChangingRole(false);
    }
  }

  // ── Deactivate group ───────────────────────────────────────────────

  function confirmDeactivate() {
    Alert.alert(
      'Desactivar grupo',
      `¿Desactivás el grupo "${group?.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () => { void handleDeactivate(); },
        },
      ],
    );
  }

  async function handleDeactivate() {
    try {
      await deactivateGroup(id);
      Alert.alert(
        'Grupo desactivado',
        'El grupo fue desactivado correctamente.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingScreen message="Cargando grupo..." />;
  }

  if (error || !group) {
    return (
      <ErrorCard
        message={error ?? 'No se encontró el grupo.'}
        onRetry={() => {
          setLoading(true);
          void loadGroup();
        }}
      />
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadGroup();
            }}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Header del grupo */}
        <View style={styles.headerCard}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description ? (
            <Text style={styles.groupDesc}>{group.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {group.memberCount} miembro{group.memberCount !== 1 ? 's' : ''}
              </Text>
            </View>
            {!group.isActive && (
              <View style={[styles.metaBadge, styles.inactiveBadge]}>
                <Text style={[styles.metaBadgeText, styles.inactiveBadgeText]}>
                  Inactivo
                </Text>
              </View>
            )}
            {currentUserRole && (
              <View style={[styles.metaBadge, isAdmin ? styles.adminBadge : styles.memberBadge]}>
                <Text style={[styles.metaBadgeText, isAdmin ? styles.adminBadgeText : styles.memberBadgeText]}>
                  {isAdmin ? 'Admin' : 'Miembro'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Lista de miembros */}
        <Text style={styles.sectionTitle}>Miembros</Text>

        {group.members.length === 0 ? (
          <Text style={styles.emptyText}>No hay miembros en este grupo.</Text>
        ) : (
          group.members.map((member) => (
            <View key={member.userId} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberUserId} numberOfLines={1}>
                  {member.userId}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{member.role}</Text>
                </View>
              </View>

              {/* Acciones de admin */}
              {isAdmin && member.userId !== user?.id && (
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={styles.memberActionBtn}
                    onPress={() => openRoleModal(member)}
                  >
                    <Text style={styles.memberActionText}>Rol</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.memberActionBtn, styles.memberActionBtnDanger]}
                    onPress={() => confirmRemoveMember(member)}
                  >
                    <Text style={styles.memberActionTextDanger}>Remover</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {/* Acciones de admin al pie */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={styles.addMemberBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addMemberBtnText}>＋ Agregar miembro</Text>
            </TouchableOpacity>

            {group.isActive && (
              <TouchableOpacity
                style={styles.deactivateBtn}
                onPress={confirmDeactivate}
              >
                <Text style={styles.deactivateBtnText}>Desactivar grupo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal: Agregar miembro */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar miembro</Text>

            {addError ? (
              <View style={styles.addError}>
                <Text style={styles.addErrorText}>{addError}</Text>
              </View>
            ) : null}

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>ID del usuario *</Text>
              <TextInput
                style={styles.modalInput}
                value={newUserId}
                onChangeText={setNewUserId}
                placeholder="UUID del usuario"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!adding}
                autoFocus
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Rol</Text>
              <TextInput
                style={styles.modalInput}
                value={newRole}
                onChangeText={(t) => setNewRole(t.toUpperCase())}
                placeholder="MEMBER o ADMIN"
                autoCapitalize="characters"
                editable={!adding}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnSecondary, adding && styles.btnDisabled]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewUserId('');
                  setNewRole('MEMBER');
                  setAddError(null);
                }}
                disabled={adding}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, adding && styles.btnDisabled]}
                onPress={() => { void handleAddMember(); }}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Cambiar rol */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Cambiar rol de {selectedMember?.name}
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Nuevo rol</Text>
              <TextInput
                style={styles.modalInput}
                value={newRoleValue}
                onChangeText={(t) => setNewRoleValue(t.toUpperCase())}
                placeholder="MEMBER o ADMIN"
                autoCapitalize="characters"
                editable={!changingRole}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtnSecondary,
                  changingRole && styles.btnDisabled,
                ]}
                onPress={() => setShowRoleModal(false)}
                disabled={changingRole}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnPrimary,
                  changingRole && styles.btnDisabled,
                ]}
                onPress={() => { void handleChangeRole(); }}
                disabled={changingRole}
              >
                {changingRole ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Guardar</Text>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  groupDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaBadgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  inactiveBadge: {
    backgroundColor: '#fef3c7',
  },
  inactiveBadgeText: {
    color: '#92400e',
  },
  adminBadge: {
    backgroundColor: '#dbeafe',
  },
  adminBadgeText: {
    color: '#1d4ed8',
  },
  memberBadge: {
    backgroundColor: '#f0fdf4',
  },
  memberBadgeText: {
    color: '#166534',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 24,
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  memberUserId: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  memberActionBtn: {
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  memberActionText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '600',
  },
  memberActionBtnDanger: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  memberActionTextDanger: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
  },
  adminActions: {
    marginTop: 20,
    gap: 10,
  },
  addMemberBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addMemberBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  deactivateBtn: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deactivateBtnText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '600',
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
  addError: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  addErrorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  modalField: {
    marginBottom: 14,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    color: '#111827',
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
