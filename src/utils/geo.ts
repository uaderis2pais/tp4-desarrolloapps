// ==============================================================================
// AGROPULSE - UTILIDADES GEOESPACIALES Y POINT-IN-POLYGON (RF-06)
// ==============================================================================

import { GeoPoint } from '../types/database';

/**
 * Determina si unas coordenadas geográficas (lat, lng) se encuentran dentro
 * del polígono del lote utilizando el algoritmo clásico de Ray-Casting (Paridad de Jordan).
 */
export function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  let inside = false;
  const x = point.longitude;
  const y = point.latitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calcula el centroide (latitud/longitud promedio) de un polígono
 */
export function calculateCentroid(points: GeoPoint[]): GeoPoint {
  if (!points || points.length === 0) {
    return { latitude: -31.3929, longitude: -58.0209 }; // Coordenadas por defecto (Concordia)
  }

  let sumLat = 0;
  let sumLng = 0;

  for (const p of points) {
    sumLat += p.latitude;
    sumLng += p.longitude;
  }

  return {
    latitude: sumLat / points.length,
    longitude: sumLng / points.length,
  };
}

/**
 * Calcula la distancia en metros entre dos puntos geográficos (Fórmula de Haversine)
 */
export function haversineDistanceMeters(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = (p1.latitude * Math.PI) / 180;
  const phi2 = (p2.latitude * Math.PI) / 180;
  const deltaPhi = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const deltaLambda = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
