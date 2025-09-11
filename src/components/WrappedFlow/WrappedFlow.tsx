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

    // Add achievements slide if user has unlocked any
    if (unlockedAchievements.length > 0) {
      slides.push({
        id: 'achievements',
        title: 'Achievements Unlocked',
        autoAdvanceDelay: 5000,
        component: (
          <motion.div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-5xl mb-6">🏅</div>
              <motion.h2 
                className="text-3xl font-bold text-yellow-600 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                You unlocked
              </motion.h2>
              <motion.div 
                className="text-6xl font-bold text-yellow-700 mb-4"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", bounce: 0.3 }}
              >
                {unlockedAchievements.length}
              </motion.div>
              <motion.p 
                className="text-2xl text-yellow-600 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                achievements!
              </motion.p>
              <motion.div 
                className="flex flex-wrap justify-center gap-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {unlockedAchievements.slice(0, 6).map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    className="bg-yellow-100 rounded-lg p-3 text-center min-w-[80px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs font-medium text-yellow-800">{achievement.title}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )
      });
    }

    // Add enhanced weather slide if available
    if (isEnhanced && 'hottestTrip' in stats && (stats.hottestTrip || stats.coldestTrip)) {
      slides.push({
        id: 'weather',
        title: 'Weather Adventures',
        autoAdvanceDelay: 4000,
        component: (
          <motion.div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-5xl mb-6">🌡️</div>
              <motion.h2 
                className="text-3xl font-bold text-red-600 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Your Weather Story
              </motion.h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                {stats.hottestTrip && (
                  <motion.div 
                    className="bg-gradient-to-br from-red-100 to-orange-100 rounded-lg p-6"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="text-4xl mb-4">🔥</div>
                    <h3 className="text-xl font-bold text-red-700">Hottest Adventure</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.hottestTrip.temperature}°C</p>
                    <p className="text-red-600 mt-1">{stats.hottestTrip.location}</p>
                  </motion.div>
                )}
                {stats.coldestTrip && (
                  <motion.div 
                    className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-6"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="text-4xl mb-4">❄️</div>
                    <h3 className="text-xl font-bold text-blue-700">Coldest Adventure</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.coldestTrip.temperature}°C</p>
                    <p className="text-blue-600 mt-1">{stats.coldestTrip.location}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )
      });
    }

    // Final slide
    slides.push({
      id: 'outro',
      title: 'The End',
      component: (
        <motion.div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="text-6xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
            >
              🎉
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              That's your story!
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {stats.totalTrips} trips • {stats.totalDistanceKm.toLocaleString()} km • {stats.uniqueCountries} countries
            </motion.p>
            <motion.button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              onClick={onComplete}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore More Details
            </motion.button>
          </motion.div>
        </motion.div>
      )
    });

    return slides;
  }, [stats, isEnhanced, unlockedAchievements, travelLevel, personality, onComplete]);

  const slides = createSlides();
  const currentSlide = slides[currentSlideIndex];

  // Auto-advance logic
  useEffect(() => {
    if (!isAutoAdvancing || !currentSlide.autoAdvanceDelay) return;

    const timer = setTimeout(() => {
      if (currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
      } else {
        setIsAutoAdvancing(false);
      }
    }, currentSlide.autoAdvanceDelay);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, isAutoAdvancing, currentSlide.autoAdvanceDelay, slides.length]);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setIsAutoAdvancing(false);
  };

  const toggleAutoAdvance = () => {
    setIsAutoAdvancing(!isAutoAdvancing);
  };

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 z-50 flex flex-col"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 z-10">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="min-h-[400px] flex items-center justify-center"
            >
              {currentSlide.component}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <motion.div 
        className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={prevSlide}
          disabled={currentSlideIndex === 0}
          className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-gray-700 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ←
        </button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlideIndex 
                  ? 'bg-blue-600 scale-125' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-gray-700 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          →
        </button>

        <button
          onClick={toggleAutoAdvance}
          className={`ml-4 px-3 py-1 rounded-full text-sm font-medium transition-all ${
            isAutoAdvancing 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/20 backdrop-blur-sm text-gray-700 hover:bg-white/30'
          }`}
        >
          {isAutoAdvancing ? 'Pause' : 'Play'}
        </button>
      </motion.div>

      {/* Skip Button */}
      <motion.button
        className="absolute top-8 right-8 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-gray-700 hover:bg-white/30 transition-all"
        onClick={onComplete}
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
      >
        Skip
      </motion.button>
    </div>
  );
};

export default WrappedFlow;