/**
 * ScreenContainer — SafeAreaView + base padding wrapper.
 *
 * Todos los screens lo usan como contenedor raíz para garantizar
 * consistencia de padding y safe-area en iOS/Android.
 *
 * Props:
 *   - scroll: si es true, envuelve con ScrollView (default: false)
 *   - children
 */
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({
  children,
  scroll = false,
  style,
}: ScreenContainerProps) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.content, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
