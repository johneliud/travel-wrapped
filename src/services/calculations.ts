import { differenceInMinutes, format } from 'date-fns';
import { GeocodingService } from './geocoding';
import { CountriesService } from './countries';
import { WeatherService } from './weather';
import type { 
  ProcessedTrip, 
  LatLng, 
  TravelStats
} from '../types/travel';

export interface EnhancedTrip {
  id: string;
  type: 'STAY' | 'JOURNEY';
  startTime: Date;
  endTime: Date;
  location: LatLng;
  endLocation?: LatLng; // For journeys
  placeName?: string;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  distanceKm?: number;
  durationMinutes: number;
  confidence: number;
  weather?: {
    temperature: number;
    description: string;
    icon: string;
  };
  segments: ProcessedTrip[]; // Original segments that make up this trip
}

export interface EnhancedTravelStats extends TravelStats {
  hottestTrip?: {
    location: string;
    temperature: number;
    date: string;
  };
  coldestTrip?: {
    location: string;
    temperature: number;
    date: string;
  };
  countries: Array<{
    name: string;
    code: string;
    flag: string;
    visitCount: number;
  }>;
  topDestinations: Array<{
    city: string;
    country: string;
    visits: number;
    totalDays: number;
  }>;
}

export class TravelCalculations {
  private static readonly EARTH_RADIUS_KM = 6371;
  private static readonly MIN_STAY_DURATION_MINUTES = 30;
  private static readonly PROXIMITY_THRESHOLD_KM = 0.5;
  private static readonly MAX_CONCURRENT_API_CALLS = 5;

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(point1: LatLng, point2: LatLng): number {
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Enhanced trip grouping with API enrichment
   */
  static async enhanceTripsWithAPIs(
    segments: ProcessedTrip[],
    onProgress?: (progress: number) => void
  ): Promise<EnhancedTrip[]> {
    if (segments.length === 0) return [];

    // Initialize country service
    await CountriesService.initialize();

    // Group segments into trips
    const groupedTrips = this.groupTripsFromSegments(segments);
    
    // Enhance with API data in batches
    const enhancedTrips: EnhancedTrip[] = [];
    const batchSize = this.MAX_CONCURRENT_API_CALLS;
    
    for (let i = 0; i < groupedTrips.length; i += batchSize) {
      const batch = groupedTrips.slice(i, i + batchSize);
      
      const enhancedBatch = await Promise.all(
        batch.map(trip => this.enrichTripWithAPIs(trip))
      );
      
      enhancedTrips.push(...enhancedBatch);
      
      // Report progress
      const progress = Math.floor((i + batch.length) / groupedTrips.length * 100);
      onProgress?.(progress);
    }

    return this.deduplicateNearbyPlaces(enhancedTrips);
  }

  /**
   * Group related segments into meaningful trips
   */
  private static groupTripsFromSegments(segments: ProcessedTrip[]): EnhancedTrip[] {
    if (segments.length === 0) return [];

    const sortedSegments = [...segments].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    const trips: EnhancedTrip[] = [];
    let currentStaySegments: ProcessedTrip[] = [];

    for (const segment of sortedSegments) {
      const isStay = segment.activityType === 'STAY';
      const duration = differenceInMinutes(segment.endTime, segment.startTime);

      if (isStay && duration >= this.MIN_STAY_DURATION_MINUTES) {
        currentStaySegments.push(segment);
      } else if (isStay && currentStaySegments.length > 0) {
        currentStaySegments.push(segment);
      } else {
        if (currentStaySegments.length > 0) {
          const stayTrip = this.createStayTrip(currentStaySegments);
          if (stayTrip) trips.push(stayTrip);
          currentStaySegments = [];
        }

        if (!isStay && segment.distanceMeters && segment.distanceMeters > 1000) {
          const journeyTrip = this.createJourneyTrip([segment]);
          if (journeyTrip) trips.push(journeyTrip);
        }
      }
    }

    if (currentStaySegments.length > 0) {
      const stayTrip = this.createStayTrip(currentStaySegments);
      if (stayTrip) trips.push(stayTrip);
    }

    return trips;
  }

  
}