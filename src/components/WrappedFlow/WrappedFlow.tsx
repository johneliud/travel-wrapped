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
  autoAdvanceDelay?: number;
  background: string;
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

  const createSlides = useCallback((): Slide[] => {
    const slides: Slide[] = [
      {
        id: 'intro',
        title: 'Your Travel Story',
        autoAdvanceDelay: 3000,
        background: 'from-indigo-600 via-purple-600 to-pink-600',
        component: (
          <div className="text-center text-white">
            <motion.div 
              className="text-8xl mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, type: "spring", bounce: 0.6 }}
            >
              ✈️
            </motion.div>
            <motion.h1 
              className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Your Travel Wrapped
            </motion.h1>
            <motion.p 
              className="text-2xl opacity-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              Let's explore your incredible journey...
            </motion.p>
          </div>
        )
      },
      {
        id: 'total-distance',
        title: 'Distance Traveled',
        autoAdvanceDelay: 4000,
        background: 'from-blue-600 via-cyan-500 to-teal-500',
        component: (
          <div className="text-center text-white">
            <motion.div
              className="text-7xl mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            >
              🛣️
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-8"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              You traveled
            </motion.h2>
            <motion.div 
              className="relative mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", bounce: 0.3 }}
            >
              <div className="text-8xl font-black mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {stats.totalDistanceKm.toLocaleString()}
              </div>
              <div className="text-3xl font-semibold opacity-90">kilometers</div>
            </motion.div>
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <div className="text-lg font-medium mb-2">That's equivalent to:</div>
              <div className="text-2xl font-bold">
                {(stats.totalDistanceKm / 40075 * 100).toFixed(1)}% around Earth! 🌍
              </div>
            </motion.div>
          </div>
        )
      },
      {
        id: 'countries',
        title: 'Countries Explored',
        autoAdvanceDelay: 4000,
        background: 'from-green-600 via-emerald-500 to-teal-500',
        component: (
          <div className="text-center text-white">
            <motion.div
              className="text-7xl mb-8"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              🌍
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              You explored
            </motion.h2>
            <motion.div 
              className="relative mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
            >
              <div className="text-8xl font-black mb-4 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                {stats.uniqueCountries}
              </div>
              <div className="text-3xl font-semibold opacity-90">
                {stats.uniqueCountries === 1 ? 'country' : 'countries'}
              </div>
            </motion.div>
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <div className="text-lg font-medium mb-2">World Coverage:</div>
              <div className="text-2xl font-bold">
                {(stats.uniqueCountries / 195 * 100).toFixed(1)}% of all countries! 🗺️
              </div>
            </motion.div>
          </div>
        )
      },
      {
        id: 'level',
        title: 'Travel Level',
        autoAdvanceDelay: 4000,
        background: 'from-purple-600 via-pink-500 to-rose-500',
        component: (
          <div className="text-center text-white">
            <motion.div
              className="text-7xl mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
            >
              🏆
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              You reached
            </motion.h2>
            <motion.div 
              className="relative mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
            >
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-40 h-40 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-5xl font-black text-white">{travelLevel.level}</span>
              </div>
              <div className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                {travelLevel.title}
              </div>
            </motion.div>
            {travelLevel.nextLevelKm > 0 && (
              <motion.div 
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <div className="text-lg font-medium mb-2">Next Level:</div>
                <div className="text-xl font-bold">
                  {travelLevel.nextLevelKm.toLocaleString()} km to go! 🚀
                </div>
              </motion.div>
            )}
          </div>
        )
      },
      {
        id: 'personality',
        title: 'Travel Personality',
        autoAdvanceDelay: 4000,
        background: 'from-orange-600 via-red-500 to-pink-600',
        component: (
          <div className="text-center text-white">
            <motion.div 
              className="text-8xl mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 1, type: "spring", bounce: 0.6 }}
            >
              {personality.icon}
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              You are a
            </motion.h2>
            <motion.h3 
              className="text-5xl font-black mb-8 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: "spring", bounce: 0.3 }}
            >
              {personality.title}
            </motion.h3>
            <motion.div 
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              <p className="text-xl leading-relaxed">
                {personality.description}
              </p>
            </motion.div>
          </div>
        )
      }
    ];

    // Add achievements slide if user has unlocked any
    if (unlockedAchievements.length > 0) {
      slides.push({
        id: 'achievements',
        title: 'Achievements Unlocked',
        autoAdvanceDelay: 5000,
        background: 'from-yellow-600 via-orange-500 to-red-500',
        component: (
          <div className="text-center text-white">
            <motion.div
              className="text-7xl mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
            >
              🏅
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              You unlocked
            </motion.h2>
            <motion.div 
              className="text-8xl font-black mb-4 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", bounce: 0.3 }}
            >
              {unlockedAchievements.length}
            </motion.div>
            <motion.p 
              className="text-3xl font-semibold mb-8 opacity-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              achievements!
            </motion.p>
            <motion.div 
              className="grid grid-cols-3 gap-4 max-w-lg mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              {unlockedAchievements.slice(0, 6).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.2 + index * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="text-sm font-bold">{achievement.title}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )
      });
    }

    // Add enhanced weather slide if available
    if (isEnhanced && 'hottestTrip' in stats && (stats.hottestTrip || stats.coldestTrip)) {
      slides.push({
        id: 'weather',
        title: 'Weather Adventures',
        autoAdvanceDelay: 4000,
        background: 'from-cyan-600 via-blue-500 to-indigo-600',
        component: (
          <div className="text-center text-white">
            <motion.div
              className="text-7xl mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
            >
              🌡️
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mb-12"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Your Weather Story
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {stats.hottestTrip && (
                <motion.div 
                  className="bg-gradient-to-br from-red-500/30 to-orange-500/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <div className="text-5xl mb-4">🔥</div>
                  <h3 className="text-2xl font-bold mb-4">Hottest Adventure</h3>
                  <p className="text-4xl font-black mb-2">{stats.hottestTrip.temperature}°C</p>
                  <p className="text-lg opacity-90">{stats.hottestTrip.location}</p>
                </motion.div>
              )}
              {stats.coldestTrip && (
                <motion.div 
                  className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                >
                  <div className="text-5xl mb-4">❄️</div>
                  <h3 className="text-2xl font-bold mb-4">Coldest Adventure</h3>
                  <p className="text-4xl font-black mb-2">{stats.coldestTrip.temperature}°C</p>
                  <p className="text-lg opacity-90">{stats.coldestTrip.location}</p>
                </motion.div>
              )}
            </div>
          </div>
        )
      });
    }

    // Final slide
    slides.push({
      id: 'outro',
      title: 'The End',
      background: 'from-violet-600 via-purple-600 to-indigo-600',
      component: (
        <div className="text-center text-white">
          <motion.div 
            className="text-8xl mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.6 }}
          >
            🎉
          </motion.div>
          <motion.h2 
            className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            That's your story!
          </motion.h2>
          <motion.div 
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 max-w-lg mx-auto mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="text-2xl font-semibold mb-4">Your Journey Summary</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.totalTrips}</div>
                <div className="text-sm opacity-80">trips</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalDistanceKm.toLocaleString()}</div>
                <div className="text-sm opacity-80">km</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.uniqueCountries}</div>
                <div className="text-sm opacity-80">countries</div>
              </div>
            </div>
          </motion.div>
          <motion.button
            className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
            onClick={onComplete}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, type: "spring" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore More Details →
          </motion.button>
        </div>
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
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Dynamic Background */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${currentSlide.background}`}
        key={currentSlide.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
        <motion.div 
          className="h-full bg-white/80"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="max-w-6xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="min-h-[500px] flex items-center justify-center"
            >
              {currentSlide.component}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Controls */}
      <motion.div 
        className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: showControls ? 1 : 0.4, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          onClick={prevSlide}
          disabled={currentSlideIndex === 0}
          className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        <div className="flex gap-3">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all border-2 ${
                index === currentSlideIndex 
                  ? 'bg-white border-white scale-125' 
                  : 'bg-white/30 border-white/50 hover:bg-white/50'
              }`}
              whileHover={{ scale: index === currentSlideIndex ? 1.25 : 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        <motion.button
          onClick={nextSlide}
          disabled={currentSlideIndex === slides.length - 1}
          className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>

        <motion.button
          onClick={toggleAutoAdvance}
          className={`ml-4 px-4 py-2 rounded-full text-sm font-semibold transition-all border border-white/20 ${
            isAutoAdvancing 
              ? 'bg-white text-gray-800' 
              : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAutoAdvancing ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
              Pause
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Play
            </div>
          )}
        </motion.button>
      </motion.div>

      {/* Skip Button */}
      <motion.button
        className="absolute top-8 right-8 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all font-semibold border border-white/20 z-20"
        onClick={onComplete}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: showControls ? 1 : 0.4, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Skip Story →
      </motion.button>
    </div>
  );
};

export default WrappedFlow;
