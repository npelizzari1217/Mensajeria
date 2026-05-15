/**
 * LoadingScreen — spinner centrado con texto opcional.
 *
 * Reemplaza el patrón repetido en 7+ pantallas:
 *   <View style={centered}><ActivityIndicator /><Text>...</Text></View>
 *
 * Uso:
 *   <LoadingScreen />
 *   <LoadingScreen message="Cargando mensajes..." />
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  message: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
});
