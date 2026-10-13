// ==============================================================================
// AGROPULSE - REGLAS DE NEGOCIO DEL SEMÁFORO (§08 del PRD)
// ==============================================================================

import { PlotStatus, Reading } from '../types/database';

export const DEFAULT_THRESHOLD_MIN = 25.0;
export const DEFAULT_THRESHOLD_MAX = 45.0;
export const STALE_TIMEOUT_MINUTES = 15;
export const STALE_TIMEOUT_MS = STALE_TIMEOUT_MINUTES * 60 * 1000;

export interface SemaforoInfo {
  status: PlotStatus;
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Calcula el estado derivado del lote (plot_status) siguiendo rigurosamente
 * el orden de precedencia y las condiciones estipuladas en la sección §08:
 * 
 * 1. stale   (Gris)  -> No hay lectura o now - measured_at > 15 min
 * 2. dry     (Rojo)  -> moisture_pct < threshold_min
 * 3. optimal (Verde) -> threshold_min <= moisture_pct <= threshold_max
 * 4. wet     (Azul)  -> moisture_pct > threshold_max
 */
export function calculatePlotStatus(
  latestReading: Reading | null | undefined,
  thresholdMin: number = DEFAULT_THRESHOLD_MIN,
  thresholdMax: number = DEFAULT_THRESHOLD_MAX,
  referenceNow: Date = new Date()
): PlotStatus {
  // 1. Condición Stale
  if (!latestReading || !latestReading.measured_at) {
    return 'stale';
  }

  const readingDate = new Date(latestReading.measured_at);
  const diffMs = referenceNow.getTime() - readingDate.getTime();

  if (isNaN(diffMs) || diffMs > STALE_TIMEOUT_MS) {
    return 'stale';
  }

  const moisture = Number(latestReading.moisture_pct);
  const min = Number(thresholdMin ?? DEFAULT_THRESHOLD_MIN);
  const max = Number(thresholdMax ?? DEFAULT_THRESHOLD_MAX);

  // 2. Condición Dry
  if (moisture < min) {
    return 'dry';
  }

  // 3. Condición Optimal
  if (moisture <= max) {
    return 'optimal';
  }

  // 4. Condición Wet
  return 'wet';
}

/**
 * Retorna la metadata visual y accesible (WCAG) del semáforo.
 * Cumple con RNF-05 y el criterio de accesibilidad: no depender exclusivamente del color.
 */
export function getSemaforoMeta(status: PlotStatus): SemaforoInfo {
  switch (status) {
    case 'dry':
      return {
        status: 'dry',
        color: '#D32F2F',
        backgroundColor: '#FFEBEE',
        borderColor: '#FFCDD2',
        label: 'Seco',
        icon: 'alert-circle',
        description: 'Humedad crítica bajo el umbral mínimo. Se sugiere iniciar riego.',
      };
    case 'optimal':
      return {
        status: 'optimal',
        color: '#2E7D32',
        backgroundColor: '#E8F5E9',
        borderColor: '#C8E6C9',
        label: 'Óptimo',
        icon: 'checkmark-circle',
        description: 'Humedad en rango ideal para el desarrollo del cultivo.',
      };
    case 'wet':
      return {
        status: 'wet',
        color: '#1565C0',
        backgroundColor: '#E3F2FD',
        borderColor: '#BBDEFB',
        label: 'Húmedo',
        icon: 'water',
        description: 'Suelo saturado o sobre el umbral máximo. Suspender riego.',
      };
    case 'stale':
    default:
      return {
        status: 'stale',
        color: '#616161',
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
        label: 'Sin datos (Stale)',
        icon: 'time-outline',
        description: 'Sin telemetría reciente (> 15 min). Posible corte de sensor o broker.',
      };
  }
}

/**
 * Formatea la antigüedad relativa de una lectura según RF-09 ("hace 12 s", "hace 4 min", "hace 2 h").
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Sin lecturas registradas';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 0) return 'Ahora';
  if (diffSec < 60) return `hace ${diffSec} s`;
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} d`;
}
