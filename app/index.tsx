// ==============================================================================
// AGROPULSE - ENTRADA Y REDIRECCIÓN SEGÚN ESTADO DE SESIÓN
// ==============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="leaf" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.appTitle}>AgroPulse</Text>
        <Text style={styles.appSubtitle}>Agricultura de Precisión</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/map" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#A5D6A7',
    marginTop: 4,
  },
});
