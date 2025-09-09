import { useState } from 'react'
import { DataInput } from './components/DataInput'
import type { ProcessingResult, EnhancedProcessingResult } from './types/travel'

type AppTravelData = ProcessingResult | EnhancedProcessingResult;

function App() {
  const [travelData, setTravelData] = useState<AppTravelData | null>(null)
  const [currentView, setCurrentView] = useState<'input' | 'results' | 'visualization'>('input')

  const handleDataProcessed = (result: AppTravelData) => {
    setTravelData(result)
    setCurrentView('results')
  }

  const handleContinueToVisualization = () => {
    setCurrentView('visualization')
  }

  const handleBackToInput = () => {
    setTravelData(null)
    setCurrentView('input')
  }

  const isEnhancedResult = (data: AppTravelData): data is EnhancedProcessingResult => {
    return 'enhancedTrips' in data && 'enhancedStats' in data
  }

  const getEnhancedStats = (stats: unknown) => {
    const enhancedStats = stats as { 
      countries?: Array<{name: string; code: string; flag: string; visitCount: number}>;
      hottestTrip?: {location: string; temperature: number; date: string};
      coldestTrip?: {location: string; temperature: number; date: string};
      topDestinations?: Array<{city: string; country: string; visits: number; totalDays: number}>;
    };
    
    return {
      countries: enhancedStats.countries || [],
      hottestTrip: enhancedStats.hottestTrip,
      coldestTrip: enhancedStats.coldestTrip,
      topDestinations: enhancedStats.topDestinations || []
    }
  }

  const renderResults = () => {
    if (!travelData) return null;

    const enhanced = isEnhancedResult(travelData);
    const stats = enhanced ? travelData.enhancedStats : travelData.stats;
    const trips = enhanced ? travelData.enhancedTrips : travelData.trips;

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              {enhanced ? '🌍 Enhanced Travel Analysis Complete!' : '📊 Travel Analysis Complete!'}
            </h2>
            {enhanced && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                AI Enhanced
              </span>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Travel Stats</h3>
              <ul className="space-y-2 text-blue-700">
                <li><span className="font-medium">Total Trips:</span> {trips.length}</li>
                <li><span className="font-medium">Distance:</span> {stats.totalDistanceKm.toLocaleString()} km</li>
                <li><span className="font-medium">Countries:</span> {stats.uniqueCountries}</li>
                <li><span className="font-medium">Cities:</span> {stats.uniqueCities}</li>
                <li><span className="font-medium">Longest Trip:</span> {stats.longestTripKm} km</li>
              </ul>
            </div>
            
            {enhanced && (() => {
              const enhancedStats = getEnhancedStats(stats);
              return (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">Enhanced Insights</h3>
                  <ul className="space-y-2 text-purple-700">
                    <li><span className="font-medium">Countries Visited:</span> {enhancedStats.countries.length}</li>
                    {enhancedStats.countries.slice(0, 2).map((country) => (
                      <li key={country.code}>• {country.flag} {country.name} ({country.visitCount} visits)</li>
                    ))}
                    {enhancedStats.hottestTrip && (
                      <li><span className="font-medium">Hottest:</span> {enhancedStats.hottestTrip.temperature}°C in {enhancedStats.hottestTrip.location}</li>
                    )}
                    {enhancedStats.coldestTrip && (
                      <li><span className="font-medium">Coldest:</span> {enhancedStats.coldestTrip.temperature}°C in {enhancedStats.coldestTrip.location}</li>
                    )}
                  </ul>
                </div>
              );
            })()}
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Processing Info</h3>
              <ul className="space-y-2 text-green-700">
                <li><span className="font-medium">Segments:</span> {travelData.processedSegments} / {travelData.totalSegments}</li>
                <li><span className="font-medium">Errors:</span> {travelData.errors.length}</li>
                <li><span className="font-medium">Success Rate:</span> {Math.round((travelData.processedSegments / travelData.totalSegments) * 100)}%</li>
                <li><span className="font-medium">Date Range:</span><br />
                    <span className="text-sm">{stats.firstTripDate.toDateString()} - {stats.lastTripDate.toDateString()}</span>
                </li>
              </ul>
            </div>
          </div>

          {enhanced && (() => {
            const enhancedStats = getEnhancedStats(stats);
            return enhancedStats.topDestinations.length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">Top Destinations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {enhancedStats.topDestinations.slice(0, 3).map((dest, index) => (
                    <div key={`${dest.city}-${dest.country}`} className="text-center">
                      <div className="text-2xl mb-1">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                      <div className="font-medium text-orange-800">{dest.city}</div>
                      <div className="text-sm text-orange-600">{dest.country}</div>
                      <div className="text-xs text-orange-500">{dest.visits} visits • {dest.totalDays} days</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
            
          {travelData.errors.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Processing Notes</h3>
              <p className="text-yellow-700 text-sm">
                Some segments couldn't be processed ({travelData.errors.length} errors). 
                This is normal for timeline data and doesn't affect your results.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleBackToInput}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Process Another File
            </button>
            <button
              onClick={handleContinueToVisualization}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium shadow-lg"
            >
              Continue to Visualization
            </button>
            {enhanced && (
              <span className="text-xs text-gray-500 self-center">
                ✨ Enhanced with location, weather & country data
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderVisualization = () => {
    if (!travelData) return null;

    const enhanced = isEnhancedResult(travelData);
    const stats = enhanced ? travelData.enhancedStats : travelData.stats;

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Travel Visualization</h2>
            <button
              onClick={() => setCurrentView('results')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Results
            </button>
          </div>
          
          <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Visualization Coming Soon!</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your travel data has been successfully processed{enhanced ? ' and enhanced with API data' : ''}. 
              Map visualization will be implemented in Phase 1.5.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto text-sm text-gray-500">
              <div>🗺️ Interactive Maps</div>
              <div>📍 Trip Routes</div>
              <div>🌡️ Weather Overlay</div>
              <div>🎨 Visual Stats</div>
            </div>
            <div className="mt-8 bg-white/50 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm font-medium text-gray-700">Ready for visualization:</p>
              <p className="text-lg font-bold text-blue-600">{stats.totalTrips} trips • {stats.totalDistanceKm} km</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {currentView === 'input' && (
        <DataInput onDataProcessed={handleDataProcessed} />
      )}
      {currentView === 'results' && renderResults()}
      {currentView === 'visualization' && renderVisualization()}
    </div>
  )
}

export default App
