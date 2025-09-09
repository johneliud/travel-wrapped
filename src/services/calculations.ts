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

