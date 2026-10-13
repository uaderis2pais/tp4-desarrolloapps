// ==============================================================================
// AGROPULSE - PANTALLA DE OBSERVABILIDAD Y DIAGNÓSTICO (RF-23)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useRealtime } from '../../src/context/RealtimeContext';

export default function DiagnosticsTabScreen() {
  const { user, activeOrganization, currentRole } = useAuth();
  const {
    lastTickReceived,
    apparentLagMs,
    isOnline,
    offlineQueueCount,
    syncPendingOfflineQueue,
  } = useRealtime();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="hardware-chip-outline" size={28} color="#1B4D3E" />
        <Text style={styles.headerTitle}>Panel de Diagnóstico Académico (RF-23)</Text>
      </View>

      <Text style={styles.headerDesc}>
        Métricas de telemetría, latencia aparente, estado de red y cola local para la defensa
        técnica.
      </Text>

      {/* Tarjeta de Identidad y Contexto */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identidad & Contexto de Acceso</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Usuario ID (UUID):</Text>
          <Text style={styles.codeValue}>{user?.id || 'No autenticado'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email Activo:</Text>
          <Text style={styles.value}>{user?.email || '--'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rol en Organización:</Text>
          <Text style={[styles.value, styles.roleHighlight]}>
            {currentRole?.toUpperCase() || 'SIN ROL'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Establecimiento:</Text>
          <Text style={styles.value}>
            {activeOrganization ? `${activeOrganization.name} (${activeOrganization.id})` : '--'}
          </Text>
        </View>
      </View>

      {/* Tarjeta de Telemetría y Lag Aparente */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Métricas de Telemetría & Streaming</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Último Tick Recibido:</Text>
          <Text style={styles.value}>
            {lastTickReceived ? lastTickReceived.toLocaleTimeString() : 'Aguardando telemetría...'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Lag Aparente:</Text>
          <View style={styles.lagBadge}>
            <Text style={styles.lagValue}>
              {apparentLagMs !== null ? `${apparentLagMs} ms` : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Estado de Red:</Text>
          <View style={styles.statusIndicatorRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isOnline ? '#2E7D32' : '#D32F2F' },
              ]}
            />
            <Text style={{ fontWeight: '600', color: isOnline ? '#2E7D32' : '#D32F2F' }}>
              {isOnline ? 'Conectado a Supabase' : 'Desconectado / Modo Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Cola Local Persistente:</Text>
          <Text style={styles.value}>{offlineQueueCount} operaciones pendientes</Text>
        </View>
      </View>

      {/* Tarjeta de Arquitectura y Fronteras */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fronteras de Arquitectura (§11 / OA-7)</Text>
        <Text style={styles.architectureText}>
          • <Text style={{ fontWeight: 'bold' }}>App Móvil:</Text> Consume Supabase Auth, Postgres
          con RLS y WebSocket Realtime.{'\n'}• <Text style={{ fontWeight: 'bold' }}>Broker:</Text>{' '}
          Redpanda solo es accesible por el worker en backend. Ningún cliente Kafka corre dentro del
          móvil (OA-7).{'\n'}• <Text style={{ fontWeight: 'bold' }}>Seguridad (RNF-02):</Text> Solo
          clave anon pública. La clave service_role reside exclusivamente en el worker backend.
        </Text>
      </View>

      {/* Botón de Sincronización Forzada */}
      <TouchableOpacity style={styles.syncButton} onPress={syncPendingOfflineQueue}>
        <Ionicons name="refresh" size={18} color="#FFFFFF" />
        <Text style={styles.syncButtonText}>Forzar Sincronización de Cola Local</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B4D3E',
  },
  headerDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4D3E',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
    marginBottom: 12,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#444',
    backgroundColor: '#F5F5F5',
    padding: 4,
    borderRadius: 4,
  },
  roleHighlight: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  lagBadge: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  lagValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  architectureText: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
  syncButton: {
    backgroundColor: '#1B4D3E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
