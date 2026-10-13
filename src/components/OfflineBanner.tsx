// ==============================================================================
// AGROPULSE - BANNER DE ESTADO DE CONECTIVIDAD Y COLA OFFLINE (OA-6, RNF-07)
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../context/RealtimeContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, offlineQueueCount, syncPendingOfflineQueue } = useRealtime();

  if (isOnline && offlineQueueCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, !isOnline ? styles.offlineBg : styles.queuedBg]}>
      <View style={styles.content}>
        <Ionicons
          name={!isOnline ? 'cloud-offline-outline' : 'sync-outline'}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.text}>
          {!isOnline
            ? 'Modo sin conexión. Los comandos se guardarán localmente.'
            : `${offlineQueueCount} elemento(s) pendiente(s) de sincronizar.`}
        </Text>
      </View>

      {offlineQueueCount > 0 && isOnline && (
        <TouchableOpacity style={styles.syncButton} onPress={syncPendingOfflineQueue}>
          <Text style={styles.syncButtonText}>Sincronizar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  offlineBg: {
    backgroundColor: '#C62828',
  },
  queuedBg: {
    backgroundColor: '#E65100',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncButtonText: {
    color: '#E65100',
    fontSize: 11,
    fontWeight: '700',
  },
});
