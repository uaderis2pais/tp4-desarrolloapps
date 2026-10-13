// ==============================================================================
// AGROPULSE - PRUEBAS UNITARIAS: FÓRMULA DEL SEMÁFORO (§08, RNF-08)
// ==============================================================================

import { calculatePlotStatus, STALE_TIMEOUT_MS } from '../src/utils/semaforo';
import { Reading } from '../src/types/database';

describe('Cálculo de Semáforo de Lote (§08 del PRD)', () => {
  const referenceNow = new Date('2026-09-21T12:00:00Z');

  const createMockReading = (moisture: number, minutesAgo: number): Reading => {
    const measuredAt = new Date(referenceNow.getTime() - minutesAgo * 60 * 1000).toISOString();
    return {
      id: 'mock-reading-1',
      station_id: 'mock-station-1',
      measured_at: measuredAt,
      moisture_pct: moisture,
      temp_c: 24,
      rain_mm: 0,
      source: 'sensor',
    };
  };

  test('Condición 1: Retorna STALE (Gris) si no existe ninguna lectura', () => {
    const status = calculatePlotStatus(null, 25, 45, referenceNow);
    expect(status).toBe('stale');
  });

  test('Condición 1: Retorna STALE (Gris) si la última lectura tiene más de 15 minutos de antigüedad', () => {
    // 16 minutos de antigüedad > 15 min
    const reading = createMockReading(35.0, 16);
    const status = calculatePlotStatus(reading, 25, 45, referenceNow);
    expect(status).toBe('stale');
  });

  test('Condición 2: Retorna DRY (Rojo) si moisture_pct < threshold_min (con telemetría reciente)', () => {
    // 18% < 25% (caso Lote Costa 2 para H1) medido hace 2 minutos
    const reading = createMockReading(18.0, 2);
    const status = calculatePlotStatus(reading, 25, 45, referenceNow);
    expect(status).toBe('dry');
  });

  test('Condición 3: Retorna OPTIMAL (Verde) en el rango [threshold_min, threshold_max]', () => {
    // Exactamente en el límite inferior 25%
    const readingAtMin = createMockReading(25.0, 1);
    expect(calculatePlotStatus(readingAtMin, 25, 45, referenceNow)).toBe('optimal');

    // Valor intermedio 35% (caso Lote Costa 1)
    const readingMid = createMockReading(35.0, 1);
    expect(calculatePlotStatus(readingMid, 25, 45, referenceNow)).toBe('optimal');

    // Exactamente en el límite superior 45%
    const readingAtMax = createMockReading(45.0, 1);
    expect(calculatePlotStatus(readingAtMax, 25, 45, referenceNow)).toBe('optimal');
  });

  test('Condición 4: Retorna WET (Azul) si moisture_pct > threshold_max', () => {
    // 48% > 45% medido hace 1 minuto
    const reading = createMockReading(48.0, 1);
    const status = calculatePlotStatus(reading, 25, 45, referenceNow);
    expect(status).toBe('wet');
  });

  test('Prioridad de Stale sobre Seco (H4): Un sensor caído hace 20 minutos con 10% debe ser STALE, no DRY', () => {
    // Aunque tenga 10% de humedad, como hace 20 minutos no reporta, es stale
    const reading = createMockReading(10.0, 20);
    const status = calculatePlotStatus(reading, 25, 45, referenceNow);
    expect(status).toBe('stale');
  });

  test('Soporta umbrales personalizados configurados por el usuario', () => {
    // Umbral personalizado min=30, max=60
    const reading = createMockReading(28.0, 2);
    expect(calculatePlotStatus(reading, 30, 60, referenceNow)).toBe('dry');

    const readingOptimal = createMockReading(55.0, 2);
    expect(calculatePlotStatus(readingOptimal, 30, 60, referenceNow)).toBe('optimal');

    const readingWet = createMockReading(62.0, 2);
    expect(calculatePlotStatus(readingWet, 30, 60, referenceNow)).toBe('wet');
  });
});
