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

