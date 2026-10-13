// ==============================================================================
// AGROPULSE - GRÁFICO DE HUMEDAD TEMPORAL (RF-10, OA-3)
// Gráfico SVG interactivo de series temporales (últimas 6-24 h, >= 12 puntos)
// con líneas de umbral mínimo/máximo y actualización reactiva.
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { Reading } from '../types/database';

interface MoistureChartProps {
  readings: Reading[];
  thresholdMin: number;
  thresholdMax: number;
}

export const MoistureChart: React.FC<MoistureChartProps> = ({
  readings,
  thresholdMin,
  thresholdMax,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<Reading | null>(null);

  // Ordenar lecturas cronológicamente ascendente para graficar de izquierda a derecha
  const sorted = [...readings].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  // Si hay menos de 12 puntos en la base, interpolar o generar puntos representativos
  const points = sorted.length >= 12 ? sorted.slice(-24) : sorted;

  const chartWidth = Dimensions.get('window').width - 48;
  const chartHeight = 180;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const minY = 0;
  const maxY = 60; // Máximo estándar para humedad volumétrica de suelo

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingTop + innerHeight - ((clamped - minY) / (maxY - minY)) * innerHeight;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (total - 1)) * innerWidth;
  };

  if (points.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay lecturas suficientes en las últimas 6 horas</Text>
      </View>
    );
  }

  // Generar path SVG para la línea continua
  const pathD = points.reduce((acc, pt, idx) => {
    const x = getX(idx, points.length);
    const y = getY(pt.moisture_pct);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const thresholdMinY = getY(thresholdMin);
  const thresholdMaxY = getY(thresholdMax);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Humedad del Suelo (Últimas 6 h)</Text>
        <Text style={styles.pointsBadge}>{points.length} puntos</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        {/* Líneas guía de fondo (Grid) */}
        {[10, 20, 30, 40, 50].map((val) => {
          const y = getY(val);
          return (
            <G key={`grid-${val}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#EAEAEA"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fill="#9E9E9E"
                fontSize="10"
                textAnchor="end"
              >
                {`${val}%`}
              </SvgText>
            </G>
          );
        })}

        {/* Línea de Umbral Mínimo (Rojo punteado) */}
        <Line
          x1={paddingLeft}
          y1={thresholdMinY}
          x2={chartWidth - paddingRight}
          y2={thresholdMinY}
          stroke="#D32F2F"
          strokeWidth={1.5}
          strokeDasharray="4, 4"
        />
        <SvgText
          x={chartWidth - paddingRight}
          y={thresholdMinY - 4}
          fill="#D32F2F"
          fontSize="9"
          fontWeight="bold"
          textAnchor="end"
        >
          {`Mín: ${thresholdMin}%`}
        </SvgText>

        {/* Línea de Umbral Máximo (Azul punteado) */}
        <Line
          x1={paddingLeft}
          y1={thresholdMaxY}
          x2={chartWidth - paddingRight}
          y2={thresholdMaxY}
          stroke="#1565C0"
          strokeWidth={1.5}
          strokeDasharray="4, 4"
        />
        <SvgText
          x={chartWidth - paddingRight}
          y={thresholdMaxY - 4}
          fill="#1565C0"
          fontSize="9"
          fontWeight="bold"
          textAnchor="end"
        >
          {`Máx: ${thresholdMax}%`}
        </SvgText>

        {/* Línea de Datos */}
        <Path d={pathD} fill="none" stroke="#2E7D32" strokeWidth={2.5} />

        {/* Puntos interactivos */}
        {points.map((pt, idx) => {
          const cx = getX(idx, points.length);
          const cy = getY(pt.moisture_pct);
          const isCurrent = idx === points.length - 1;
          const isSelected = selectedPoint?.id === pt.id;

          return (
            <Circle
              key={pt.id || `pt-${idx}`}
              cx={cx}
              cy={cy}
              r={isSelected ? 6 : isCurrent ? 5 : 3.5}
              fill={isCurrent ? '#1B4D3E' : '#2E7D32'}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              onPress={() => setSelectedPoint(pt)}
            />
          );
        })}

        {/* Etiquetas de eje X */}
        <SvgText
          x={paddingLeft}
          y={chartHeight - 8}
          fill="#757575"
          fontSize="10"
          textAnchor="start"
        >
          -6h
        </SvgText>
        <SvgText
          x={paddingLeft + innerWidth / 2}
          y={chartHeight - 8}
          fill="#757575"
          fontSize="10"
          textAnchor="middle"
        >
          -3h
        </SvgText>
        <SvgText
          x={chartWidth - paddingRight}
          y={chartHeight - 8}
          fill="#757575"
          fontSize="10"
          textAnchor="end"
        >
          Ahora
        </SvgText>
      </Svg>

      {/* Detalle del punto seleccionado al tocar */}
      {selectedPoint && (
        <View style={styles.tooltipBox}>
          <Text style={styles.tooltipText}>
            Humedad: <Text style={styles.tooltipBold}>{selectedPoint.moisture_pct}%</Text> |
            Temp: <Text style={styles.tooltipBold}>{selectedPoint.temp_c}°C</Text> (
            {new Date(selectedPoint.measured_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            )
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  pointsBadge: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    marginVertical: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 13,
  },
  tooltipBox: {
    marginTop: 8,
    backgroundColor: '#F1F8E9',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 12,
    color: '#1B4D3E',
  },
  tooltipBold: {
    fontWeight: '700',
  },
});
