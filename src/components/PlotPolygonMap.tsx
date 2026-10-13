// ==============================================================================
// AGROPULSE - MAPA VECTORIAL INTERACTIVO CON POLÍGONOS Y GPS (RF-05, RF-06)
// Renderiza polígonos agrícolas, colores de semáforo, leyenda y cálculo
// en tiempo real de "Estoy en el lote" (Point-in-Polygon).
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, G } from 'react-native-svg';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Plot, GeoPoint } from '../types/database';
import { isPointInPolygon } from '../utils/geo';
import { getSemaforoMeta } from '../utils/semaforo';
import { SemaforoBadge } from './SemaforoBadge';

interface PlotPolygonMapProps {
  plots: Plot[];
  selectedPlotId?: string | null;
  onSelectPlot?: (plot: Plot) => void;
}

export const PlotPolygonMap: React.FC<PlotPolygonMapProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
}) => {
  const router = useRouter();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Ubicación no solicitada');
  const [isInsidePlot, setIsInsidePlot] = useState<Plot | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);

  useEffect(() => {
    if (selectedPlotId) {
      const found = plots.find((p) => p.id === selectedPlotId);
      if (found) setSelectedPlot(found);
    } else if (plots.length > 0 && !selectedPlot) {
      setSelectedPlot(plots[0]);
    }
  }, [selectedPlotId, plots]);

  // Verificar presencia en el lote cuando cambia la ubicación
  useEffect(() => {
    if (!userLocation) {
      setIsInsidePlot(null);
      return;
    }

    let foundInside: Plot | null = null;
    for (const plot of plots) {
      if (isPointInPolygon(userLocation, plot.geom)) {
        foundInside = plot;
        break;
      }
    }
    setIsInsidePlot(foundInside);
  }, [userLocation, plots]);

  // Obtener ubicación GPS con manejo seguro de permisos (RF-06)
  const handleRequestLocation = async (simulateInsideCosta2: boolean = false) => {
    setLoadingGps(true);
    try {
      if (simulateInsideCosta2) {
        // Coordenada didáctica dentro del lote Costa 2 (-31.3995, -58.0215)
        const mockGps = { latitude: -31.3995, longitude: -58.0215 };
        setUserLocation(mockGps);
        setLocationStatus('GPS Simulado dentro de Costa 2');
        setLoadingGps(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('Ubicación no disponible (permiso denegado)');
        setLoadingGps(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: GeoPoint = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserLocation(coords);
      setLocationStatus(`GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    } catch (err) {
      console.warn('[PlotPolygonMap] Error accediendo a ubicación:', err);
      setLocationStatus('Ubicación no disponible');
    } finally {
      setLoadingGps(false);
    }
  };

  // Cálculo del bounding box para proyectar coordenadas geográficas al espacio SVG
  const allPoints: GeoPoint[] = plots.flatMap((p) => p.geom);
  if (userLocation) allPoints.push(userLocation);

  const minLat = allPoints.length > 0 ? Math.min(...allPoints.map((p) => p.latitude)) - 0.002 : -31.405;
  const maxLat = allPoints.length > 0 ? Math.max(...allPoints.map((p) => p.latitude)) + 0.002 : -31.388;
  const minLng = allPoints.length > 0 ? Math.min(...allPoints.map((p) => p.longitude)) - 0.003 : -58.036;
  const maxLng = allPoints.length > 0 ? Math.max(...allPoints.map((p) => p.longitude)) + 0.003 : -58.015;

  const mapWidth = Dimensions.get('window').width - 32;
  const mapHeight = 320;

  // Convierte lat/lng a puntos (x, y) en pantalla
  const project = (point: GeoPoint) => {
    const x = ((point.longitude - minLng) / (maxLng - minLng)) * (mapWidth - 40) + 20;
    // Latitud invertida (el norte está arriba en pantalla)
    const y = ((maxLat - point.latitude) / (maxLat - minLat)) * (mapHeight - 40) + 20;
    return { x, y };
  };

  return (
    <View style={styles.container}>
      {/* Indicador de presencia en lote "Estoy en el lote" (RF-06) */}
      <View style={styles.statusBar}>
        <Ionicons
          name={isInsidePlot ? 'navigate' : 'location-outline'}
          size={18}
          color={isInsidePlot ? '#2E7D32' : '#666'}
        />
        <Text style={[styles.statusText, isInsidePlot && styles.statusTextActive]}>
          {isInsidePlot
            ? `¡Estás dentro del lote ${isInsidePlot.name}!`
            : userLocation
            ? 'Te encuentras fuera de los lotes monitoreados'
            : locationStatus}
        </Text>
      </View>

      {/* Visor SVG de Polígonos */}
      <View style={styles.mapFrame}>
        <Svg width={mapWidth} height={mapHeight}>
          {plots.map((plot) => {
            const isSelected = selectedPlot?.id === plot.id;
            const meta = getSemaforoMeta(plot.status || 'stale');
            const pointsString = plot.geom
              .map((p) => {
                const projected = project(p);
                return `${projected.x},${projected.y}`;
              })
              .join(' ');

            // Centro para el texto
            const centerPoint = project(plot.geom[0]);

            return (
              <G key={plot.id}>
                <Polygon
                  points={pointsString}
                  fill={meta.color}
                  fillOpacity={isSelected ? 0.65 : 0.35}
                  stroke={isSelected ? '#1B4D3E' : meta.color}
                  strokeWidth={isSelected ? 3 : 1.5}
                  onPress={() => {
                    setSelectedPlot(plot);
                    if (onSelectPlot) onSelectPlot(plot);
                  }}
                />
                <SvgText
                  x={centerPoint.x + 10}
                  y={centerPoint.y + 15}
                  fill="#1B4D3E"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {plot.name}
                </SvgText>
              </G>
            );
          })}

          {/* Marcador de ubicación del usuario */}
          {userLocation && (
            <G>
              <Circle
                cx={project(userLocation).x}
                cy={project(userLocation).y}
                r={10}
                fill="#2979FF"
                fillOpacity={0.3}
              />
              <Circle
                cx={project(userLocation).x}
                cy={project(userLocation).y}
                r={5}
                fill="#1565C0"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </G>
          )}
        </Svg>

        {/* Botones Flotantes (FABs) de Ubicación */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => handleRequestLocation(false)}
            disabled={loadingGps}
          >
            {loadingGps ? (
              <ActivityIndicator size="small" color="#1B4D3E" />
            ) : (
              <Ionicons name="locate" size={20} color="#1B4D3E" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fab, styles.fabSecondary]}
            onPress={() => handleRequestLocation(true)}
            accessibilityLabel="Simular dentro de Costa 2"
          >
            <Ionicons name="pin" size={18} color="#D32F2F" />
          </TouchableOpacity>
        </View>

        {/* Leyenda de Semáforo */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2E7D32' }]} />
            <Text style={styles.legendText}>Óptimo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D32F2F' }]} />
            <Text style={styles.legendText}>Seco</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1565C0' }]} />
            <Text style={styles.legendText}>Húmedo</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#757575' }]} />
            <Text style={styles.legendText}>Stale</Text>
          </View>
        </View>
      </View>

      {/* Selector Rápido de Lotes en Chips */}
      <View style={styles.plotChipsContainer}>
        {plots.map((plot) => {
          const isSelected = selectedPlot?.id === plot.id;
          const meta = getSemaforoMeta(plot.status || 'stale');
          return (
            <TouchableOpacity
              key={plot.id}
              style={[styles.plotChip, isSelected && styles.plotChipSelected]}
              onPress={() => {
                setSelectedPlot(plot);
                if (onSelectPlot) onSelectPlot(plot);
              }}
            >
              <View style={[styles.plotChipDot, { backgroundColor: meta.color }]} />
              <Text
                style={[
                  styles.plotChipText,
                  isSelected && styles.plotChipTextSelected,
                ]}
              >
                {plot.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tarjeta inferior del lote seleccionado (Tap en polígono abre detalle) */}
      {selectedPlot && (
        <View style={styles.plotCard}>
          <View style={styles.plotCardHeader}>
            <View>
              <Text style={styles.plotCardTitle}>{selectedPlot.name}</Text>
              <Text style={styles.plotCardCrop}>{selectedPlot.crop}</Text>
            </View>
            <SemaforoBadge status={selectedPlot.status || 'stale'} size="medium" />
          </View>

          <View style={styles.plotCardStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Humedad</Text>
              <Text style={styles.statValue}>
                {selectedPlot.latestReading
                  ? `${selectedPlot.latestReading.moisture_pct}%`
                  : '--'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Umbral Mín.</Text>
              <Text style={styles.statValue}>{selectedPlot.threshold_min}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Temperatura</Text>
              <Text style={styles.statValue}>
                {selectedPlot.latestReading
                  ? `${selectedPlot.latestReading.temp_c}°C`
                  : '--'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => router.push(`/plot/${selectedPlot.id}` as any)}
          >
            <Text style={styles.detailButtonText}>Ver Detalle Completo y Válvulas</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  mapFrame: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  fab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  fabSecondary: {
    backgroundColor: '#FFEBEE',
  },
  legendContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
  plotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  plotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plotCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  plotCardCrop: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  plotCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FBF9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#777',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  detailButton: {
    backgroundColor: '#1B4D3E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  plotChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  plotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  plotChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B4D3E',
  },
  plotChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  plotChipText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  plotChipTextSelected: {
    color: '#1B4D3E',
    fontWeight: '700',
  },
});
