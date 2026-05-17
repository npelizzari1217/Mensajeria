/**
 * App entry point.
 *
 * Provider stack (outer → inner):
 *   SafeAreaProvider — safe area insets
 *   AuthProvider     — session state (SecureStore-backed, restores on mount)
 *   RootNavigator    — NavigationContainer + auth gate (AuthStack vs AppTabs)
 *   StatusBar        — managed by Expo
 */
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth/auth.context';
import { RootNavigator } from '../src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
