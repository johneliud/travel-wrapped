import type { LatLng } from '../types/travel';

export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  importance?: number;
}

export interface LocationInfo {
  city?: string;
  country?: string;
  countryCode?: string;
  confidence: number;
}

