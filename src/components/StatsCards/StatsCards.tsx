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

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const displayAchievements = showAllAchievements ? achievements : achievements.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Travel Level & Personality */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Travel Level */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">🏆</div>
            <div>
              <h3 className="text-xl font-bold text-purple-800">Travel Level {travelLevel.level}</h3>
              <p className="text-purple-600 font-medium">{travelLevel.title}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-purple-600 mb-1">
              <span>Progress to next level</span>
              <span>{Math.round(travelLevel.progress)}%</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${travelLevel.progress}%` }}
              />
            </div>
            {travelLevel.nextLevelKm > 0 && (
              <p className="text-xs text-purple-500 mt-1">
                {travelLevel.nextLevelKm.toLocaleString()} km to next level
              </p>
            )}
          </div>
        </div>

        {/* Travel Personality */}
        <div className="bg-gradient-to-br from-orange-50 to-pink-100 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">{personality.icon}</div>
            <div>
              <h3 className="text-xl font-bold text-orange-800">{personality.title}</h3>
              <p className="text-orange-600 text-sm">{personality.description}</p>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default StatsCards;