// ==============================================================================
// AGROPULSE - LISTADO DE LOTES AGRÍCOLAS (RF-04, RF-07)
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert as NativeAlert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../src/context/RealtimeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Plot, PlotStatus } from '../../src/types/database';
import { SemaforoBadge } from '../../src/components/SemaforoBadge';
import { formatRelativeTime } from '../../src/utils/semaforo';
import { supabase } from '../../src/lib/supabase';

export default function PlotsTabScreen() {
  const router = useRouter();
  const { plots, refreshData } = useRealtime();
  const { activeOrganization, currentRole } = useAuth();

  const [filter, setFilter] = useState<'all' | PlotStatus>('all');
  const [modalNewPlot, setModalNewPlot] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotCrop, setNewPlotCrop] = useState('');
  const [savingPlot, setSavingPlot] = useState(false);

  const filteredPlots = plots.filter((plot) => {
    if (filter === 'all') return true;
    return plot.status === filter;
  });

  const handleCreatePlot = async () => {
    if (!newPlotName.trim() || !newPlotCrop.trim()) {
      NativeAlert.alert('Datos requeridos', 'Ingrese nombre del lote y tipo de cultivo.');
      return;
    }

    if (!activeOrganization) return;

    setSavingPlot(true);
    // Polígono simplificado didáctico de 4 vértices (RF-07)
    const baseLat = -31.403;
    const baseLng = -58.025;
    const offset = (plots.length + 1) * 0.005;

    const newGeom = [
      { latitude: baseLat - offset, longitude: baseLng },
      { latitude: baseLat - offset, longitude: baseLng + 0.006 },
      { latitude: baseLat - offset - 0.004, longitude: baseLng + 0.006 },
      { latitude: baseLat - offset - 0.004, longitude: baseLng },
    ];

    try {
      const { data: newPlotData, error } = await supabase
        .from('plots')
        .insert({
          organization_id: activeOrganization.id,
          name: newPlotName.trim(),
          crop: newPlotCrop.trim(),
          geom: newGeom,
          threshold_min: 25.0,
          threshold_max: 45.0,
        })
        .select()
        .single();

      if (error) {
        NativeAlert.alert('Error', error.message);
      } else {
        // Crear también una estación y válvula por defecto para el lote (RF-08, RF-13)
        if (newPlotData) {
          await supabase.from('stations').insert({
            plot_id: newPlotData.id,
            name: `Estación ${newPlotName}`,
            lat: baseLat - offset - 0.002,
            lng: baseLng + 0.003,
          });

          await supabase.from('valves').insert({
            plot_id: newPlotData.id,
            name: `Válvula Principal ${newPlotName}`,
            status: 'closed',
          });
        }

        setModalNewPlot(false);
        setNewPlotName('');
        setNewPlotCrop('');
        await refreshData();
      }
    } catch (err: any) {
      NativeAlert.alert('Excepción', err.message);
    } finally {
      setSavingPlot(false);
    }
  };

  const renderPlotCard = ({ item }: { item: Plot }) => {
    return (
      <TouchableOpacity
        style={styles.plotCard}
        onPress={() => router.push(`/plot/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.plotName}>{item.name}</Text>
            <Text style={styles.plotCrop}>{item.crop}</Text>
          </View>
          <SemaforoBadge status={item.status || 'stale'} size="small" />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Humedad actual</Text>
            <Text style={styles.metricValue}>
              {item.latestReading ? `${item.latestReading.moisture_pct}%` : 'Sin datos'}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Umbral Mín.</Text>
            <Text style={styles.metricValue}>{item.threshold_min}%</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Último reporte</Text>
            <Text style={styles.metricValue}>
              {formatRelativeTime(item.latestReading?.measured_at)}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerAction}>Tocar para ver detalle y válvulas</Text>
          <Ionicons name="chevron-forward" size={16} color="#1B4D3E" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de Filtros */}
      <View style={styles.filtersBar}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todos ({plots.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'dry' && styles.filterChipActive]}
          onPress={() => setFilter('dry')}
        >
          <Text style={[styles.filterText, filter === 'dry' && styles.filterTextActive]}>
            Secos ({plots.filter((p) => p.status === 'dry').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'optimal' && styles.filterChipActive]}
          onPress={() => setFilter('optimal')}
        >
          <Text style={[styles.filterText, filter === 'optimal' && styles.filterTextActive]}>
            Óptimos ({plots.filter((p) => p.status === 'optimal').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'stale' && styles.filterChipActive]}
          onPress={() => setFilter('stale')}
        >
          <Text style={[styles.filterText, filter === 'stale' && styles.filterTextActive]}>
            Stale ({plots.filter((p) => p.status === 'stale').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Lotes */}
      <FlatList
        data={filteredPlots}
        keyExtractor={(item) => item.id}
        renderItem={renderPlotCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={40} color="#999" />
            <Text style={styles.emptyText}>No hay lotes con el filtro seleccionado.</Text>
          </View>
        }
      />

      {/* Botón Flotante para crear nuevo lote (RF-07) */}
      {currentRole === 'producer' && (
        <TouchableOpacity style={styles.addFab} onPress={() => setModalNewPlot(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Modal de Alta de Lote Simplificado (RF-07) */}
      <Modal visible={modalNewPlot} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alta de Nuevo Lote Agrícola (RF-07)</Text>
            <Text style={styles.modalSubtitle}>
              Se asignará automáticamente un polígono de 4 vértices en Concordia.
            </Text>

            <Text style={styles.inputLabel}>Nombre del Lote</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Costa 3 o Potrero Bajo"
              value={newPlotName}
              onChangeText={setNewPlotName}
            />

            <Text style={styles.inputLabel}>Cultivo</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Mandarina Nova / Trigo"
              value={newPlotCrop}
              onChangeText={setNewPlotCrop}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalNewPlot(false)}
                disabled={savingPlot}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleCreatePlot}
                disabled={savingPlot}
              >
                <Text style={styles.saveBtnText}>
                  {savingPlot ? 'Guardando...' : 'Crear Lote'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  filtersBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterChipActive: {
    backgroundColor: '#1B4D3E',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  plotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plotName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  plotCrop: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FBF9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#777',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  footerAction: {
    fontSize: 12,
    color: '#1B4D3E',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  addFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4D3E',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 14,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#777',
    fontWeight: '600',
  },
  saveModalBtn: {
    backgroundColor: '#1B4D3E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
