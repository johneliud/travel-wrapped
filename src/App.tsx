import { useState, useCallback, useEffect } from 'react'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { DataInput } from './components/DataInput'
import { WrappedFlow } from './components/WrappedFlow'
import { ResultsView, VisualizationView } from './components/views'
import { useTravelData, useProcessingResult } from './hooks/useTravelData'
import { useStorageQuota } from './hooks/useStorageQuota'
import type { ProcessingResult, EnhancedProcessingResult } from './types/travel'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'wrapped'>('home')
  const [currentView, setCurrentView] = useState<'input' | 'results' | 'visualization' | 'wrapped'>('input')
  const { travelData, isLoading, error, clearCurrentData } = useTravelData()
  const { saveProcessingResult } = useProcessingResult()
  const { quotaInfo, isLowStorage, isCriticalStorage } = useStorageQuota(60000) // Check every minute
  const [showError, setShowError] = useState(false)

  const handleDataProcessed = useCallback(async (result: ProcessingResult | EnhancedProcessingResult, fileName?: string, fileSize?: number) => {
    try {
      await saveProcessingResult(result, fileName, fileSize)
      // Automatically start wrapped story instead of going to results
      setCurrentView('wrapped')
    } catch (err) {
      console.error('Failed to save processing result:', err)
      setCurrentView('input') // Stay on input view if save fails
    }
  }, [saveProcessingResult])

  const handleContinueToVisualization = useCallback(() => {
    setCurrentView('visualization')
  }, [])

  const handleViewWrapped = useCallback(() => {
    setCurrentView('wrapped')
  }, [])

  const handleCompleteWrapped = useCallback(() => {
    setCurrentView('results')
  }, [])

  const handleBackToInput = useCallback(() => {
    clearCurrentData()
    setCurrentView('input')
  }, [clearCurrentData])

  const handleBackToResults = useCallback(() => {
    setCurrentView('results')
  }, [])

  const handleNavigate = useCallback((page: 'home' | 'wrapped') => {
    setCurrentPage(page)
    if (page === 'wrapped') {
      setCurrentView('input')
    }
  }, [])

  const handleGetStarted = useCallback(() => {
    setCurrentPage('wrapped')
    setCurrentView('input')
  }, [])

  // Show storage warnings
  useEffect(() => {
    if (isCriticalStorage && quotaInfo) {
      console.warn(`Storage critical: ${quotaInfo.percentage.toFixed(1)}% used`)
    }
  }, [isCriticalStorage, quotaInfo])

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => {
        setShowError(false)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowError(false)
    }
  }, [error])

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

  const renderResults = () => {
    const displayData = getDisplayData();
    if (!displayData) {
      console.error('No display data available')
      return <div className="p-8 text-center">No data available</div>
    }

    const enhanced = isEnhancedResult(displayData);
    const stats = enhanced ? displayData.enhancedStats : displayData.stats;
    const trips = enhanced ? displayData.enhancedTrips : displayData.trips;

    return (
      <ResultsView
        displayData={displayData}
        isEnhanced={enhanced}
        stats={stats}
        trips={trips}
        onViewWrapped={handleViewWrapped}
        onContinueToVisualization={handleContinueToVisualization}
        onBackToInput={handleBackToInput}
      />
    );
  };

  const renderVisualization = () => {
    const displayData = getDisplayData();
    if (!displayData) return null;

    const enhanced = isEnhancedResult(displayData);
    const stats = enhanced ? displayData.enhancedStats : displayData.stats;
    const trips = enhanced ? displayData.enhancedTrips : displayData.trips;

    return (
      <VisualizationView
        isEnhanced={enhanced}
        stats={stats}
        trips={trips}
        onBackToResults={handleBackToResults}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      
      {/* Storage quota warning */}
      {isCriticalStorage && quotaInfo && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-bold">
                Storage Critical: {quotaInfo.percentage.toFixed(1)}% used
              </p>
              <p className="text-sm">
                Consider clearing some data or exporting your results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Low storage warning */}
      {isLowStorage && !isCriticalStorage && quotaInfo && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-bold">
                Storage Low: {quotaInfo.percentage.toFixed(1)}% used
              </p>
              <p className="text-sm">
                Your local storage is getting full. Consider exporting your data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentPage === 'home' && (
        <HomePage onGetStarted={handleGetStarted} />
      )}
      
      {currentPage === 'wrapped' && (
        <>
          {currentView === 'input' && (
            <DataInput onDataProcessed={handleDataProcessed} />
          )}
          
          {currentView === 'results' && renderResults()}
          
          {currentView === 'visualization' && renderVisualization()}
          
          {currentView === 'wrapped' && (() => {
            const displayData = getDisplayData();
            if (!displayData) return null;
            
            const enhanced = isEnhancedResult(displayData);
            const stats = enhanced ? displayData.enhancedStats : displayData.stats;
            const trips = enhanced ? displayData.enhancedTrips : displayData.trips;
            
            return (
              <WrappedFlow 
                trips={trips}
                stats={stats}
                isEnhanced={enhanced}
                onComplete={handleCompleteWrapped}
              />
            );
          })()}
        </>
      )}

      {/* Error Display */}
      {error && (
        <div className={`fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 transition-all duration-300 ${
          showError ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}>
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-center text-gray-600">Loading travel data...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
