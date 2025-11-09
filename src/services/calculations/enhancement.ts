import { differenceInMinutes } from 'date-fns';
import { GeocodingService } from '../geocoding';
import { CountriesService } from '../countries';
import { WeatherService } from '../weather';
import { arePointsNearby } from '../../utils/geometry';
import type { ProcessedTrip, EnhancedTrip } from '../../types/travel';

export class TripEnhancement {
  private static readonly MIN_STAY_DURATION_MINUTES = 10; // Reduced from 30 to capture shorter stops
  private static readonly PROXIMITY_THRESHOLD_KM = 0.1; // Reduced from 0.5 to avoid merging distinct locations
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

  /**
   * Create a journey trip from segments
   */
  private static createJourneyTrip(segments: ProcessedTrip[]): EnhancedTrip | null {
    if (segments.length === 0) return null;

    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const totalDistance = segments.reduce((sum, segment) => sum + (segment.distanceMeters || 0), 0);
    const totalDuration = differenceInMinutes(lastSegment.endTime, firstSegment.startTime);

    return {
      id: `journey-${firstSegment.id}`,
      type: 'JOURNEY',
      startTime: firstSegment.startTime,
      endTime: lastSegment.endTime,
      location: firstSegment.startLocation || firstSegment.endLocation!,
      endLocation: lastSegment.endLocation || lastSegment.startLocation,
      distanceKm: totalDistance / 1000,
      durationMinutes: totalDuration,
      confidence: segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length,
      segments
    };
  }

  /**
   * Enrich trip with API data (geocoding, weather, country info)
   */
  private static async enrichTripWithAPIs(trip: EnhancedTrip): Promise<EnhancedTrip> {
    const enrichedTrip = { ...trip };

    try {
      // Geocoding for location details
      const geocodingResult = await GeocodingService.reverseGeocode(trip.location);

      if (geocodingResult) {
        enrichedTrip.city = geocodingResult.city;
        enrichedTrip.country = geocodingResult.country;
        enrichedTrip.countryCode = geocodingResult.countryCode;
      }

      // Weather data for the trip date - get weather for both STAY and JOURNEY trips
      const weatherData = await WeatherService.getWeatherForDate(
        trip.location,
        trip.startTime.toISOString().split('T')[0] // Convert to YYYY-MM-DD
      );

      if (weatherData) {
        enrichedTrip.weather = {
          temperature: weatherData.temperature,
          description: weatherData.weatherDescription,
          icon: WeatherService.getWeatherIcon(weatherData.weatherCode)
        };
      }

      // For journey trips, also try to get weather for the end location if different
      if (trip.type === 'JOURNEY' && trip.endLocation && 
          (Math.abs(trip.location.latitude - trip.endLocation.latitude) > 0.1 || 
           Math.abs(trip.location.longitude - trip.endLocation.longitude) > 0.1)) {
        
        const endWeatherData = await WeatherService.getWeatherForDate(
          trip.endLocation,
          trip.startTime.toISOString().split('T')[0]
        );

        // Use the more extreme temperature (hotter or colder)
        if (endWeatherData && weatherData) {
          if (Math.abs(endWeatherData.temperature) > Math.abs(weatherData.temperature)) {
            enrichedTrip.weather = {
              temperature: endWeatherData.temperature,
              description: endWeatherData.weatherDescription,
              icon: WeatherService.getWeatherIcon(endWeatherData.weatherCode)
            };
          }
        } else if (endWeatherData && !weatherData) {
          enrichedTrip.weather = {
            temperature: endWeatherData.temperature,
            description: endWeatherData.weatherDescription,
            icon: WeatherService.getWeatherIcon(endWeatherData.weatherCode)
          };
        }
      }
    } catch (error) {
      console.warn('Failed to enrich trip with API data:', error);
    }

    return enrichedTrip;
  }

  /**
   * Deduplicate nearby places based on proximity
   */
  private static deduplicateNearbyPlaces(trips: EnhancedTrip[]): EnhancedTrip[] {
    const deduplicated: EnhancedTrip[] = [];
    const stayTrips = trips.filter(trip => trip.type === 'STAY');
    const journeyTrips = trips.filter(trip => trip.type === 'JOURNEY');

    deduplicated.push(...journeyTrips);

    for (const trip of stayTrips) {
      const nearbyTrip = deduplicated.find(existingTrip => 
        existingTrip.type === 'STAY' &&
        arePointsNearby(trip.location, existingTrip.location, this.PROXIMITY_THRESHOLD_KM)
      );

      if (nearbyTrip) {
        this.mergeNearbyTrips(nearbyTrip, trip);
      } else {
        deduplicated.push(trip);
      }
    }

    return deduplicated.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Merge two nearby trips into one
   */
  private static mergeNearbyTrips(existingTrip: EnhancedTrip, newTrip: EnhancedTrip): void {
    if (newTrip.startTime < existingTrip.startTime) {
      existingTrip.startTime = newTrip.startTime;
    }
    if (newTrip.endTime > existingTrip.endTime) {
      existingTrip.endTime = newTrip.endTime;
    }

    existingTrip.durationMinutes = differenceInMinutes(existingTrip.endTime, existingTrip.startTime);

    // Preserve the most extreme weather data (hottest or coldest)
    if (newTrip.weather && existingTrip.weather) {
      // Keep the more extreme temperature
      if (Math.abs(newTrip.weather.temperature) > Math.abs(existingTrip.weather.temperature)) {
        existingTrip.weather = newTrip.weather;
      }
    } else if (newTrip.weather && !existingTrip.weather) {
      existingTrip.weather = newTrip.weather;
    }

    // Update other details based on higher confidence
    if (newTrip.confidence > existingTrip.confidence) {
      existingTrip.placeName = newTrip.placeName || existingTrip.placeName;
      existingTrip.address = newTrip.address || existingTrip.address;
      existingTrip.city = newTrip.city || existingTrip.city;
      existingTrip.country = newTrip.country || existingTrip.country;
      existingTrip.countryCode = newTrip.countryCode || existingTrip.countryCode;
      existingTrip.confidence = newTrip.confidence;
    }

    existingTrip.segments.push(...newTrip.segments);
  }
}