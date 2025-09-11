import { differenceInMinutes, format, getMonth, differenceInDays, startOfDay } from 'date-fns';
import { GeocodingService } from './geocoding';
import { CountriesService } from './countries';
import { WeatherService } from './weather';
import type { 
  ProcessedTrip, 
  LatLng, 
  TravelStats,
  EnhancedTravelStats as EnhancedTravelStatsType
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

  private static createStayTrip(segments: ProcessedTrip[]): EnhancedTrip | null {
    if (segments.length === 0) return null;

    const sortedSegments = segments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const firstSegment = sortedSegments[0];
    const lastSegment = sortedSegments[sortedSegments.length - 1];
    const bestSegment = segments.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const durationMinutes = differenceInMinutes(lastSegment.endTime, firstSegment.startTime);

    return {
      id: `stay-${firstSegment.id}`,
      type: 'STAY',
      startTime: firstSegment.startTime,
      endTime: lastSegment.endTime,
      location: firstSegment.startLocation,
      placeName: bestSegment.placeName,
      address: bestSegment.address,
      durationMinutes,
      confidence: bestSegment.confidence,
      segments: sortedSegments
    };
  }

  private static createJourneyTrip(segments: ProcessedTrip[]): EnhancedTrip | null {
    if (segments.length === 0) return null;

    const segment = segments[0];
    const distanceKm = segment.distanceMeters ? segment.distanceMeters / 1000 : 0;
    const durationMinutes = differenceInMinutes(segment.endTime, segment.startTime);

    return {
      id: `journey-${segment.id}`,
      type: 'JOURNEY',
      startTime: segment.startTime,
      endTime: segment.endTime,
      location: segment.startLocation,
      endLocation: segment.endLocation,
      distanceKm,
      durationMinutes,
      confidence: segment.confidence,
      segments
    };
  }

  /**
   * Enrich a trip with API data
   */
  private static async enrichTripWithAPIs(trip: EnhancedTrip): Promise<EnhancedTrip> {
    try {
      const enrichedTrip = { ...trip };

      // Get location information if not already available
      if (!trip.city || !trip.country) {
        const locationInfo = await GeocodingService.reverseGeocode(trip.location);
        enrichedTrip.city = enrichedTrip.city || locationInfo.city;
        enrichedTrip.country = enrichedTrip.country || locationInfo.country;
        enrichedTrip.countryCode = locationInfo.countryCode;
        
        // If we still don't have country info, try the improved coordinate-based lookup
        if (!enrichedTrip.country && CountriesService.getCountryByCoordinates) {
          try {
            const countryInfo = await CountriesService.getCountryByCoordinates(
              trip.location.latitude, 
              trip.location.longitude
            );
            if (countryInfo) {
              enrichedTrip.country = countryInfo.name;
              enrichedTrip.countryCode = countryInfo.code;
            }
          } catch (error) {
            // Silently fail - geocoding already provided fallback
            console.debug('Country lookup by coordinates failed:', error);
          }
        }
      }

      // Get weather data for the trip date
      if (trip.type === 'STAY') {
        try {
          const tripDate = format(trip.startTime, 'yyyy-MM-dd');
          const weather = await WeatherService.getWeatherForDate(trip.location, tripDate);
          
          if (weather) {
            enrichedTrip.weather = {
              temperature: weather.temperature,
              description: weather.weatherDescription,
              icon: WeatherService.getWeatherIcon(weather.weatherCode)
            };
          }
        } catch (error) {
          console.warn('Failed to get weather data for trip:', error);
        }
      }

      return enrichedTrip;

    } catch (error) {
      console.warn('Failed to enrich trip with API data:', error);
      return trip;
    }
  }

  /**
   * Calculate enhanced travel statistics
   */
  static calculateEnhancedStats(trips: EnhancedTrip[]): EnhancedTravelStats {
    if (trips.length === 0) {
      return {
        totalDistanceKm: 0,
        uniqueCities: 0,
        uniqueCountries: 0,
        longestTripKm: 0,
        mostVisitedLocation: 'No trips found',
        totalTrips: 0,
        firstTripDate: new Date(),
        lastTripDate: new Date(),
        countries: [],
        topDestinations: []
      };
    }

    // Basic statistics
    const journeys = trips.filter(trip => trip.type === 'JOURNEY' && trip.distanceKm);
    const totalDistance = journeys.reduce((sum, trip) => sum + (trip.distanceKm || 0), 0);
    const longestTrip = journeys.reduce((max, trip) => 
      (trip.distanceKm || 0) > (max.distanceKm || 0) ? trip : max
    , journeys[0]);

    // Unique places and countries
    const uniqueCities = new Set<string>();
    const uniqueCountries = new Set<string>();
    const countryStats = new Map<string, { name: string; code: string; flag: string; count: number }>();
    const cityStats = new Map<string, { city: string; country: string; visits: number; totalDays: number }>();

    trips.forEach(trip => {
      if (trip.city) {
        uniqueCities.add(trip.city.toLowerCase());
        
        const cityKey = `${trip.city}-${trip.country || 'unknown'}`;
        const existing = cityStats.get(cityKey);
        const days = Math.max(1, Math.ceil(trip.durationMinutes / (24 * 60)));
        
        if (existing) {
          existing.visits++;
          existing.totalDays += days;
        } else {
          cityStats.set(cityKey, {
            city: trip.city,
            country: trip.country || 'Unknown',
            visits: 1,
            totalDays: days
          });
        }
      }
      
      if (trip.country) {
        uniqueCountries.add(trip.country.toLowerCase());
        
        const existing = countryStats.get(trip.country);
        if (existing) {
          existing.count++;
        } else {
          countryStats.set(trip.country, {
            name: trip.country,
            code: trip.countryCode || '',
            flag: trip.countryCode ? CountriesService.getFlagEmoji(trip.countryCode) : '🌍',
            count: 1
          });
        }
      }
    });

    // Weather statistics
    const tripsWithWeather = trips.filter(trip => trip.weather);
    let hottestTrip, coldestTrip;

    if (tripsWithWeather.length > 0) {
      hottestTrip = tripsWithWeather.reduce((max, trip) => 
        trip.weather!.temperature > (max.weather?.temperature || -Infinity) ? trip : max
      );
      
      coldestTrip = tripsWithWeather.reduce((min, trip) => 
        trip.weather!.temperature < (min.weather?.temperature || Infinity) ? trip : min
      );
    }

    // Most visited location
    const locationCounts: Record<string, number> = {};
    trips.forEach(trip => {
      const locationKey = trip.placeName || trip.city || 'Unknown location';
      locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
    });
    const mostVisitedLocation = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    // Date range
    const sortedTrips = trips.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return {
      totalDistanceKm: Math.round(totalDistance * 100) / 100,
      uniqueCities: uniqueCities.size,
      uniqueCountries: uniqueCountries.size,
      longestTripKm: Math.round((longestTrip?.distanceKm || 0) * 100) / 100,
      mostVisitedLocation,
      totalTrips: trips.length,
      firstTripDate: sortedTrips[0]?.startTime || new Date(),
      lastTripDate: sortedTrips[sortedTrips.length - 1]?.endTime || new Date(),
      
      // Enhanced statistics
      hottestTrip: hottestTrip ? {
        location: hottestTrip.city || hottestTrip.placeName || 'Unknown',
        temperature: hottestTrip.weather!.temperature,
        date: format(hottestTrip.startTime, 'yyyy-MM-dd')
      } : undefined,
      
      coldestTrip: coldestTrip ? {
        location: coldestTrip.city || coldestTrip.placeName || 'Unknown',
        temperature: coldestTrip.weather!.temperature,
        date: format(coldestTrip.startTime, 'yyyy-MM-dd')
      } : undefined,
      
      countries: Array.from(countryStats.values())
        .map(country => ({
          name: country.name,
          code: country.code,
          flag: country.flag,
          visitCount: country.count
        }))
        .sort((a, b) => b.visitCount - a.visitCount),
      
      topDestinations: Array.from(cityStats.values())
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10),

      // Advanced statistics
      ...this.calculateAdvancedStatistics(trips)
    };
  }

  /**
   * Calculate advanced travel statistics
   */
  private static calculateAdvancedStatistics(trips: EnhancedTrip[]): Partial<EnhancedTravelStatsType> {
    if (trips.length === 0) return {};

    return {
      busiestTravelPeriod: this.calculateBusiestTravelPeriod(trips),
      busiestSeason: this.calculateBusiestSeason(trips),
      longestTravelStreak: this.calculateLongestTravelStreak(trips),
      timezonesCrossed: this.calculateTimezoneCrossings(trips).count,
      timezoneTransitions: this.calculateTimezoneCrossings(trips).transitions,
      transportModeBreakdown: this.calculateTransportModeBreakdown(trips)
    };
  }

  /**
   * Calculate busiest travel month
   */
  private static calculateBusiestTravelPeriod(trips: EnhancedTrip[]): { month: string; monthNumber: number; tripsCount: number; totalDistance: number } | undefined {
    if (trips.length === 0) return undefined;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthStats = new Map<number, { tripsCount: number; totalDistance: number }>();

    trips.forEach(trip => {
      const month = getMonth(trip.startTime); // 0-11
      const existing = monthStats.get(month);
      const distance = trip.distanceKm || 0;

      if (existing) {
        existing.tripsCount++;
        existing.totalDistance += distance;
      } else {
        monthStats.set(month, { tripsCount: 1, totalDistance: distance });
      }
    });

    if (monthStats.size === 0) return undefined;

    // Find month with most trips (could also be by distance)
    const [busiestMonth, stats] = Array.from(monthStats.entries())
      .sort(([, a], [, b]) => b.tripsCount - a.tripsCount)[0];

    return {
      month: monthNames[busiestMonth],
      monthNumber: busiestMonth + 1, // 1-12
      tripsCount: stats.tripsCount,
      totalDistance: Math.round(stats.totalDistance * 100) / 100
    };
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
        this.calculateDistance(trip.location, existingTrip.location) < this.PROXIMITY_THRESHOLD_KM
      );

      if (nearbyTrip) {
        this.mergeNearbyTrips(nearbyTrip, trip);
      } else {
        deduplicated.push(trip);
      }
    }

    return deduplicated.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  private static mergeNearbyTrips(existingTrip: EnhancedTrip, newTrip: EnhancedTrip): void {
    if (newTrip.startTime < existingTrip.startTime) {
      existingTrip.startTime = newTrip.startTime;
    }
    if (newTrip.endTime > existingTrip.endTime) {
      existingTrip.endTime = newTrip.endTime;
    }

    existingTrip.durationMinutes = differenceInMinutes(existingTrip.endTime, existingTrip.startTime);

    if (newTrip.confidence > existingTrip.confidence) {
      existingTrip.placeName = newTrip.placeName || existingTrip.placeName;
      existingTrip.address = newTrip.address || existingTrip.address;
      existingTrip.city = newTrip.city || existingTrip.city;
      existingTrip.country = newTrip.country || existingTrip.country;
      existingTrip.countryCode = newTrip.countryCode || existingTrip.countryCode;
      existingTrip.confidence = newTrip.confidence;
      existingTrip.weather = newTrip.weather || existingTrip.weather;
    }

    existingTrip.segments.push(...newTrip.segments);
  }
}