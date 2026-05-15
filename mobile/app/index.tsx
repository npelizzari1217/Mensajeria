/**
 * App entry point.
 *
 * Provider stack (outer → inner):
 *   TamaguiProvider — design tokens + theming
 *   AuthProvider    — session state (SecureStore-backed, restores on mount)
 *   RootNavigator   — NavigationContainer + auth gate (AuthStack vs AppTabs)
 *   StatusBar       — managed by Expo
 *
 * NOTE: NavigationContainer lives inside RootNavigator (not here) so it
 * can access useAuth() to decide which stack to render.
 */
import React from 'react';
import { TamaguiProvider } from 'tamagui';
import { StatusBar } from 'expo-status-bar';
import tamaguiConfig from '../src/theme/tamagui.config';
import { AuthProvider } from '../src/auth/auth.context';
import { RootNavigator } from '../src/navigation/RootNavigator';

export default function App() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </TamaguiProvider>
  );
}
