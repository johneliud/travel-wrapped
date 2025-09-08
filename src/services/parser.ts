import { parseISO } from 'date-fns';
import type { 
  GoogleTimelineData, 
  SemanticSegment, 
  ProcessedTrip, 
  LatLng, 
  ProcessingResult,
  TravelStats 
} from '../types/travel';

export class TimelineParser {
  private static parseLatLngString(latLngStr: string): LatLng {
    // Parse format like "-0.065945°, 34.7739183°"
    const [latStr, lngStr] = latLngStr.replace(/°/g, '').split(', ');
    return {
      latitude: parseFloat(latStr),
      longitude: parseFloat(lngStr)
    };
  }

  private static calculateDistance(point1: LatLng, point2: LatLng): number {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Convert to meters
  }

  
}