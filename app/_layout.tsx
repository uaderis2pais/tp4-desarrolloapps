// ==============================================================================
// AGROPULSE - ROOT LAYOUT (EXPO ROUTER V6)
// ==============================================================================

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { RealtimeProvider } from '../src/context/RealtimeContext';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RealtimeProvider>
            <StatusBar style="light" />
            <OfflineBanner />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#1B4D3E' },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '700' },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="plot/[id]"
                options={{
                  title: 'Detalle de Lote',
                  headerBackTitle: 'Volver',
                }}
              />
            </Stack>
          </RealtimeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
