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

  private static processSegment(segment: SemanticSegment, index: number): ProcessedTrip | null {
    try {
      const startTime = parseISO(segment.startTime);
      const endTime = parseISO(segment.endTime);

      // Handle visit segments (places)
      if (segment.visit && segment.visit.topCandidate) {
        const candidate = segment.visit.topCandidate;
        let location: LatLng;
        
        if (candidate.location) {
          location = candidate.location;
        } else if (segment.timelinePath && segment.timelinePath.length > 0) {
          location = this.parseLatLngString(segment.timelinePath[0].point);
        } else {
          return null;
        }

        return {
          id: `visit-${index}`,
          startTime,
          endTime,
          startLocation: location,
          endLocation: location,
          placeName: candidate.name,
          address: candidate.address,
          confidence: segment.visit.probability || candidate.placeConfidence || 0,
          activityType: 'STAY'
        };
      }

      // Handle activity segments (movement)
      if (segment.activity && segment.activity.start && segment.activity.end) {
        const startLocation = this.parseLatLngString(segment.activity.start.latLng);
        const endLocation = this.parseLatLngString(segment.activity.end.latLng);
        
        const distance = segment.activity.distanceMeters || 
                        this.calculateDistance(startLocation, endLocation);

        return {
          id: `activity-${index}`,
          startTime,
          endTime,
          startLocation,
          endLocation,
          distanceMeters: distance,
          activityType: segment.activity.topCandidate?.type || 'UNKNOWN',
          confidence: segment.activity.probability || segment.activity.topCandidate?.probability || 0
        };
      }

      // Handle segments with timeline path but no specific activity/visit info
      if (segment.timelinePath && segment.timelinePath.length >= 2) {
        const startPoint = this.parseLatLngString(segment.timelinePath[0].point);
        const endPoint = this.parseLatLngString(segment.timelinePath[segment.timelinePath.length - 1].point);
        
        const distance = this.calculateDistance(startPoint, endPoint);

        // Only include if there's meaningful movement (>100m)
        if (distance > 100) {
          return {
            id: `path-${index}`,
            startTime,
            endTime,
            startLocation: startPoint,
            endLocation: endPoint,
            distanceMeters: distance,
            activityType: 'MOVEMENT',
            confidence: 0.5
          };
        }
      }

      return null;
    } catch (error) {
      console.warn(`Error processing segment ${index}:`, error);
      return null;
    }
  }

  
}