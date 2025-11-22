import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>🌍</span>
            <span>Privacy-First Travel Analytics</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Travel Story
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your Google Timeline data into beautiful travel insights and shareable memories
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {currentError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start space-x-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Something went wrong</p>
                  <p className="text-red-700 text-sm mt-1">{currentError}</p>
                </div>
                <button
                  onClick={() => setCurrentError(null)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing Steps */}
        <AnimatePresence>
          {uploadState.status !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <StepProgress steps={getProcessingSteps()} />
              
              {(uploadState.status === 'processing' || uploadState.status === 'uploading') && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6"
                >
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
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {uploadState.status !== 'success' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Upload Timeline Data</h2>
                    <p className="text-gray-600 text-sm">Get the most comprehensive travel insights</p>
                  </div>
                </div>
                
                <FileUpload
                  onFileSelect={handleFileSelect}
                  uploadState={uploadState}
                  maxFileSizeMB={50}
                />
                
                {/* Enhanced Processing Toggle */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="enhanced-processing"
                      checked={enhancedProcessing}
                      onChange={(e) => setEnhancedProcessing(e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      disabled={uploadState.status === 'processing' || uploadState.status === 'uploading'}
                    />
                    <label htmlFor="enhanced-processing" className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-blue-900">Enhanced Processing</span>
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Recommended</span>
                      </div>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        Enriches your data with real location names, weather insights, and country information. 
                        Uses free APIs and takes a bit longer but provides much richer results.
                      </p>
                    </label>
                  </div>
                </motion.div>
                
                {/* Instructions */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    How to get your Timeline data:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Visit <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline">Google Takeout</a></li>
                    <li>Select "Timeline" from the list</li>
                    <li>Choose JSON format and download</li>
                    <li>Extract and upload the Timeline.json file</li>
                  </ol>
                </motion.div>
              </div>
            </motion.div>

            {/* Manual Entry Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Manual Trip Entry</h2>
                    <p className="text-gray-600 text-sm">Add trips without Timeline data</p>
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {!showManualEntry ? (
                    <motion.div 
                      key="add-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-6">
                        Perfect for adding specific trips or when you don't have Timeline data
                      </p>
                      <button
                        onClick={() => setShowManualEntry(true)}
                        className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Add Manual Trip
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual-entry"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <ManualEntry
                        onAddTrip={handleManualTripAdd}
                        onClose={() => setShowManualEntry(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual Trips List */}
                <AnimatePresence>
                  {manualTrips.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <span className="mr-2">✈️</span>
                          Manual Trips ({manualTrips.length})
                        </h3>
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                          Ready to process
                        </span>
                      </div>
                      <div className="space-y-3">
                        {manualTrips.map((trip, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex justify-between items-center bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 flex items-center">
                                <span className="mr-2">📍</span>
                                {trip.city}{trip.country && `, ${trip.country}`}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 flex items-center">
                                <span className="mr-2">📅</span>
                                {trip.startDate}
                                {trip.endDate && ` → ${trip.endDate}`}
                              </p>
                            </div>
                            <button
                              onClick={() => removeManualTrip(index)}
                              className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove trip"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};