import type { LatLng } from '../types/travel';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate total distance for a sequence of points
 */
export function calculateTotalDistance(points: LatLng[]): number {
  if (points.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i - 1], points[i]);
  }
  
  return totalDistance;
}

/**
 * Check if two points are within a certain proximity
 */
export function arePointsNearby(point1: LatLng, point2: LatLng, thresholdKm: number = 0.5): boolean {
  return calculateDistance(point1, point2) <= thresholdKm;
}

/**
 * Get approximate timezone from longitude
 */
export function getTimezoneFromLongitude(longitude: number): string {
  const timezoneOffset = Math.round(longitude / 15);
  const sign = timezoneOffset >= 0 ? '+' : '';
  return `UTC${sign}${timezoneOffset}`;
}