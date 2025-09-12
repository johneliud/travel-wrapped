import { TripEnhancement } from './enhancement';
import { TravelStatistics } from './statistics';
import { AdvancedAnalytics } from './advanced';
import type { ProcessedTrip, EnhancedTravelStats as EnhancedTravelStatsType, EnhancedTrip } from '../../types/travel';

/**
 * Main travel calculations class that orchestrates all calculation modules
 */
export class TravelCalculations {
  /**
   * Enhanced trip grouping with API enrichment
   */
  static async enhanceTripsWithAPIs(
    segments: ProcessedTrip[],
    onProgress?: (progress: number) => void
  ): Promise<EnhancedTrip[]> {
    return TripEnhancement.enhanceTripsWithAPIs(segments, onProgress);
  }

  /**
   * Calculate enhanced travel statistics
   */
  static calculateEnhancedStats(trips: EnhancedTrip[]): EnhancedTravelStatsType {
    const basicStats = TravelStatistics.calculateEnhancedStats(trips);
    const advancedStats = AdvancedAnalytics.calculateAdvancedStatistics(trips);
    
    return {
      ...basicStats,
      ...advancedStats
    };
  }
}

// Export individual modules for direct access if needed
export { TripEnhancement } from './enhancement';
export { TravelStatistics } from './statistics';
export { AdvancedAnalytics } from './advanced';