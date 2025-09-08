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

  private static calculateStats(trips: ProcessedTrip[]): TravelStats {
    if (trips.length === 0) {
      return {
        totalDistanceKm: 0,
        uniqueCities: 0,
        uniqueCountries: 0,
        longestTripKm: 0,
        mostVisitedLocation: 'No trips found',
        totalTrips: 0,
        firstTripDate: new Date(),
        lastTripDate: new Date()
      };
    }

    // Calculate total distance (only from movement activities)
    const totalDistance = trips
      .filter(trip => trip.distanceMeters && trip.activityType !== 'STAY')
      .reduce((sum, trip) => sum + (trip.distanceMeters || 0), 0);

    // Find longest single trip
    const longestTrip = trips
      .filter(trip => trip.distanceMeters && trip.activityType !== 'STAY')
      .reduce((max, trip) => 
        (trip.distanceMeters || 0) > (max.distanceMeters || 0) ? trip : max
      , trips[0]);

    // Count unique places (approximate by grouping nearby locations)
    const places = trips
      .filter(trip => trip.placeName)
      .map(trip => trip.placeName!)
      .filter((name, index, arr) => arr.indexOf(name) === index);

    // Find most visited location
    const locationCounts = trips
      .filter(trip => trip.placeName)
      .reduce((counts, trip) => {
        const name = trip.placeName!;
        counts[name] = (counts[name] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

    const mostVisitedLocation = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    // Get date range
    const dates = trips.map(trip => trip.startTime).sort((a, b) => a.getTime() - b.getTime());

    return {
      totalDistanceKm: Math.round(totalDistance / 1000 * 100) / 100,
      uniqueCities: places.length,
      uniqueCountries: 1, // Geocoding to determine actual countries
      longestTripKm: Math.round((longestTrip?.distanceMeters || 0) / 1000 * 100) / 100,
      mostVisitedLocation,
      totalTrips: trips.length,
      firstTripDate: dates[0],
      lastTripDate: dates[dates.length - 1]
    };
  }

  
}