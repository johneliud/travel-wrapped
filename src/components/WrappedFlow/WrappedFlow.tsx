import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProcessedTrip, EnhancedTrip, TravelStats, EnhancedTravelStats } from '../../types/travel';
import { 
  calculateAchievements, 
  getTravelLevel, 
  getTravelPersonality 
} from '../../utils/gamification';

interface WrappedFlowProps {
  trips: ProcessedTrip[] | EnhancedTrip[];
  stats: TravelStats | EnhancedTravelStats;
  isEnhanced?: boolean;
  onComplete?: () => void;
}

interface Slide {
  id: string;
  title: string;
  component: React.ReactNode;
  autoAdvanceDelay?: number; // ms, null for manual advance only
}

export const WrappedFlow: React.FC<WrappedFlowProps> = ({ 
  stats, 
  isEnhanced = false, 
  onComplete 
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const achievements = calculateAchievements(stats);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const travelLevel = getTravelLevel(stats.totalDistanceKm);
  const personality = getTravelPersonality(stats);

  // Create dynamic slides based on available data
  const createSlides = useCallback((): Slide[] => {
    const slides: Slide[] = [
      {
        id: 'intro',
        title: 'Your Travel Story',
        autoAdvanceDelay: 3000,
        component: (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="text-6xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
            >
              ✈️
            </motion.div>
            <motion.h1 
              className="text-4xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Your Travel Wrapped
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Let's explore your journey...
            </motion.p>
          </motion.div>
        )
      },
      {
        id: 'total-distance',
        title: 'Distance Traveled',
        autoAdvanceDelay: 4000,
        component: (
          <motion.div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <div className="text-5xl mb-6">🛣️</div>
              <motion.h2 
                className="text-3xl font-bold text-blue-600 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                You traveled
              </motion.h2>
              <motion.div 
                className="text-6xl font-bold text-blue-700 mb-4"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring", bounce: 0.3 }}
              >
                {stats.totalDistanceKm.toLocaleString()}
              </motion.div>
              <motion.p 
                className="text-2xl text-blue-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                kilometers
              </motion.p>
              <motion.p 
                className="text-lg text-gray-500 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                That's {(stats.totalDistanceKm / 40075 * 100).toFixed(1)}% around Earth!
              </motion.p>
            </motion.div>
          </motion.div>
        )
      },
      {
        id: 'countries',
        title: 'Countries Explored',
        autoAdvanceDelay: 4000,
        component: (
          <motion.div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-5xl mb-6">🌍</div>
              <motion.h2 
                className="text-3xl font-bold text-green-600 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                You explored
              </motion.h2>
              <motion.div 
                className="text-6xl font-bold text-green-700 mb-4"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
              >
                {stats.uniqueCountries}
              </motion.div>
              <motion.p 
                className="text-2xl text-green-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {stats.uniqueCountries === 1 ? 'country' : 'countries'}
              </motion.p>
              <motion.p 
                className="text-lg text-gray-500 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {(stats.uniqueCountries / 195 * 100).toFixed(1)}% of all countries in the world
              </motion.p>
            </motion.div>
          </motion.div>
        )
      },
      {
        id: 'level',
        title: 'Travel Level',
        autoAdvanceDelay: 4000,
        component: (
          <motion.div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-5xl mb-6">🏆</div>
              <motion.h2 
                className="text-3xl font-bold text-purple-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                You reached
              </motion.h2>
              <motion.div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
              >
                <span className="text-4xl font-bold text-white">{travelLevel.level}</span>
              </motion.div>
              <motion.h3 
                className="text-2xl font-bold text-purple-700 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                {travelLevel.title}
              </motion.h3>
              {travelLevel.nextLevelKm > 0 && (
                <motion.p 
                  className="text-lg text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  {travelLevel.nextLevelKm.toLocaleString()} km to next level
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )
      },
      {
        id: 'personality',
        title: 'Travel Personality',
        autoAdvanceDelay: 4000,
        component: (
          <motion.div className="text-center">
            <motion.div
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div 
                className="text-6xl mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", bounce: 0.6 }}
              >
                {personality.icon}
              </motion.div>
              <motion.h2 
                className="text-3xl font-bold text-orange-600 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                You are a
              </motion.h2>
              <motion.h3 
                className="text-4xl font-bold text-orange-700 mb-6"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, type: "spring" }}
              >
                {personality.title}
              </motion.h3>
              <motion.p 
                className="text-lg text-gray-600 max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
              >
                {personality.description}
              </motion.p>
            </motion.div>
          </motion.div>
        )
      }
    ];

    
};

export default WrappedFlow;