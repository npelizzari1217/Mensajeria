/**
 * MoreHomeScreen — pantalla raíz del tab "Más".
 *
 * Muestra links a Enviados, Borradores, Fijados y Grupos.
 * En Phase 13 se puede pulir con iconos y estilos más elaborados.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/auth.context';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'MoreHome'>;

interface MenuItem {
  label: string;
  sublabel: string;
  screen: keyof MoreStackParamList;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Enviados', sublabel: 'Mensajes que enviaste', screen: 'Sent' },
  { label: 'Borradores', sublabel: 'Mensajes guardados sin enviar', screen: 'Drafts' },
  { label: 'Fijados', sublabel: 'Mensajes marcados como importantes', screen: 'Pinned' },
  { label: 'Grupos', sublabel: 'Tus grupos de mensajería', screen: 'Groups' },
];

export default function MoreHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Usuario */}
      {user ? (
        <View style={styles.userCard}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      ) : null}

      {/* Menú de opciones */}
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.screen as any)}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuSublabel}>{item.sublabel}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Cerrar sesión */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => { void logout(); }}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
    paddingBottom: 32,
  },
  userCard: {
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
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItemContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  menuSublabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#d1d5db',
    marginLeft: 8,
  },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '600',
  },
});
