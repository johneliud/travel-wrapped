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

export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly RATE_LIMIT_MS = 1000;
  private static readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private static cache = new Map<string, { data: LocationInfo; timestamp: number }>();
  private static lastRequestTime = 0;

  /**
   * Reverse geocode coordinates to get location information
   */
  static async reverseGeocode(coords: LatLng): Promise<LocationInfo> {
    const cacheKey = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      // Implement rate limiting
      await this.enforceRateLimit();

      const url = `${this.BASE_URL}/reverse?` + new URLSearchParams({
        format: 'json',
        lat: coords.latitude.toString(),
        lon: coords.longitude.toString(),
        addressdetails: '1',
        zoom: '10'
      });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Travel-Wrapped/1.0 (Educational Project)'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data: GeocodingResult = await response.json();
      const locationInfo = this.parseGeocodingResult(data);

      // Cache the result
      this.cache.set(cacheKey, {
        data: locationInfo,
        timestamp: Date.now()
      });

      return locationInfo;

    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      
      // Return basic result with coordinates
      return {
        city: `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
        confidence: 0.1
      };
    }
  }

  
}