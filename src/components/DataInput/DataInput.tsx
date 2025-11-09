import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { ManualEntry } from '../ManualEntry';
import { ProgressIndicator, StepProgress } from '../ProgressIndicator';
import { TimelineParser } from '../../services/parser';
import type { 
  UploadState, 
  ManualTrip, 
  ProcessingResult,
  EnhancedProcessingResult,
  ProcessedTrip 
} from '../../types/travel';
import { 
  validateTimelineJson, 
  validateManualTrip, 
  validateFileSize, 
  validateFileType 
} from '../../utils/validation';
import { AppErrorHandler } from '../../utils/errorHandling';

interface DataInputProps {
  onDataProcessed: (result: ProcessingResult | EnhancedProcessingResult, fileName?: string, fileSize?: number) => void;
}

export const DataInput: React.FC<DataInputProps> = ({ onDataProcessed }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });
  
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTrips, setManualTrips] = useState<ManualTrip[]>([]);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [enhancedProcessing, setEnhancedProcessing] = useState(true);
  const [processingStage, setProcessingStage] = useState<string>('');

  const getProcessingSteps = (): Array<{label: string; status: 'pending' | 'active' | 'completed' | 'error'}> => [
    { 
      label: 'Upload File', 
      status: uploadState.status === 'idle' ? 'pending' :
              uploadState.status === 'uploading' ? 'active' :
              uploadState.status === 'error' ? 'error' : 'completed'
    },
    { 
      label: 'Validate Data', 
      status: uploadState.status === 'processing' && uploadState.progress < 25 ? 'active' :
              uploadState.status === 'success' && uploadState.progress >= 25 ? 'completed' :
              uploadState.status === 'error' ? 'error' : 'pending'
    },
    { 
      label: 'Process Timeline', 
      status: uploadState.status === 'processing' && uploadState.progress >= 25 ? 'active' :
              uploadState.status === 'success' ? 'completed' :
              uploadState.status === 'error' ? 'error' : 'pending'
    },
    { 
      label: 'Generate Stats', 
      status: uploadState.status === 'success' ? 'completed' :
              uploadState.status === 'error' ? 'error' : 'pending'
    }
  ];

  const handleFileSelect = async (file: File) => {
    setCurrentError(null);
    setUploadState({ status: 'uploading', progress: 0, fileName: file.name, fileSize: file.size });

    try {
      // Validate file
      const fileSizeErrors = validateFileSize(file, 50);
      const fileTypeErrors = validateFileType(file, ['.json']);
      
      if (fileSizeErrors.length > 0 || fileTypeErrors.length > 0) {
        const allErrors = [...fileSizeErrors, ...fileTypeErrors];
        throw new Error(allErrors[0]);
      }

      // Update progress to show upload complete
      setUploadState(prev => ({ ...prev, progress: 10 }));

      // Read and validate file content
      const fileContent = await readFileAsText(file);
      const validation = validateTimelineJson(fileContent);
      
      if (!validation.isValid) {
        throw new Error(validation.errors[0] || 'Invalid timeline format');
      }

      setUploadState(prev => ({ ...prev, status: 'processing', progress: 25 }));

      // Parse timeline data - use enhanced processing if enabled
      let result: ProcessingResult | EnhancedProcessingResult;
      
      if (enhancedProcessing) {
        result = await TimelineParser.parseTimelineFileEnhanced(file, (progress, stage) => {
          setProcessingStage(stage);
          setUploadState(prev => ({ 
            ...prev, 
            progress: 25 + Math.floor(progress * 0.75) // 25% to 100%
          }));
        });
      } else {
        result = await TimelineParser.parseTimelineFile(file, (progress) => {
          setUploadState(prev => ({ 
            ...prev, 
            progress: 25 + Math.floor(progress * 0.75) // 25% to 100%
          }));
        });
      }

      // Include manual trips if any
      if (manualTrips.length > 0) {
        const convertedManualTrips = convertManualTripsToProcessed(manualTrips);
        
        if ('enhancedTrips' in result) {
          result.basicTrips = [...result.basicTrips, ...convertedManualTrips];
        } else {
          result.trips = [...result.trips, ...convertedManualTrips];
        }
        
        // Update totals
        result.totalSegments += manualTrips.length;
        result.processedSegments += manualTrips.length;
      }

      setUploadState(prev => ({ ...prev, status: 'success', progress: 100 }));
      onDataProcessed(result, uploadState.fileName, uploadState.fileSize);

    } catch (error) {
      console.error('File processing error:', error);
      const appError = AppErrorHandler.fromError(error);
      setCurrentError(appError.userMessage);
      setUploadState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: appError.userMessage 
      }));
    }
  };

  const handleManualTripAdd = (trip: ManualTrip) => {
    const errors = validateManualTrip(trip);
    if (errors.length > 0) {
      setCurrentError(errors[0]);
      return;
    }

    setManualTrips(prev => [...prev, trip]);
    setCurrentError(null);
    
    setShowManualEntry(false);
  };

  const removeManualTrip = (index: number) => {
    setManualTrips(prev => prev.filter((_, i) => i !== index));
  };

  const convertManualTripsToProcessed = (trips: ManualTrip[]): ProcessedTrip[] => {
    return trips.map((trip, index) => ({
      id: `manual-${index}`,
      startTime: new Date(trip.startDate),
      endTime: trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate),
      startLocation: trip.coordinates || { latitude: 0, longitude: 0 },
      endLocation: trip.coordinates || { latitude: 0, longitude: 0 },
      placeName: trip.city,
      address: trip.country ? `${trip.city}, ${trip.country}` : trip.city,
      city: trip.city,
      country: trip.country,
      activityType: 'MANUAL_ENTRY',
      confidence: 1.0
    }));
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        {/*<h1 className="text-3xl font-bold text-gray-800 mb-2">Travel Wrapped</h1>*/}
        <p className="text-gray-600 mb-8">
          Create your personalized travel recap from Google Timeline data
        </p>
      </div>

      {/* Error Display */}
      {currentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-500">⚠️</div>
            <p className="text-red-700">{currentError}</p>
          </div>
          <button
            onClick={() => setCurrentError(null)}
            className="text-red-600 hover:text-red-800 text-sm underline mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Processing Steps */}
      {uploadState.status !== 'idle' && (
        <div className="bg-gray-50 rounded-lg p-6">
          <StepProgress steps={getProcessingSteps()} />
          
          {(uploadState.status === 'processing' || uploadState.status === 'uploading') && (
            <div className="mt-4">
              <ProgressIndicator
                progress={uploadState.progress}
                message={
                  uploadState.status === 'uploading' ? 'Uploading file...' :
                  uploadState.progress < 25 ? 'Validating timeline data...' :
                  processingStage ? processingStage :
                  uploadState.progress < 75 ? 'Processing travel segments...' :
                  'Calculating travel statistics...'
                }
                size="medium"
                color="blue"
              />
            </div>
          )}
        </div>
      )}

      {/* Main Upload Area */}
      {uploadState.status !== 'success' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Timeline Data
            </h2>
            <FileUpload
              onFileSelect={handleFileSelect}
              uploadState={uploadState}
              maxFileSizeMB={50}
            />
            
            {/* Enhanced Processing Toggle */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enhanced-processing"
                  checked={enhancedProcessing}
                  onChange={(e) => setEnhancedProcessing(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  disabled={uploadState.status === 'processing' || uploadState.status === 'uploading'}
                />
                <label htmlFor="enhanced-processing" className="flex-1">
                  <span className="font-medium text-blue-800">Enhanced Processing</span>
                  <p className="text-sm text-blue-600 mt-1">
                    Get enriched travel insights with location names, weather data, and country information using free APIs. 
                    Takes a bit longer but provides much richer results.
                  </p>
                </label>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">How to get your Timeline data:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Takeout</a></li>
                <li>Select "Timeline"</li>
                <li>Download and extract the Timeline.json file</li>
                <li>Upload it here</li>
              </ol>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Manual Trip Entry
            </h2>
            
            {!showManualEntry ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-4">
                  Add trips manually if you don't have Timeline data
                </p>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Manual Trip
                </button>
              </div>
            ) : (
              <ManualEntry
                onAddTrip={handleManualTripAdd}
                onClose={() => setShowManualEntry(false)}
              />
            )}

            {/* Manual Trips List */}
            {manualTrips.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Manual Trips ({manualTrips.length})
                </h3>
                <div className="space-y-2">
                  {manualTrips.map((trip, index) => (
                    <div key={index} className="flex justify-between items-center bg-white rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{trip.city}{trip.country && `, ${trip.country}`}</p>
                        <p className="text-sm text-gray-600">
                          {trip.startDate}
                          {trip.endDate && ` - ${trip.endDate}`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeManualTrip(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};