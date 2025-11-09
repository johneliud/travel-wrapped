import { format, getMonth, differenceInDays, startOfDay } from 'date-fns';
import { getTimezoneFromLongitude } from '../../utils/geometry';
import type { EnhancedTravelStats as EnhancedTravelStatsType, EnhancedTrip } from '../../types/travel';

export class AdvancedAnalytics {
  
  /**
   * Calculate all advanced travel statistics
   */
  static calculateAdvancedStatistics(trips: EnhancedTrip[]): Partial<EnhancedTravelStatsType> {
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
   * Calculate busiest season
   */
  private static calculateBusiestSeason(trips: EnhancedTrip[]): { season: 'Spring' | 'Summer' | 'Autumn' | 'Winter'; tripsCount: number; totalDistance: number; months: string[] } | undefined {
    if (trips.length === 0) return undefined;

    const seasons = {
      Spring: { months: [2, 3, 4], names: ['March', 'April', 'May'], tripsCount: 0, totalDistance: 0 },
      Summer: { months: [5, 6, 7], names: ['June', 'July', 'August'], tripsCount: 0, totalDistance: 0 },
      Autumn: { months: [8, 9, 10], names: ['September', 'October', 'November'], tripsCount: 0, totalDistance: 0 },
      Winter: { months: [11, 0, 1], names: ['December', 'January', 'February'], tripsCount: 0, totalDistance: 0 }
    };

    trips.forEach(trip => {
      const month = getMonth(trip.startTime); // 0-11
      const distance = trip.distanceKm || 0;

      Object.values(seasons).forEach(season => {
        if (season.months.includes(month)) {
          season.tripsCount++;
          season.totalDistance += distance;
        }
      });
    });

    const [busiestSeasonName, busiestSeasonData] = Object.entries(seasons)
      .sort(([, a], [, b]) => b.tripsCount - a.tripsCount)[0];

    return {
      season: busiestSeasonName as 'Spring' | 'Summer' | 'Autumn' | 'Winter',
      tripsCount: busiestSeasonData.tripsCount,
      totalDistance: Math.round(busiestSeasonData.totalDistance * 100) / 100,
      months: busiestSeasonData.names
    };
  }

  /**
   * Calculate longest travel streak
   */
  private static calculateLongestTravelStreak(trips: EnhancedTrip[]): { startDate: string; endDate: string; daysCount: number; tripsCount: number; countriesVisited: number; totalDistance: number } | undefined {
    if (trips.length === 0) return undefined;

    const sortedTrips = trips.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const maxGapDays = 7; // Consider trips within 7 days as part of the same streak

    let currentStreakStart = 0;
    let currentStreakEnd = 0;
    let longestStreakStart = 0;
    let longestStreakEnd = 0;
    let maxStreakLength = 1;

    for (let i = 1; i < sortedTrips.length; i++) {
      const prevTrip = sortedTrips[i - 1];
      const currentTrip = sortedTrips[i];
      
      const daysBetween = differenceInDays(startOfDay(currentTrip.startTime), startOfDay(prevTrip.endTime));
      
      if (daysBetween <= maxGapDays) {
        // Continue streak
        currentStreakEnd = i;
      } else {
        // Check if current streak is longest
        const currentStreakLength = currentStreakEnd - currentStreakStart + 1;
        if (currentStreakLength > maxStreakLength) {
          maxStreakLength = currentStreakLength;
          longestStreakStart = currentStreakStart;
          longestStreakEnd = currentStreakEnd;
        }
        
        // Start new streak
        currentStreakStart = i;
        currentStreakEnd = i;
      }
    }

    // Check final streak
    const finalStreakLength = currentStreakEnd - currentStreakStart + 1;
    if (finalStreakLength > maxStreakLength) {
      longestStreakStart = currentStreakStart;
      longestStreakEnd = currentStreakEnd;
    }

    const streakTrips = sortedTrips.slice(longestStreakStart, longestStreakEnd + 1);
    const totalDays = differenceInDays(
      streakTrips[streakTrips.length - 1].endTime,
      streakTrips[0].startTime
    ) + 1;

    const countriesVisited = new Set(
      streakTrips.map(trip => trip.country).filter(Boolean)
    ).size;

    const totalDistance = streakTrips.reduce((sum, trip) => sum + (trip.distanceKm || 0), 0);

    return {
      startDate: format(streakTrips[0].startTime, 'yyyy-MM-dd'),
      endDate: format(streakTrips[streakTrips.length - 1].endTime, 'yyyy-MM-dd'),
      daysCount: totalDays,
      tripsCount: streakTrips.length,
      countriesVisited,
      totalDistance: Math.round(totalDistance * 100) / 100
    };
  }

  /**
   * Calculate timezone crossings
   */
  private static calculateTimezoneCrossings(trips: EnhancedTrip[]): { count: number; transitions: Array<{ fromTimezone: string; toTimezone: string; location: string; date: string }> } {
    const transitions: Array<{ fromTimezone: string; toTimezone: string; location: string; date: string }> = [];
    
    if (trips.length < 2) {
      return { count: 0, transitions };
    }

    const sortedTrips = trips.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    let lastTimezone = getTimezoneFromLongitude(sortedTrips[0].location.longitude);

    for (let i = 1; i < sortedTrips.length; i++) {
      const trip = sortedTrips[i];
      const currentTimezone = getTimezoneFromLongitude(trip.location.longitude);
      
      if (currentTimezone !== lastTimezone) {
        transitions.push({
          fromTimezone: lastTimezone,
          toTimezone: currentTimezone,
          location: trip.city || trip.placeName || 'Unknown location',
          date: format(trip.startTime, 'yyyy-MM-dd')
        });
        lastTimezone = currentTimezone;
      }
    }

    return {
      count: transitions.length,
      transitions
    };
  }

  /**
   * Calculate transport mode breakdown
   */
  private static calculateTransportModeBreakdown(trips: EnhancedTrip[]): Array<{ mode: string; distanceKm: number; percentage: number; tripsCount: number; averageDistance: number }> {
    const journeys = trips.filter(trip => trip.type === 'JOURNEY' && trip.distanceKm);
    
    if (journeys.length === 0) return [];

    const modeStats = new Map<string, { distance: number; count: number }>();
    let totalDistance = 0;

    journeys.forEach(trip => {
      const distance = trip.distanceKm || 0;
      totalDistance += distance;

      // Determine transport mode based on timeline activity types from segments
      const mode = this.determineTransportMode(trip);

      const existing = modeStats.get(mode);
      if (existing) {
        existing.distance += distance;
        existing.count++;
      } else {
        modeStats.set(mode, { distance, count: 1 });
      }
    });

    return Array.from(modeStats.entries())
      .map(([mode, stats]) => ({
        mode,
        distanceKm: Math.round(stats.distance * 100) / 100,
        percentage: Math.round((stats.distance / totalDistance) * 10000) / 100,
        tripsCount: stats.count,
        averageDistance: Math.round((stats.distance / stats.count) * 100) / 100
      }))
      .sort((a, b) => b.distanceKm - a.distanceKm);
  }

  /**
   * Determine transport mode based on timeline activity types
   */
  private static determineTransportMode(trip: EnhancedTrip): string {
    // Get activity types from the trip's segments
    const activityTypes = trip.segments?.map(s => s.activityType).filter(Boolean) || [];
    const primaryActivityType = activityTypes[0]; // Use first available activity type
    
    if (!primaryActivityType) return 'Unknown';

    // Map timeline activity types to transport modes
    switch (primaryActivityType) {
      case 'FLYING':
        return 'Flying';
      
      case 'IN_RAIL_VEHICLE':
        return 'Train';
      
      case 'IN_BUS':
        return 'Bus';
      
      case 'IN_ROAD_VEHICLE':
      case 'IN_VEHICLE':
      case 'IN_PASSENGER_VEHICLE':
        return 'Car';
      
      case 'IN_TWO_WHEELER_VEHICLE':
      case 'MOTORCYCLING':
        return 'Motorcycle';
      
      case 'ON_BICYCLE':
        return 'Bicycle';
      
      case 'WALKING':
      case 'ON_FOOT':
        return 'Walking';
      
      case 'RUNNING':
        return 'Running';
      
      case 'EXITING_VEHICLE':
      case 'STILL':
      case 'TILTING':
      case 'UNKNOWN':
      default:
        return 'Other';
    }
  }
}