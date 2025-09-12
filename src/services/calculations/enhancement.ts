import { differenceInMinutes } from 'date-fns';
import { GeocodingService } from '../geocoding';
import { CountriesService } from '../countries';
import { WeatherService } from '../weather';
import { arePointsNearby } from '../../utils/geometry';
import type { ProcessedTrip, EnhancedTrip } from '../../types/travel';

export class TripEnhancement {
  private static readonly MIN_STAY_DURATION_MINUTES = 30;
  private static readonly PROXIMITY_THRESHOLD_KM = 0.5;
  private static readonly MAX_CONCURRENT_API_CALLS = 5;

  static async enhanceTripsWithAPIs(
    segments: ProcessedTrip[],
    onProgress?: (progress: number) => void
  ): Promise<EnhancedTrip[]> {
    if (segments.length === 0) return [];

    await CountriesService.initialize();
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

    // Final deduplication and cleanup
    return this.deduplicateNearbyPlaces(enhancedTrips);
  }

  
}