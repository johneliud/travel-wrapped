import { useState } from 'react'
import { DataInput } from './components/DataInput'
import type { ProcessingResult } from './types/travel'

function App() {
  const [travelData, setTravelData] = useState<ProcessingResult | null>(null)

  const handleDataProcessed = (result: ProcessingResult) => {
    setTravelData(result)
    console.log('Travel data processed:', result)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!travelData ? (
        <DataInput onDataProcessed={handleDataProcessed} />
      ) : (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Processing Complete!</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Quick Stats</h3>
                <ul className="space-y-2 text-blue-700">
                  <li>Total Trips: {travelData.trips.length}</li>
                  <li>Total Distance: {travelData.stats.totalDistanceKm} km</li>
                  <li>Unique Cities: {travelData.stats.uniqueCities}</li>
                  <li>Most Visited: {travelData.stats.mostVisitedLocation}</li>
                  <li>Longest Trip: {travelData.stats.longestTripKm} km</li>
                </ul>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Processing Info</h3>
                <ul className="space-y-2 text-green-700">
                  <li>Segments Processed: {travelData.processedSegments} / {travelData.totalSegments}</li>
                  <li>Errors: {travelData.errors.length}</li>
                  <li>Date Range: {travelData.stats.firstTripDate.toDateString()} - {travelData.stats.lastTripDate.toDateString()}</li>
                </ul>
              </div>
            </div>
            
            {travelData.errors.length > 0 && (
              <div className="mt-6 bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Processing Notes</h3>
                <p className="text-yellow-700 text-sm">
                  Some segments couldn't be processed ({travelData.errors.length} errors). 
                  This is normal for timeline data and doesn't affect your results.
                </p>
              </div>
            )}

            <div className="mt-6 flex space-x-4">
              <button
                onClick={() => setTravelData(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Process Another File
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled
              >
                Continue to Visualization (Coming in 1.3)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
