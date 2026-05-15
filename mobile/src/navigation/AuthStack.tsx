/**
 * AuthStack — Native Stack for unauthenticated users.
 *
 * Screens:
 *   Login    — entry point (initial route)
 *   Register — accessible from Login via "Create account" link
 *
 * Real screen implementations live in Phase 6.
 * These imports use stub components that only render the screen name.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
