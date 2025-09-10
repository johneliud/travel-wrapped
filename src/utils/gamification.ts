import type { TravelStats, EnhancedTravelStats } from '../types/travel';

// Achievement system for travel stats
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  threshold?: number;
  category: 'distance' | 'countries' | 'cities' | 'trips' | 'special';
}

// Numbers API response interface
interface NumbersFact {
  text: string;
  found: boolean;
  type: string;
}

// Dynamic fact from Numbers API
export interface DynamicFact {
  number: number;
  fact: string;
  type: 'math' | 'trivia' | 'date' | 'year';
  category: 'distance' | 'countries' | 'cities' | 'trips';
}

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked'>[] = [
  // Distance achievements
  { id: 'first_steps', title: 'First Steps', description: 'Completed your first trip analysis', icon: '👣', category: 'special' },
  { id: 'city_hopper', title: 'City Hopper', description: 'Visited 5+ cities', icon: '🏙️', threshold: 5, category: 'cities' },
  { id: 'urban_explorer', title: 'Urban Explorer', description: 'Visited 10+ cities', icon: '🗺️', threshold: 10, category: 'cities' },
  { id: 'metropolitan', title: 'Metropolitan', description: 'Visited 25+ cities', icon: '🌆', threshold: 25, category: 'cities' },
  { id: 'global_citizen', title: 'Global Citizen', description: 'Visited 50+ cities', icon: '🌍', threshold: 50, category: 'cities' },
  
  // Country achievements
  { id: 'passport_stamp', title: 'Passport Stamp', description: 'Visited 3+ countries', icon: '🛂', threshold: 3, category: 'countries' },
  { id: 'border_crosser', title: 'Border Crosser', description: 'Visited 5+ countries', icon: '🗺️', threshold: 5, category: 'countries' },
  { id: 'international', title: 'International', description: 'Visited 10+ countries', icon: '✈️', threshold: 10, category: 'countries' },
  { id: 'world_traveler', title: 'World Traveler', description: 'Visited 20+ countries', icon: '🌏', threshold: 20, category: 'countries' },
  { id: 'globe_trotter', title: 'Globe Trotter', description: 'Visited 35+ countries', icon: '🌐', threshold: 35, category: 'countries' },
  
  // Distance achievements  
  { id: 'weekend_warrior', title: 'Weekend Warrior', description: 'Traveled 1,000+ km', icon: '🚗', threshold: 1000, category: 'distance' },
  { id: 'road_tripper', title: 'Road Tripper', description: 'Traveled 5,000+ km', icon: '🛣️', threshold: 5000, category: 'distance' },
  { id: 'long_hauler', title: 'Long Hauler', description: 'Traveled 10,000+ km', icon: '✈️', threshold: 10000, category: 'distance' },
  { id: 'earth_circler', title: 'Earth Circler', description: 'Traveled 40,000+ km (Earth\'s circumference!)', icon: '🌍', threshold: 40000, category: 'distance' },
  { id: 'space_bound', title: 'Space Bound', description: 'Traveled 100,000+ km', icon: '🚀', threshold: 100000, category: 'distance' },
  
  // Trip count achievements
  { id: 'frequent_flyer', title: 'Frequent Flyer', description: 'Completed 25+ trips', icon: '🎫', threshold: 25, category: 'trips' },
  { id: 'travel_addict', title: 'Travel Addict', description: 'Completed 50+ trips', icon: '🧳', threshold: 50, category: 'trips' },
  { id: 'nomadic', title: 'Nomadic', description: 'Completed 100+ trips', icon: '🏕️', threshold: 100, category: 'trips' },
  
  // Special achievements
  { id: 'arctic_explorer', title: 'Arctic Explorer', description: 'Traveled somewhere really cold (below -10°C)', icon: '🧊', category: 'special' },
  { id: 'desert_walker', title: 'Desert Walker', description: 'Traveled somewhere really hot (above 40°C)', icon: '🏜️', category: 'special' },
  { id: 'weather_warrior', title: 'Weather Warrior', description: 'Experienced both extreme hot and cold', icon: '🌡️', category: 'special' },
];

// Numbers API service
export const numbersApiService = {
  async getFact(number: number, type: 'math' | 'trivia' | 'date' | 'year' = 'trivia'): Promise<NumbersFact | null> {
    try {
      const cacheKey = `numbers_${type}_${number}`;
      
      // Check cache first (using existing storage service pattern)
      if (typeof window !== 'undefined' && 'storage' in navigator) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, expiry } = JSON.parse(cached);
          if (Date.now() < expiry) {
            return data;
          }
        }
      }

      const response = await fetch(`http://numbersapi.com/${number}/${type}?json`);
      if (!response.ok) {
        throw new Error('Numbers API request failed');
      }
      
      const fact = await response.json() as NumbersFact;
      
      // Cache for 24 hours
      if (typeof window !== 'undefined') {
        const cacheData = {
          data: fact,
          expiry: Date.now() + 24 * 60 * 60 * 1000
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }
      
      return fact;
    } catch (error) {
      console.warn('Failed to fetch from Numbers API:', error);
      return null;
    }
  },

  async getMultipleFacts(numbers: Array<{ value: number; type: 'math' | 'trivia' | 'date' | 'year' }>): Promise<DynamicFact[]> {
    const facts = await Promise.allSettled(
      numbers.map(async ({ value, type }) => {
        const fact = await this.getFact(value, type);
        return fact ? {
          number: value,
          fact: fact.text,
          type,
          category: 'distance' as const // Default, will be overridden
        } : null;
      })
    );

    const results: DynamicFact[] = [];
    for (const result of facts) {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
      }
    }
    return results;
  }
};

// Function to get interesting facts about travel stats using Numbers API
export async function getTravelFacts(stats: TravelStats | EnhancedTravelStats): Promise<DynamicFact[]> {
  const factsToFetch: Array<{ 
    value: number; 
    type: 'math' | 'trivia' | 'date' | 'year';
    category: 'distance' | 'countries' | 'cities' | 'trips';
  }> = [];
  
  // Get facts about key numbers
  if (stats.totalDistanceKm > 0) {
    factsToFetch.push({ 
      value: Math.round(stats.totalDistanceKm), 
      type: 'trivia' as const,
      category: 'distance' as const
    });
  }
  
  if (stats.uniqueCountries > 0) {
    factsToFetch.push({ 
      value: stats.uniqueCountries, 
      type: 'trivia' as const,
      category: 'countries' as const  
    });
  }
  
  if (stats.uniqueCities > 0) {
    factsToFetch.push({ 
      value: stats.uniqueCities, 
      type: 'math' as const,
      category: 'cities' as const
    });
  }
  
  if (stats.totalTrips > 0) {
    factsToFetch.push({ 
      value: stats.totalTrips, 
      type: 'trivia' as const,
      category: 'trips' as const
    });
  }

  const facts = await numbersApiService.getMultipleFacts(
    factsToFetch.map(({ value, type }) => ({ value, type }))
  );
  
  // Add category information
  return facts.map((fact, index) => ({
    ...fact,
    category: factsToFetch[index]?.category || ('distance' as const)
  }));
}

// Function to check which achievements are unlocked
export function calculateAchievements(stats: TravelStats | EnhancedTravelStats): Achievement[] {
  const achievements: Achievement[] = [];
  
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    let unlocked = false;
    
    switch (def.category) {
      case 'special':
        if (def.id === 'first_steps') {
          unlocked = stats.totalTrips > 0;
        } else if (def.id === 'arctic_explorer' && 'coldestTrip' in stats && stats.coldestTrip) {
          unlocked = stats.coldestTrip.temperature < -10;
        } else if (def.id === 'desert_walker' && 'hottestTrip' in stats && stats.hottestTrip) {
          unlocked = stats.hottestTrip.temperature > 40;
        } else if (def.id === 'weather_warrior' && 'hottestTrip' in stats && 'coldestTrip' in stats) {
          unlocked = Boolean(stats.hottestTrip && stats.coldestTrip && 
                    stats.hottestTrip.temperature > 40 && 
                    stats.coldestTrip.temperature < -10);
        }
        break;
        
      case 'distance':
        unlocked = def.threshold ? stats.totalDistanceKm >= def.threshold : false;
        break;
        
      case 'countries':
        unlocked = def.threshold ? stats.uniqueCountries >= def.threshold : false;
        break;
        
      case 'cities':
        unlocked = def.threshold ? stats.uniqueCities >= def.threshold : false;
        break;
        
      case 'trips':
        unlocked = def.threshold ? stats.totalTrips >= def.threshold : false;
        break;
    }
    
    achievements.push({ ...def, unlocked });
  }
  
  return achievements.sort((a, b) => {
    // Show unlocked achievements first
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? -1 : 1;
    }
    return 0;
  });
}
