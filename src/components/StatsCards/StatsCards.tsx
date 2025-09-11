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

      {/* Main Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Total Distance */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-4 border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">🛣️</div>
          <h4 className="text-lg font-semibold text-blue-800 mb-1">Total Distance</h4>
          <p className="text-2xl font-bold text-blue-700">{stats.totalDistanceKm.toLocaleString()}</p>
          <p className="text-sm text-blue-600">kilometers traveled</p>
          <div className="mt-2 text-xs text-blue-500">
            {(stats.totalDistanceKm / 40075 * 100).toFixed(1)}% around Earth
          </div>
        </div>

        {/* Countries Visited */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">🌍</div>
          <h4 className="text-lg font-semibold text-green-800 mb-1">Countries</h4>
          <p className="text-2xl font-bold text-green-700">{stats.uniqueCountries}</p>
          <p className="text-sm text-green-600">countries explored</p>
          <div className="mt-2 text-xs text-green-500">
            {(stats.uniqueCountries / 195 * 100).toFixed(1)}% of world countries
          </div>
        </div>

        {/* Cities Visited */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg p-4 border border-yellow-200 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">🏙️</div>
          <h4 className="text-lg font-semibold text-yellow-800 mb-1">Cities</h4>
          <p className="text-2xl font-bold text-yellow-700">{stats.uniqueCities}</p>
          <p className="text-sm text-yellow-600">cities discovered</p>
          <div className="mt-2 text-xs text-yellow-500">
            Urban explorer status!
          </div>
        </div>

        {/* Total Trips */}
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-lg p-4 border border-red-200 hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">✈️</div>
          <h4 className="text-lg font-semibold text-red-800 mb-1">Total Trips</h4>
          <p className="text-2xl font-bold text-red-700">{stats.totalTrips}</p>
          <p className="text-sm text-red-600">adventures completed</p>
          <div className="mt-2 text-xs text-red-500">
            {(stats.totalDistanceKm / stats.totalTrips).toFixed(0)} km average
          </div>
        </div>
      </div>

      {/* Fun Facts from Numbers API */}
      {!factsLoading && travelFacts.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">🎲</span>
            Fun Facts About Your Numbers
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {travelFacts.slice(0, 4).map((fact, index) => (
              <div key={index} className="bg-white/60 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-start">
                  <span className="text-2xl font-bold text-indigo-600 mr-3">{fact.number}</span>
                  <div>
                    <p className="text-sm text-indigo-700">{fact.fact}</p>
                    <span className="text-xs text-indigo-500 capitalize mt-1 inline-block">
                      {fact.category} • {fact.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Section */}
      <div className="bg-gradient-to-br from-green-50 to-teal-100 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-800 flex items-center">
            <span className="text-2xl mr-2">🏅</span>
            Achievements ({unlockedAchievements.length}/{achievements.length})
          </h3>
          {achievements.length > 6 && (
            <button
              onClick={() => setShowAllAchievements(!showAllAchievements)}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              {showAllAchievements ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {displayAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`text-center p-3 rounded-lg border-2 transition-all ${
                achievement.unlocked
                  ? 'bg-green-100 border-green-300 transform hover:scale-105'
                  : 'bg-gray-100 border-gray-200 opacity-60'
              }`}
              title={achievement.description}
            >
              <div className={`text-2xl mb-1 ${achievement.unlocked ? '' : 'grayscale'}`}>
                {achievement.icon}
              </div>
              <div className={`text-xs font-medium ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}`}>
                {achievement.title}
              </div>
              {achievement.threshold && !achievement.unlocked && (
                <div className="text-xs text-gray-500 mt-1">
                  {achievement.threshold}+ required
                </div>
              )}
            </div>
          ))}
        </div>

        {unlockedAchievements.length > 0 && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center bg-green-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              🎉 You've unlocked {unlockedAchievements.length} achievements!
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Stats (if available) */}
      {isEnhanced && 'hottestTrip' in stats && (
        <div className="grid md:grid-cols-2 gap-6">
          {stats.hottestTrip && (
            <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-lg p-6 border border-red-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🌡️</span>
                <h3 className="text-lg font-semibold text-red-800">Hottest Adventure</h3>
              </div>
              <p className="text-2xl font-bold text-red-700">{stats.hottestTrip.temperature}°C</p>
              <p className="text-red-600">{stats.hottestTrip.location}</p>
              <p className="text-sm text-red-500">{stats.hottestTrip.date}</p>
            </div>
          )}

          {stats.coldestTrip && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">❄️</span>
                <h3 className="text-lg font-semibold text-blue-800">Coldest Adventure</h3>
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.coldestTrip.temperature}°C</p>
              <p className="text-blue-600">{stats.coldestTrip.location}</p>
              <p className="text-sm text-blue-500">{stats.coldestTrip.date}</p>
            </div>
          )}
        </div>
      )}

      {/* Countries Visited (Enhanced Stats) */}
      {isEnhanced && 'countries' in stats && stats.countries && stats.countries.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <span className="text-2xl mr-2">🌍</span>
              Countries Visited
            </h3>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {stats.countries.length} countries
            </div>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {stats.countries.slice(0, 24).map((country) => (
              <div 
                key={country.code}
                className="text-center p-2 bg-white/60 rounded-lg border border-blue-100 hover:bg-white hover:shadow-md transition-all"
                title={`${country.name} - ${country.visitCount} visit${country.visitCount > 1 ? 's' : ''}`}
              >
                <div className="text-2xl mb-1">{country.flag}</div>
                <div className="text-xs font-medium text-blue-800 truncate">{country.code}</div>
                {country.visitCount > 1 && (
                  <div className="text-xs text-blue-600 mt-1">{country.visitCount}x</div>
                )}
              </div>
            ))}
          </div>
          
          {stats.countries.length > 24 && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                +{stats.countries.length - 24} more countries
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Destinations (Enhanced Stats) */}
      {isEnhanced && 'topDestinations' in stats && stats.topDestinations && stats.topDestinations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg p-6 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-800 flex items-center">
              <span className="text-2xl mr-2">🏙️</span>
              Top Destinations
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topDestinations.slice(0, 6).map((dest, index) => (
              <div 
                key={`${dest.city}-${dest.country}`}
                className="bg-white/60 rounded-lg p-4 border border-amber-100 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'}
                  </div>
                  <div className="text-xs text-amber-600">#{index + 1}</div>
                </div>
                <div className="font-semibold text-amber-800 mb-1">{dest.city}</div>
                <div className="text-sm text-amber-700">{dest.country}</div>
                <div className="text-xs text-amber-600 mt-2">
                  {dest.visits} visit{dest.visits > 1 ? 's' : ''} • {dest.totalDays} day{dest.totalDays > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Statistics (Section 2.4) */}
      {isEnhanced && (
        <>
          {/* Travel Patterns */}
          {('busiestTravelPeriod' in stats || 'busiestSeason' in stats || 'longestTravelStreak' in stats) && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-lg p-6 border border-teal-200">
              <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                Travel Patterns
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {stats.busiestTravelPeriod && (
                  <div className="bg-white/60 rounded-lg p-4 border border-teal-100">
                    <div className="text-2xl mb-2">🗓️</div>
                    <h4 className="font-semibold text-teal-800 mb-1">Busiest Month</h4>
                    <p className="text-lg font-bold text-teal-700">{stats.busiestTravelPeriod.month}</p>
                    <p className="text-sm text-teal-600">{stats.busiestTravelPeriod.tripsCount} trips</p>
                    <p className="text-xs text-teal-500">{stats.busiestTravelPeriod.totalDistance.toLocaleString()} km traveled</p>
                  </div>
                )}
                
                {stats.busiestSeason && (
                  <div className="bg-white/60 rounded-lg p-4 border border-teal-100">
                    <div className="text-2xl mb-2">
                      {stats.busiestSeason.season === 'Spring' ? '🌸' : 
                       stats.busiestSeason.season === 'Summer' ? '☀️' : 
                       stats.busiestSeason.season === 'Autumn' ? '🍂' : '❄️'}
                    </div>
                    <h4 className="font-semibold text-teal-800 mb-1">Busiest Season</h4>
                    <p className="text-lg font-bold text-teal-700">{stats.busiestSeason.season}</p>
                    <p className="text-sm text-teal-600">{stats.busiestSeason.tripsCount} trips</p>
                    <p className="text-xs text-teal-500">{stats.busiestSeason.totalDistance.toLocaleString()} km traveled</p>
                  </div>
                )}

                {stats.longestTravelStreak && (
                  <div className="bg-white/60 rounded-lg p-4 border border-teal-100">
                    <div className="text-2xl mb-2">🔥</div>
                    <h4 className="font-semibold text-teal-800 mb-1">Longest Streak</h4>
                    <p className="text-lg font-bold text-teal-700">{stats.longestTravelStreak.daysCount} days</p>
                    <p className="text-sm text-teal-600">{stats.longestTravelStreak.tripsCount} trips</p>
                    <p className="text-xs text-teal-500">{stats.longestTravelStreak.countriesVisited} countries visited</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transport & Distance */}
          {('transportModeBreakdown' in stats && stats.transportModeBreakdown && stats.transportModeBreakdown.length > 0) && (
            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-lg p-6 border border-rose-200">
              <h3 className="text-lg font-semibold text-rose-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">🚀</span>
                Transport Mode Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.transportModeBreakdown.slice(0, 6).map((mode) => (
                  <div 
                    key={mode.mode}
                    className="bg-white/60 rounded-lg p-4 border border-rose-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl">
                        {mode.mode === 'Flying' ? '✈️' : 
                         mode.mode === 'Driving' ? '🚗' : 
                         mode.mode === 'Walking' ? '🚶' : '🚊'}
                      </div>
                      <div className="text-xs text-rose-600">{mode.percentage}%</div>
                    </div>
                    <div className="font-semibold text-rose-800 mb-1">{mode.mode}</div>
                    <div className="text-sm text-rose-700 mb-1">{mode.distanceKm.toLocaleString()} km</div>
                    <div className="text-xs text-rose-600">{mode.tripsCount} trips • avg {mode.averageDistance.toLocaleString()} km</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timezone Adventures */}
          {('timezonesCrossed' in stats && stats.timezonesCrossed !== undefined && stats.timezonesCrossed > 0) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">🌐</span>
                Timezone Adventures
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/60 rounded-lg p-4 border border-indigo-100">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-700 mb-1">{stats.timezonesCrossed}</div>
                    <div className="text-sm text-indigo-600">Timezone Crossings</div>
                    <div className="text-xs text-indigo-500 mt-1">Around the world adventure!</div>
                  </div>
                </div>
                
                {('timezoneTransitions' in stats && stats.timezoneTransitions && stats.timezoneTransitions.length > 0) && (
                  <div className="bg-white/60 rounded-lg p-4 border border-indigo-100">
                    <h4 className="font-semibold text-indigo-800 mb-3">Recent Transitions</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {stats.timezoneTransitions.slice(0, 3).map((transition, index) => (
                        <div key={index} className="text-xs">
                          <div className="font-medium text-indigo-700">
                            {transition.fromTimezone} → {transition.toTimezone}
                          </div>
                          <div className="text-indigo-500">
                            {transition.location} • {transition.date}
                          </div>
                        </div>
                      ))}
                      {stats.timezoneTransitions.length > 3 && (
                        <div className="text-xs text-indigo-400 mt-2">
                          +{stats.timezoneTransitions.length - 3} more transitions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading state for facts */}
      {factsLoading && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading fun facts about your travels...</p>
        </div>
      )}
    </div>
  );
};

export default StatsCards;