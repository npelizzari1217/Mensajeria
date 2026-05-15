/**
 * MoreStack — Native Stack nested inside the "More" bottom tab.
 *
 * Pantalla raíz: MoreHomeScreen (menú con links a sub-screens).
 * Sub-screens: Sent, Drafts, DraftEdit, Pinned, Groups, GroupDetail,
 *              MessageDetail, Thread.
 *
 * MessageDetail y Thread están en este stack para permitir navegación
 * desde SentScreen, PinnedScreen y otras screens sin salir del tab.
 *
 * Full screen implementations: Phases 7 (Sent, Detail, Thread), 9, 10, 11.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from './types';
import MoreHomeScreen from '../screens/more/MoreHomeScreen';
import DraftsListScreen from '../screens/drafts/DraftsListScreen';
import DraftEditScreen from '../screens/drafts/DraftEditScreen';
import PinnedScreen from '../screens/pinned/PinnedScreen';
import GroupsListScreen from '../screens/groups/GroupsListScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import SentScreen from '../screens/messaging/SentScreen';
import MessageDetailScreen from '../screens/messaging/MessageDetailScreen';
import ThreadScreen from '../screens/messaging/ThreadScreen';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator initialRouteName="MoreHome">
      <Stack.Screen
        name="MoreHome"
        component={MoreHomeScreen}
        options={{ title: 'Más opciones' }}
      />
      <Stack.Screen
        name="Sent"
        component={SentScreen}
        options={{ title: 'Enviados' }}
      />
      <Stack.Screen
        name="Drafts"
        component={DraftsListScreen}
        options={{ title: 'Borradores' }}
      />
      <Stack.Screen
        name="DraftEdit"
        component={DraftEditScreen}
        options={({ route }: NativeStackScreenProps<MoreStackParamList, 'DraftEdit'>) => ({
          title: route.params?.id ? 'Editar borrador' : 'Nuevo borrador',
        })}
      />
      <Stack.Screen
        name="Pinned"
        component={PinnedScreen}
        options={{ title: 'Fijados' }}
      />
      <Stack.Screen
        name="Groups"
        component={GroupsListScreen}
        options={{ title: 'Grupos' }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: 'Detalle del grupo' }}
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
