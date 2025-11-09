import React from 'react';
import { StatsCards } from '../StatsCards';
import type { ProcessingResult, EnhancedProcessingResult, TravelStats, EnhancedTravelStats, ProcessedTrip, EnhancedTrip } from '../../types/travel';

interface ResultsViewProps {
  displayData: ProcessingResult | EnhancedProcessingResult;
  isEnhanced: boolean;
  stats: TravelStats | EnhancedTravelStats;
  trips: ProcessedTrip[] | EnhancedTrip[];
  onViewWrapped: () => void;
  onContinueToVisualization: () => void;
  onBackToInput: () => void;
}

// Helper function to check if stats have enhanced properties
const getEnhancedStats = (stats: unknown): EnhancedTravelStats => stats as EnhancedTravelStats;

export const ResultsView: React.FC<ResultsViewProps> = ({
  displayData,
  isEnhanced,
  stats,
  trips,
  onViewWrapped,
  onContinueToVisualization,
  onBackToInput
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            {isEnhanced ? 'Enhanced Travel Analysis Complete!' : 'Travel Analysis Complete!'}
          </h2>
          {isEnhanced && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              AI Enhanced
            </span>
          )}
        </div>
        
        {/* Gamified Stats Display */}
        <StatsCards 
          trips={trips}
          stats={stats}
          isEnhanced={isEnhanced}
        />

        {/* Processing Info */}
        <div className="mt-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="text-xl mr-2">⚙️</span>
            Processing Summary
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">{displayData.processedSegments}</div>
              <div className="text-gray-600">Segments Processed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">{displayData.totalSegments}</div>
              <div className="text-gray-600">Total Segments</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">{Math.round((displayData.processedSegments / displayData.totalSegments) * 100)}%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">{displayData.errors.length}</div>
              <div className="text-gray-600">Errors (Normal)</div>
            </div>
          </div>
          <div className="mt-3 text-center text-xs text-gray-500">
            <span className="font-medium">Date Range:</span> {stats.firstTripDate.toDateString()} → {stats.lastTripDate.toDateString()}
          </div>
        </div>

        {/* Top Destinations (Enhanced only) */}
        {isEnhanced && (() => {
          const enhancedStats = getEnhancedStats(stats);
          return enhancedStats.topDestinations?.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                <span className="text-xl mr-2">🏆</span>
                Top Destinations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {enhancedStats.topDestinations.slice(0, 3).map((dest, index) => (
                  <div key={`${dest.city}-${dest.country}`} className="text-center bg-white/60 rounded-lg p-4 border border-orange-100">
                    <div className="text-3xl mb-2">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                    <div className="font-bold text-orange-800 text-lg">{dest.city}</div>
                    <div className="text-orange-600 font-medium">{dest.country}</div>
                    <div className="text-sm text-orange-500 mt-1">
                      {dest.visits} visits • {dest.totalDays} days total
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
          
        {displayData.errors.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Processing Notes</h3>
            <p className="text-yellow-700 text-sm">
              Some segments couldn't be processed ({displayData.errors.length} errors). 
              This is normal for timeline data and doesn't affect your results.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={onViewWrapped}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-lg hover:from-pink-600 hover:to-rose-600 transition-colors font-bold shadow-lg text-lg"
          >
            View Your Wrapped Story
          </button>
          <button
            onClick={onContinueToVisualization}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium shadow-lg"
          >
            Continue to Visualization
          </button>
          <button
            onClick={onBackToInput}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Process Another File
          </button>
          {isEnhanced && (
            <span className="text-xs text-gray-500 self-center">
              Enhanced with location, weather & country data + gamification
            </span>
          )}
        </div>
      </div>
    </div>
  );
};