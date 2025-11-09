import type { LatLng } from '../types/travel';
import { ApiCircuitBreaker, ApiFallbackManager, ErrorCode, AppErrorHandler } from '../utils/errorHandling';
import { storageService } from './storage';

export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    hamlet?: string;
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
  coords?: LatLng;
}

export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly RATE_LIMIT_MS = 1000;
  private static readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private static cache = new Map<string, { data: LocationInfo; timestamp: number }>();
  private static lastRequestTime = 0;
  private static circuitBreaker = new ApiCircuitBreaker('GeocodingService', 3, 30000); // 30 seconds

  /**
   * Reverse geocode coordinates to get location information
   */
  static async reverseGeocode(coords: LatLng): Promise<LocationInfo> {
    const cacheKey = `geocoding_reverse_${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
    
    // Check persistent cache first
    const persistentCached = await storageService.getFromCache(cacheKey);
    if (persistentCached) {
      return persistentCached as LocationInfo;
    }
    
    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      return cached.data;
    }

    return ApiFallbackManager.executeWithFallback(
      'geocoding-reverse',
      async () => {
        return this.circuitBreaker.execute(async () => {
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
            throw AppErrorHandler.createError(
              ErrorCode.GEOCODING_ERROR,
              `Geocoding API error: ${response.status}`
            );
          }

          const data: GeocodingResult = await response.json();
          const locationInfo = this.parseGeocodingResult(data);

          // Cache in both persistent storage and memory
          await storageService.saveToCache(cacheKey, locationInfo, 24, 'geocoding'); // 24 hours
          this.cache.set(cacheKey, {
            data: locationInfo,
            timestamp: Date.now()
          });

          return locationInfo;
        });
      },
      {
        customFallback: () => ({
          city: `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
          confidence: 0.1
        })
      }
    );
  }

  /**
   * Forward geocode an address to get coordinates and location info
   */
  static async forwardGeocode(address: string): Promise<LocationInfo & { coords?: LatLng }> {
    const cacheKey = `geocoding_forward_${address.toLowerCase().trim()}`;
    
    // Check persistent cache first
    const persistentCached = await storageService.getFromCache(cacheKey);
    if (persistentCached) {
      return persistentCached as LocationInfo & { coords?: LatLng };
    }
    
    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      return cached.data as LocationInfo & { coords?: LatLng };
    }

    try {
      await this.enforceRateLimit();

      const url = `${this.BASE_URL}/search?` + new URLSearchParams({
        format: 'json',
        q: address,
        addressdetails: '1',
        limit: '1'
      });

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Travel-Wrapped/1.0 (Educational Project)'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const results: GeocodingResult[] = await response.json();
      
      if (results.length === 0) {
        throw new Error('No results found');
      }

      const result = results[0];
      const locationInfo = {
        ...this.parseGeocodingResult(result),
        coords: {
          latitude: result.lat,
          longitude: result.lon
        }
      };

      // Cache in both persistent storage and memory
      await storageService.saveToCache(cacheKey, locationInfo, 24, 'geocoding'); // 24 hours
      this.cache.set(cacheKey, {
        data: locationInfo,
        timestamp: Date.now()
      });

      return locationInfo;

    } catch (error) {
      console.warn('Forward geocoding failed:', error);
      
      return {
        city: address,
        confidence: 0.1
      };
    }
  }

  private static parseGeocodingResult(result: GeocodingResult): LocationInfo {
    const address = result.address;
    if (!address) {
      return {
        city: result.display_name.split(',')[0]?.trim(),
        confidence: 0.3
      };
    }

    // Extract city from various possible fields
    const city = address.city || address.town || address.village;
    const country = address.country;
    const countryCode = address.country_code;
    
    // Confidence based on importance and address completeness
    let confidence = 0.5;
    if (result.importance && result.importance > 0.5) {
      confidence = 0.8;
    }
    if (city && country) {
      confidence = Math.max(confidence, 0.7);
    }

    return {
      city,
      country,
      countryCode: countryCode?.toUpperCase(),
      confidence
    };
  }

  private static async enforceRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Clear the geocoding cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { memorySize: number; hitRate: number; circuitBreakerState: string } {
    return {
      memorySize: this.cache.size,
      hitRate: 0, // Could implement hit rate tracking
      circuitBreakerState: this.circuitBreaker.getState()
    };
  }

  /**
   * Clear all caches (memory and persistent)
   */
  static async clearAllCaches(): Promise<void> {
    this.cache.clear();
    console.info('Geocoding memory cache cleared');
  }

  /**
   * Preload common locations for better performance
   */
  static async preloadLocations(locations: { city: string; coords?: LatLng }[]): Promise<void> {
    const promises = locations.map(async (location) => {
      if (location.coords) {
        // Preload reverse geocoding
        await this.reverseGeocode(location.coords);
      }
      // Preload forward geocoding
      await this.forwardGeocode(location.city);
    });

    await Promise.allSettled(promises);
  }
}