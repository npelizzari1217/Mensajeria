/**
 * MessagesStack — Stack nested dentro del tab "Inbox".
 *
 * Contiene:
 *   InboxList     → InboxScreen (lista paginada)
 *   MessageDetail → MessageDetailScreen (param: messageId)
 *   Thread        → ThreadScreen (param: messageId)
 *
 * Decisión: usamos un stack dentro del tab en lugar de pantallas globales
 * para mantener la back-navigation natural dentro del tab (atrás desde
 * Detail vuelve a Inbox, no sale de la app).
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MessagesStackParamList } from './types';
import InboxScreen from '../screens/messaging/InboxScreen';
import MessageDetailScreen from '../screens/messaging/MessageDetailScreen';
import ThreadScreen from '../screens/messaging/ThreadScreen';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  return (
    <Stack.Navigator
      initialRouteName="InboxList"
      screenOptions={{ headerShown: true }}
    >
      <Stack.Screen
        name="InboxList"
        component={InboxScreen}
        options={{ title: 'Bandeja de entrada' }}
      />
      <Stack.Screen
        name="MessageDetail"
        component={MessageDetailScreen}
        options={{ title: 'Mensaje' }}
      />
      <Stack.Screen
        name="Thread"
        component={ThreadScreen}
        options={{ title: 'Conversación' }}
      />
    </Stack.Navigator>
  );
}
