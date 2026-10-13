// ==============================================================================
// AGROPULSE - PANTALLA DE DETALLE DE LOTE (RF-09 A RF-18, RF-22)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert as NativeAlert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../src/context/RealtimeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Reading } from '../../src/types/database';
import { SemaforoBadge } from '../../src/components/SemaforoBadge';
import { MoistureChart } from '../../src/components/MoistureChart';
import { ValvesList } from '../../src/components/ValvesList';
import { CommandHistoryList } from '../../src/components/CommandHistoryList';
import { ManualReadingModal } from '../../src/components/ManualReadingModal';
import { formatRelativeTime } from '../../src/utils/semaforo';
import { supabase } from '../../src/lib/supabase';

export default function PlotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { plots, stations, valves, commands, refreshData } = useRealtime();
  const { currentRole } = useAuth();

  const [historicalReadings, setHistoricalReadings] = useState<Reading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edición de umbral mínimo (RF-11)
  const [isEditingThreshold, setIsEditingThreshold] = useState<boolean>(false);
  const [thresholdInput, setThresholdInput] = useState<string>('');
  const [savingThreshold, setSavingThreshold] = useState<boolean>(false);

  // Modal de lectura manual (RF-21)
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);

  const plot = plots.find((p) => p.id === id);
  const plotStation = stations.find((s) => s.plot_id === id);
  const plotValves = valves.filter((v) => v.plot_id === id);
  const plotValveIds = plotValves.map((v) => v.id);
  const plotCommands = commands.filter((c) => plotValveIds.includes(c.valve_id));

  // Carga de lecturas históricas para el gráfico de 6 horas (RF-10)
  const fetchReadings = async () => {
    if (!plotStation) {
      setLoadingReadings(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('station_id', plotStation.id)
        .order('measured_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setHistoricalReadings(data as Reading[]);
      }
    } catch (err) {
      console.warn('[PlotDetail] Error cargando historial:', err);
    } finally {
      setLoadingReadings(false);
    }
  };

  useEffect(() => {
    fetchReadings();
    if (plot) {
      setThresholdInput(String(plot.threshold_min));
    }
  }, [id, plotStation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await fetchReadings();
    setRefreshing(false);
  };

  const handleSaveThreshold = async () => {
    const val = parseFloat(thresholdInput);
    if (isNaN(val) || val < 0 || val > 100) {
      NativeAlert.alert('Valor inválido', 'El umbral debe ser un porcentaje entre 0 y 100%');
      return;
    }

    if (!plot) return;

    setSavingThreshold(true);
    try {
      const { error } = await supabase
        .from('plots')
        .update({ threshold_min: val })
        .eq('id', plot.id);

      if (error) {
        NativeAlert.alert('Error al guardar umbral', error.message);
      } else {
        setIsEditingThreshold(false);
        await refreshData();
      }
    } catch (e: any) {
      NativeAlert.alert('Excepción', e.message);
    } finally {
      setSavingThreshold(false);
    }
  };

  if (!plot) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
        <Text style={styles.notFoundTitle}>Lote no encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver a la lista de lotes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latest = plot.latestReading;
  const isBelowThreshold = latest && latest.moisture_pct < plot.threshold_min;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Cabecera del Lote */}
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.plotName}>{plot.name}</Text>
            <Text style={styles.cropName}>Cultivo: {plot.crop}</Text>
          </View>
          <SemaforoBadge status={plot.status || 'stale'} size="medium" />
        </View>

        {/* Antigüedad de la lectura (RF-09) */}
        <View style={styles.relativeAgeRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.relativeAgeText}>
            Último tick: {formatRelativeTime(latest?.measured_at)}
          </Text>
        </View>

        {plot.status === 'stale' && (
          <View style={styles.staleNoticeBox}>
            <Ionicons name="warning-outline" size={16} color="#616161" />
            <Text style={styles.staleNoticeText}>
              Estación sin telemetría reciente (&gt; 15 min). El lote se clasifica en estado stale
              (RF-09, H4).
            </Text>
          </View>
        )}
      </View>

      {/* Sugerencia Agronómica de una sola regla (RF-22) */}
      {isBelowThreshold && (
        <View style={styles.suggestionCard}>
          <Ionicons name="bulb-outline" size={22} color="#E65100" />
          <View style={{ flex: 1 }}>
            <Text style={styles.suggestionTitle}>Sugerencia Agronómica (RF-22)</Text>
            <Text style={styles.suggestionText}>
              Humedad bajo el umbral configurado ({latest?.moisture_pct}% &lt; {plot.threshold_min}%):
              considerar riego inmediato para evitar estrés hídrico.
            </Text>
          </View>
        </View>
      )}

      {/* Métricas Principales */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="water" size={20} color="#1B4D3E" />
          <Text style={styles.metricCardLabel}>Humedad Suelo</Text>
          <Text style={styles.metricCardValue}>
            {latest ? `${latest.moisture_pct}%` : '--'}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="thermometer-outline" size={20} color="#E65100" />
          <Text style={styles.metricCardLabel}>Temperatura</Text>
          <Text style={styles.metricCardValue}>
            {latest ? `${latest.temp_c}°C` : '--'}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="rainy-outline" size={20} color="#1565C0" />
          <Text style={styles.metricCardLabel}>Lluvia Acum.</Text>
          <Text style={styles.metricCardValue}>
            {latest ? `${latest.rain_mm} mm` : '0 mm'}
          </Text>
        </View>
      </View>

      {/* Gráfico de Humedad Temporal (RF-10, OA-3) */}
      {loadingReadings ? (
        <View style={styles.chartLoading}>
          <ActivityIndicator size="small" color="#1B4D3E" />
          <Text style={styles.chartLoadingText}>Cargando series temporales...</Text>
        </View>
      ) : (
        <MoistureChart
          readings={historicalReadings}
          thresholdMin={plot.threshold_min}
          thresholdMax={plot.threshold_max}
        />
      )}

      {/* Configuración de Umbral Mínimo (RF-11) */}
      <View style={styles.thresholdCard}>
        <View style={styles.thresholdHeader}>
          <View>
            <Text style={styles.thresholdTitle}>Umbral de Riego Mínimo (RF-11)</Text>
            <Text style={styles.thresholdSubtitle}>
              Dispara el semáforo rojo cuando la humedad cae por debajo.
            </Text>
          </View>

          {currentRole !== 'advisor' && !isEditingThreshold && (
            <TouchableOpacity
              style={styles.editThresholdBtn}
              onPress={() => setIsEditingThreshold(true)}
            >
              <Ionicons name="pencil" size={14} color="#1B4D3E" />
              <Text style={styles.editThresholdText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingThreshold ? (
          <View style={styles.thresholdEditRow}>
            <TextInput
              style={styles.thresholdInput}
              keyboardType="numeric"
              value={thresholdInput}
              onChangeText={setThresholdInput}
            />
            <Text style={styles.thresholdUnit}>%</Text>

            <TouchableOpacity
              style={styles.cancelThresholdBtn}
              onPress={() => {
                setThresholdInput(String(plot.threshold_min));
                setIsEditingThreshold(false);
              }}
              disabled={savingThreshold}
            >
              <Text style={styles.cancelThresholdText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveThresholdBtn}
              onPress={handleSaveThreshold}
              disabled={savingThreshold}
            >
              <Text style={styles.saveThresholdText}>
                {savingThreshold ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.thresholdDisplayValue}>{plot.threshold_min}% de humedad</Text>
        )}
      </View>

      {/* Botón de Cargar Lectura Manual en Campo (RF-21) */}
      {plotStation && currentRole !== 'advisor' && (
        <TouchableOpacity
          style={styles.manualReadingBtn}
          onPress={() => setManualModalOpen(true)}
        >
          <Ionicons name="clipboard-outline" size={18} color="#1B4D3E" />
          <Text style={styles.manualReadingBtnText}>
            Cargar Lectura Manual en Campo (Soporte Offline)
          </Text>
        </TouchableOpacity>
      )}

      {/* Lista de Válvulas y Emisión de Comandos (RF-13, RF-14, RF-15, RF-16) */}
      <ValvesList valves={plotValves} plotName={plot.name} />

      {/* Historial de Comandos Recientes (RF-18, RF-17) */}
      <CommandHistoryList commands={plotCommands} />

      {/* Modal de Lectura Manual */}
      {plotStation && (
        <ManualReadingModal
          visible={manualModalOpen}
          stationId={plotStation.id}
          plotId={plot.id}
          plotName={plot.name}
          onClose={() => {
            setManualModalOpen(false);
            fetchReadings();
          }}
        />
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
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plotName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B4D3E',
  },
  cropName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  relativeAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  relativeAgeText: {
    fontSize: 12,
    color: '#666',
  },
  staleNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    gap: 6,
    marginTop: 10,
  },
  staleNoticeText: {
    fontSize: 11,
    color: '#616161',
    flex: 1,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E65100',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
  },
  suggestionText: {
    fontSize: 12,
    color: '#BF360C',
    marginTop: 2,
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  metricCardLabel: {
    fontSize: 10,
    color: '#777',
    marginTop: 4,
    marginBottom: 2,
  },
  metricCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B4D3E',
  },
  chartLoading: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 10,
  },
  chartLoadingText: {
    marginTop: 8,
    color: '#888',
    fontSize: 12,
  },
  thresholdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  thresholdTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  thresholdSubtitle: {
    fontSize: 11,
    color: '#777',
    marginTop: 1,
  },
  editThresholdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editThresholdText: {
    fontSize: 12,
    color: '#1B4D3E',
    fontWeight: '700',
  },
  thresholdDisplayValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  thresholdEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  thresholdInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 60,
    fontSize: 15,
    textAlign: 'center',
  },
  thresholdUnit: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  cancelThresholdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelThresholdText: {
    color: '#777',
    fontSize: 12,
  },
  saveThresholdBtn: {
    backgroundColor: '#1B4D3E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveThresholdText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  manualReadingBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1B4D3E',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  manualReadingBtnText: {
    color: '#1B4D3E',
    fontWeight: '700',
    fontSize: 13,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#1B4D3E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
