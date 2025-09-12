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

  /**
   * Group processed trip segments into enhanced trips
   */
  private static groupTripsFromSegments(segments: ProcessedTrip[]): EnhancedTrip[] {
    if (segments.length === 0) return [];

    const groupedTrips: EnhancedTrip[] = [];
    const sortedSegments = segments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    let currentGroup: ProcessedTrip[] = [sortedSegments[0]];
    let currentType = sortedSegments[0].activityType === 'STAY' ? 'STAY' : 'JOURNEY';

    for (let i = 1; i < sortedSegments.length; i++) {
      const segment = sortedSegments[i];
      const segmentType = segment.activityType === 'STAY' ? 'STAY' : 'JOURNEY';

      if (segmentType === currentType) {
        currentGroup.push(segment);
      } else {
        // Process current group
        const trip = currentType === 'STAY' 
          ? this.createStayTrip(currentGroup)
          : this.createJourneyTrip(currentGroup);
        
        if (trip) groupedTrips.push(trip);

        // Start new group
        currentGroup = [segment];
        currentType = segmentType;
      }
    }

    // Process final group
    const finalTrip = currentType === 'STAY'
      ? this.createStayTrip(currentGroup)
      : this.createJourneyTrip(currentGroup);
    
    if (finalTrip) groupedTrips.push(finalTrip);

    return groupedTrips;
  }

  /**
   * Create a stay trip from segments
   */
  private static createStayTrip(segments: ProcessedTrip[]): EnhancedTrip | null {
    if (segments.length === 0) return null;

    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const totalDuration = differenceInMinutes(lastSegment.endTime, firstSegment.startTime);

    // Only include meaningful stays
    if (totalDuration < this.MIN_STAY_DURATION_MINUTES) return null;

    return {
      id: `stay-${firstSegment.id}`,
      type: 'STAY',
      startTime: firstSegment.startTime,
      endTime: lastSegment.endTime,
      location: firstSegment.startLocation || firstSegment.endLocation!,
      durationMinutes: totalDuration,
      confidence: segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length,
      segments
    };
  }

  
}