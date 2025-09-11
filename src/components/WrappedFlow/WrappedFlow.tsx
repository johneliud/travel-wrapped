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
      

  
};

export default WrappedFlow;