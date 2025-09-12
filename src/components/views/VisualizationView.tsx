import React from 'react';
import { MapView } from '../MapView';
import type { TravelStats, EnhancedTravelStats, ProcessedTrip, EnhancedTrip } from '../../types/travel';

interface VisualizationViewProps {
  isEnhanced: boolean;
  stats: TravelStats | EnhancedTravelStats;
  trips: ProcessedTrip[] | EnhancedTrip[];
  onBackToResults: () => void;
}

// Helper function to check if stats have enhanced properties
const getEnhancedStats = (stats: unknown): EnhancedTravelStats => stats as EnhancedTravelStats;

export const VisualizationView: React.FC<VisualizationViewProps> = ({
  isEnhanced,
  stats,
  trips,
  onBackToResults
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Travel Visualization</h2>
          <button
            onClick={onBackToResults}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Results
          </button>
        </div>
        
        {/* Map Section */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Interactive Travel Map
            {isEnhanced && (
              <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                Enhanced
              </span>
            )}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <MapView 
              trips={trips} 
              className="h-96 w-full"
            />
          </div>
        </div>

        {/* Map Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">📍 Locations</h4>
            <p className="text-2xl font-bold text-blue-700">{stats.uniqueCities}</p>
            <p className="text-sm text-blue-600">Unique cities visited</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-800 mb-2">🌍 Countries</h4>
            <p className="text-2xl font-bold text-green-700">{stats.uniqueCountries}</p>
            <p className="text-sm text-green-600">Countries explored</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-purple-800 mb-2">🛣️ Distance</h4>
            <p className="text-2xl font-bold text-purple-700">{stats.totalDistanceKm.toLocaleString()}</p>
            <p className="text-sm text-purple-600">Kilometers traveled</p>
          </div>
        </div>

        {/* Enhanced Data Features */}
        {isEnhanced && (() => {
          const enhancedStats = getEnhancedStats(stats);
          return (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-indigo-800 mb-3">Enhanced Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {enhancedStats.hottestTrip && (
                  <div>
                    <span className="font-medium text-red-600">🌡️ Hottest Trip:</span>
                    <br />
                    <span className="text-indigo-700">
                      {enhancedStats.hottestTrip.temperature}°C in {enhancedStats.hottestTrip.location}
                    </span>
                  </div>
                )}
                {enhancedStats.coldestTrip && (
                  <div>
                    <span className="font-medium text-blue-600">❄️ Coldest Trip:</span>
                    <br />
                    <span className="text-indigo-700">
                      {enhancedStats.coldestTrip.temperature}°C in {enhancedStats.coldestTrip.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div className="mt-8 bg-green-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-800 mb-2">Phase 1.5 Complete!</h4>
          <p className="text-green-700 text-sm mb-3">
            Basic visualization is now implemented with interactive maps, location pins, and route connections.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-green-600">
            <div>Interactive Maps</div>
            <div>Trip Routes</div>
            <div>Location Markers</div>
            <div>Map Controls</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={onBackToResults}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ← Back to Results
          </button>
          {isEnhanced && (
            <span className="text-xs text-gray-500 self-center">
              Map enhanced with location names and weather data
            </span>
          )}
        </div>
      </div>
    </div>
  );
};