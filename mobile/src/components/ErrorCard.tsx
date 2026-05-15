/**
 * ErrorCard — error centrado en pantalla con botón de reintento.
 *
 * Reemplaza el patrón repetido en 5 pantallas:
 *   <View centered><View errorCard><Text /><TouchableOpacity retry /></View></View>
 *
 * Uso:
 *   <ErrorCard message={error} onRetry={() => loadData()} />
 *   <ErrorCard message={error} onRetry={() => loadData()} onBack={() => navigation.goBack()} />
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorCard({ message, onRetry, onBack }: ErrorCardProps) {
  return (
    <View style={styles.centered}>
      <View style={styles.card}>
        <Text style={styles.errorText}>{message}</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        ) : null}
        {onBack ? (
          <TouchableOpacity style={[styles.retryBtn, styles.backBtn]} onPress={onBack}>
            <Text style={[styles.retryText, styles.backText]}>Volver</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
  card: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  backBtn: {
    backgroundColor: '#f3f4f6',
    marginTop: 8,
  },
  backText: {
    color: '#6b7280',
  },
});
