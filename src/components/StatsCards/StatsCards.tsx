import React, { useState, useEffect } from 'react';
import type { ProcessedTrip, EnhancedTrip, TravelStats, EnhancedTravelStats } from '../../types/travel';
import { 
  calculateAchievements, 
  getTravelLevel, 
  getTravelPersonality, 
  getTravelFacts,
  type Achievement,
  type DynamicFact
} from '../../utils/gamification';

interface StatsCardsProps {
  trips: ProcessedTrip[] | EnhancedTrip[];
  stats: TravelStats | EnhancedTravelStats;
  isEnhanced?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isEnhanced = false }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [travelFacts, setTravelFacts] = useState<DynamicFact[]>([]);
  const [factsLoading, setFactsLoading] = useState(true);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const travelLevel = getTravelLevel(stats.totalDistanceKm);
  const personality = getTravelPersonality(stats);

  useEffect(() => {
    // Calculate achievements
    const userAchievements = calculateAchievements(stats);
    setAchievements(userAchievements);

    // Fetch travel facts from Numbers API
    const fetchFacts = async () => {
      setFactsLoading(true);
      try {
        const facts = await getTravelFacts(stats);
        setTravelFacts(facts);
      } catch (error) {
        console.warn('Failed to load travel facts:', error);
      } finally {
        setFactsLoading(false);
      }
    };

    fetchFacts();
  }, [stats]);

  
};

export default StatsCards;