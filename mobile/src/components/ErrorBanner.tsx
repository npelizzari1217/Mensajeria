/**
 * ErrorBanner — banner de error inline (no pantalla completa).
 *
 * Reemplaza el patrón repetido en 4 pantallas:
 *   <View errorBanner><Text errorText>{error}</Text></View>
 *
 * Uso:
 *   <ErrorBanner message={error} />
 *   <ErrorBanner message={error} onRetry={() => handleSearch()} />
 *   <ErrorBanner message={error} onDismiss={() => setError(null)} />
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ErrorBannerProps {
  message: string;
  /** Link de reintento al lado derecho del mensaje */
  onRetry?: () => void;
  /** X para cerrar el banner — si está, reemplaza a onRetry */
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  const hasAction = onRetry ?? onDismiss;

  return (
    <View style={[styles.banner, hasAction ? styles.bannerWithAction : null]}>
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} style={styles.actionBtn}>
          <Text style={styles.actionText}>✕</Text>
        </TouchableOpacity>
      ) : onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.actionBtn}>
          <Text style={styles.actionText}>Reintentar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  bannerWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    color: '#b91c1c',
    fontSize: 13,
    flex: 1,
  },
  actionBtn: {
    marginLeft: 12,
  },
  actionText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
});
