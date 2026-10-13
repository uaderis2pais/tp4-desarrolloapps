// ==============================================================================
// AGROPULSE - NAVEGACIÓN PRINCIPAL EN TABS (§12 del PRD)
// Tabs: Mapa | Lotes | Alertas | Diagnóstico (RF-23) | Cuenta
// ==============================================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../src/context/RealtimeContext';

export default function TabsLayout() {
  const { alerts } = useRealtime();
  const unreadAlertsCount = alerts.filter((a) => !a.read_at).length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1B4D3E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#1B4D3E',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="plots"
        options={{
          title: 'Lotes',
          tabBarLabel: 'Lotes',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarLabel: 'Alertas',
          tabBarBadge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="diagnostics"
        options={{
          title: 'Diagnóstico',
          tabBarLabel: 'Diagnóstico',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'pulse' : 'pulse-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarLabel: 'Cuenta',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
