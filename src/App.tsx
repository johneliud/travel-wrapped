import { useState, useCallback, useEffect } from 'react'
import { DataInput } from './components/DataInput'
import { MapView } from './components/MapView'
import { useTravelData, useProcessingResult } from './hooks/useTravelData'
import { useStorageQuota } from './hooks/useStorageQuota'
import type { ProcessingResult, EnhancedProcessingResult } from './types/travel'

function App() {
  const [currentView, setCurrentView] = useState<'input' | 'results' | 'visualization'>('input')
  const { travelData, isLoading, error, clearCurrentData } = useTravelData()
  const { saveProcessingResult } = useProcessingResult()
  const { quotaInfo, isLowStorage, isCriticalStorage } = useStorageQuota(60000) // Check every minute

  const handleDataProcessed = useCallback(async (result: ProcessingResult | EnhancedProcessingResult, fileName?: string, fileSize?: number) => {
    try {
      await saveProcessingResult(result, fileName, fileSize)
      setCurrentView('results')
    } catch (err) {
      console.error('Failed to save processing result:', err)
    }
  }, [saveProcessingResult])

  const handleContinueToVisualization = useCallback(() => {
    setCurrentView('visualization')
  }, [])

  const handleBackToInput = useCallback(() => {
    clearCurrentData()
    setCurrentView('input')
  }, [clearCurrentData])

  // Show storage warnings
  useEffect(() => {
    if (isCriticalStorage && quotaInfo) {
      console.warn(`Storage critical: ${quotaInfo.percentage.toFixed(1)}% used`)
    }
  }, [isCriticalStorage, quotaInfo])

  // Convert stored travel data to the format expected by components
  const getDisplayData = useCallback(() => {
    if (!travelData) return null;

    if (travelData.enhancedTrips && travelData.enhancedStats) {
      // Enhanced result format
      return {
        enhancedTrips: travelData.enhancedTrips,
        enhancedStats: travelData.enhancedStats,
        basicTrips: travelData.basicTrips,
        basicStats: travelData.basicStats,
        totalSegments: travelData.totalSegments,
        processedSegments: travelData.processedSegments,
        apiEnrichmentProgress: travelData.apiEnrichmentProgress,
        errors: travelData.errors
      } as EnhancedProcessingResult;
    } else {
      // Basic result format
      return {
        trips: travelData.basicTrips,
        stats: travelData.basicStats,
        totalSegments: travelData.totalSegments,
        processedSegments: travelData.processedSegments,
        errors: travelData.errors
      } as ProcessingResult;
    }
  }, [travelData]);

  const isEnhancedResult = (data: ProcessingResult | EnhancedProcessingResult): data is EnhancedProcessingResult => {
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
    const displayData = getDisplayData();
    if (!displayData) return null;

    const enhanced = isEnhancedResult(displayData);
    const stats = enhanced ? displayData.enhancedStats : displayData.stats;
    const trips = enhanced ? displayData.enhancedTrips : displayData.trips;

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              {enhanced ? 'Enhanced Travel Analysis Complete!' : 'Travel Analysis Complete!'}
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
                <li><span className="font-medium">Segments:</span> {displayData.processedSegments} / {displayData.totalSegments}</li>
                <li><span className="font-medium">Errors:</span> {displayData.errors.length}</li>
                <li><span className="font-medium">Success Rate:</span> {Math.round((displayData.processedSegments / displayData.totalSegments) * 100)}%</li>
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
            
          {displayData.errors.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Processing Notes</h3>
              <p className="text-yellow-700 text-sm">
                Some segments couldn't be processed ({displayData.errors.length} errors). 
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
    const displayData = getDisplayData();
    if (!displayData) return null;

    const enhanced = isEnhancedResult(displayData);
    const stats = enhanced ? displayData.enhancedStats : displayData.stats;
    const trips = enhanced ? displayData.enhancedTrips : displayData.trips;

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
          
          {/* Map Section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Interactive Travel Map
              {enhanced && (
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
          {enhanced && (() => {
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
              onClick={() => setCurrentView('results')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              ← Back to Results
            </button>
            {enhanced && (
              <span className="text-xs text-gray-500 self-center">
                Map enhanced with location names and weather data
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Storage quota warning */}
      {isCriticalStorage && quotaInfo && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Storage Space Critical!</p>
          <p className="text-sm">
            Using {quotaInfo.percentage.toFixed(1)}% of available storage. 
            Consider clearing old data or exporting your travel history.
          </p>
        </div>
      )}
      {isLowStorage && !isCriticalStorage && quotaInfo && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">Storage Space Low</p>
          <p className="text-sm">
            Using {quotaInfo.percentage.toFixed(1)}% of available storage.
          </p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <p className="text-sm">Loading travel data...</p>
        </div>
      )}
      
      {/* Error indicator */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Storage Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {currentView === 'input' && (
        <DataInput onDataProcessed={handleDataProcessed} />
      )}
      {currentView === 'results' && renderResults()}
      {currentView === 'visualization' && renderVisualization()}
    </div>
  )
}

export default App
