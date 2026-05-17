/**
 * AppTabs — Bottom Tab Navigator for authenticated users.
 *
 * Tabs:
 *   Inbox    → MessagesStack (InboxList + MessageDetail + Thread)
 *   Compose  → ComposeScreen
 *   Search   → SearchScreen
 *   More     → MoreStack (nested stack: Sent, Drafts, Pinned, Groups)
 */

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from './types';
import { MessagesStack } from './MessagesStack';
import ComposeScreen from '../screens/messaging/ComposeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import { MoreStack } from './MoreStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

const TAB_ICONS: Record<string, string> = {
  Inbox:   '📥',
  Compose: '✏️',
  Search:  '🔍',
  More:    '⋯',
};

export function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Inbox"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
        },
        tabBarIcon: ({ size }) => (
          <Text style={{ fontSize: size }}>{TAB_ICONS[route.name] ?? '•'}</Text>
        ),
      })}
    >
      <Tab.Screen
        name="Inbox"
        component={MessagesStack}
        options={{ title: 'Bandeja' }}
      />
      <Tab.Screen
        name="Compose"
        component={ComposeScreen}
        options={{ title: 'Redactar', headerShown: true }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Buscar', headerShown: true }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ title: 'Más' }}
      />
    </Tab.Navigator>
  );
}
