// ==============================================================================
// AGROPULSE - PRUEBAS UNITARIAS: ALGORITMO POINT-IN-POLYGON (RF-06)
// ==============================================================================

import { isPointInPolygon, calculateCentroid, haversineDistanceMeters } from '../src/utils/geo';
import { GeoPoint } from '../src/types/database';

describe('Utilidades Geoespaciales y Detección de Presencia en Lote (RF-06)', () => {
  // Polígono del lote Costa 2 delimitado en la semilla didáctica
  const costa2Polygon: GeoPoint[] = [
    { latitude: -31.3970, longitude: -58.0250 },
    { latitude: -31.3970, longitude: -58.0180 },
    { latitude: -31.4020, longitude: -58.0180 },
    { latitude: -31.4020, longitude: -58.0250 },
  ];

  test('Detecta punto interior dentro del lote Costa 2', () => {
    // Coordenada interior
    const insidePoint: GeoPoint = { latitude: -31.3995, longitude: -58.0215 };
    expect(isPointInPolygon(insidePoint, costa2Polygon)).toBe(true);
  });

  test('Rechaza punto exterior fuera de los límites del lote', () => {
    // Coordenada al norte (afuera)
    const outsideNorth: GeoPoint = { latitude: -31.3900, longitude: -58.0215 };
    expect(isPointInPolygon(outsideNorth, costa2Polygon)).toBe(false);

    // Coordenada al este (afuera)
    const outsideEast: GeoPoint = { latitude: -31.3995, longitude: -58.0100 };
    expect(isPointInPolygon(outsideEast, costa2Polygon)).toBe(false);
  });

  test('Calcula correctamente el centroide del polígono', () => {
    const centroid = calculateCentroid(costa2Polygon);
    expect(centroid.latitude).toBeCloseTo(-31.3995, 4);
    expect(centroid.longitude).toBeCloseTo(-58.0215, 4);
  });

  test('Calcula la distancia Haversine en metros', () => {
    const p1: GeoPoint = { latitude: -31.3970, longitude: -58.0250 };
    const p2: GeoPoint = { latitude: -31.3970, longitude: -58.0180 };
    const dist = haversineDistanceMeters(p1, p2);
    // Aproximadamente ~660 metros
    expect(dist).toBeGreaterThan(600);
    expect(dist).toBeLessThan(750);
  });
});
