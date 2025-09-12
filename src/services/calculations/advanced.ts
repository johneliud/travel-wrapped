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

  
}