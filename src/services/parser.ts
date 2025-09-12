import { parseISO } from 'date-fns';
import { TravelCalculations } from './calculations';
import { calculateDistance } from '../utils/geometry';
import type { 
  GoogleTimelineData, 
  SemanticSegment, 
  ProcessedTrip, 
  LatLng, 
  ProcessingResult,
  EnhancedProcessingResult,
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
                        (calculateDistance(startLocation, endLocation) * 1000); // Convert km to meters

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
        
        const distance = calculateDistance(startPoint, endPoint) * 1000; // Convert km to meters

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

  static async parseTimelineFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<ProcessingResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            throw new Error('Failed to read file');
          }

          const content = event.target.result as string;
          const data: GoogleTimelineData = JSON.parse(content);
          
          if (!data.semanticSegments || !Array.isArray(data.semanticSegments)) {
            throw new Error('Invalid timeline format: missing semanticSegments array');
          }

          const segments = data.semanticSegments;
          const trips: ProcessedTrip[] = [];
          const errors: string[] = [];
          
          const totalSegments = segments.length;
          let processedSegments = 0;

          // Process segments in batches to avoid blocking UI
          const batchSize = 100;
          for (let i = 0; i < segments.length; i += batchSize) {
            const batch = segments.slice(i, i + batchSize);
            
            for (let j = 0; j < batch.length; j++) {
              const segmentIndex = i + j;
              try {
                const trip = this.processSegment(batch[j], segmentIndex);
                if (trip) {
                  trips.push(trip);
                }
              } catch (error) {
                errors.push(`Segment ${segmentIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
              
              processedSegments++;
              const progress = Math.floor((processedSegments / totalSegments) * 100);
              onProgress?.(progress);
            }
            
            // Allow UI to update between batches
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          const stats = this.calculateStats(trips);

          resolve({
            trips,
            stats,
            totalSegments,
            processedSegments,
            errors
          });

        } catch (error) {
          reject(error instanceof Error ? error : new Error('Unknown parsing error'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Enhanced timeline parsing with API enrichment
   */
  static async parseTimelineFileEnhanced(
    file: File,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<EnhancedProcessingResult> {
    try {
        onProgress?.(0, 'Reading file...');
      
      // First, parse with basic processing
      const basicResult = await this.parseTimelineFile(file, (progress) => {
        onProgress?.(progress * 0.4, 'Processing timeline data...');
      });

      onProgress?.(40, 'Enhancing trips with API data...');

      // Then enhance with API data
      const enhancedTrips = await TravelCalculations.enhanceTripsWithAPIs(
        basicResult.trips,
        (apiProgress) => {
          onProgress?.(40 + (apiProgress * 0.5), 'Enriching with location and weather data...');
        }
      );

      onProgress?.(90, 'Calculating enhanced statistics...');

      // Calculate enhanced statistics
      const enhancedStats = TravelCalculations.calculateEnhancedStats(enhancedTrips);

      onProgress?.(100, 'Complete!');

      return {
        enhancedTrips,
        enhancedStats,
        basicTrips: basicResult.trips,
        basicStats: basicResult.stats,
        totalSegments: basicResult.totalSegments,
        processedSegments: basicResult.processedSegments,
        apiEnrichmentProgress: 100,
        errors: basicResult.errors
      };

    } catch (error) {
      throw error instanceof Error ? error : new Error('Enhanced parsing failed');
    }
  }

  static validateTimelineFile(file: File): string[] {
    const errors: string[] = [];

    // Check file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      errors.push('File must be a JSON file');
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size exceeds 50MB limit');
    }

    // Check minimum file size
    if (file.size < 100) {
      errors.push('File appears to be empty or too small');
    }

    return errors;
  }
}