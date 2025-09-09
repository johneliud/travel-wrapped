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

  
}