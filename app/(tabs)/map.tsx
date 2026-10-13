// ==============================================================================
// AGROPULSE - PANTALLA PRINCIPAL DE MAPA (RF-04, RF-05, RF-06)
// ==============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../src/context/RealtimeContext';
import { useAuth } from '../../src/context/AuthContext';
import { PlotPolygonMap } from '../../src/components/PlotPolygonMap';

export default function MapTabScreen() {
  const { plots, loading, refreshData } = useRealtime();
  const { activeOrganization, currentRole } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const dryCount = plots.filter((p) => p.status === 'dry').length;
  const optimalCount = plots.filter((p) => p.status === 'optimal').length;
  const wetCount = plots.filter((p) => p.status === 'wet').length;
  const staleCount = plots.filter((p) => p.status === 'stale').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Barra de Encabezado con Establecimiento y Rol */}
      <View style={styles.orgHeader}>
        <View>
          <Text style={styles.orgTitle}>
            {activeOrganization?.name || 'Establecimiento Agropecuario'}
          </Text>
          <Text style={styles.orgRegion}>
            {activeOrganization?.region || 'Concordia, Entre Ríos'}
          </Text>
        </View>

        <View style={styles.roleChip}>
          <Ionicons
            name={
              currentRole === 'producer'
                ? 'shield-checkmark'
                : currentRole === 'operator'
                ? 'water'
                : 'eye'
            }
            size={14}
            color="#1B4D3E"
          />
          <Text style={styles.roleChipText}>
            {currentRole === 'producer'
              ? 'Productor'
              : currentRole === 'operator'
              ? 'Operador'
              : 'Asesor'}
          </Text>
        </View>
      </View>

      {/* Barra de Resumen Rápido de Estados */}
      <View style={styles.statsBar}>
        <View style={styles.statPill}>
          <View style={[styles.statDot, { backgroundColor: '#2E7D32' }]} />
          <Text style={styles.statCount}>{optimalCount}</Text>
          <Text style={styles.statLabel}>Óptimos</Text>
        </View>

        <View style={styles.statPill}>
          <View style={[styles.statDot, { backgroundColor: '#D32F2F' }]} />
          <Text style={styles.statCount}>{dryCount}</Text>
          <Text style={styles.statLabel}>Secos</Text>
        </View>

        <View style={styles.statPill}>
          <View style={[styles.statDot, { backgroundColor: '#1565C0' }]} />
          <Text style={styles.statCount}>{wetCount}</Text>
          <Text style={styles.statLabel}>Húmedos</Text>
        </View>

        <View style={styles.statPill}>
          <View style={[styles.statDot, { backgroundColor: '#757575' }]} />
          <Text style={styles.statCount}>{staleCount}</Text>
          <Text style={styles.statLabel}>Stale</Text>
        </View>
      </View>

      {loading && plots.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B4D3E" />
          <Text style={styles.loadingText}>Cargando mapa de polígonos...</Text>
        </View>
      ) : plots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color="#999" />
          <Text style={styles.emptyTitle}>No hay lotes en esta organización</Text>
          <Text style={styles.emptySubtitle}>
            Selecciona otra organización desde la pestaña Cuenta.
          </Text>
        </View>
      ) : (
        <PlotPolygonMap plots={plots} />
      )}
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
    paddingBottom: 32,
  },
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orgTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B4D3E',
  },
  orgRegion: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 4,
  },
});
