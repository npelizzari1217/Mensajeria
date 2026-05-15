/**
 * EmptyState — placeholder cuando una lista no tiene ítems.
 *
 * Usado por Inbox, Sent, Drafts, Pinned, Groups.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({
  message = 'No hay elementos para mostrar',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📭</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
