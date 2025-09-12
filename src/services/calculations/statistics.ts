import { format } from 'date-fns';
import { CountriesService } from '../countries';
import type { EnhancedTravelStats as EnhancedTravelStatsType, EnhancedTrip } from '../../types/travel';

export class TravelStatistics {
  
  /**
   * Calculate enhanced travel statistics
   */
  static calculateEnhancedStats(trips: EnhancedTrip[]): EnhancedTravelStatsType {
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
        .slice(0, 10)
    };
  }
}