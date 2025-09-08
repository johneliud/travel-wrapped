import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { ManualEntry } from '../ManualEntry';
import { ProgressIndicator, StepProgress } from '../ProgressIndicator';
import { TimelineParser } from '../../services/parser';
import type { 
  UploadState, 
  ManualTrip, 
  ProcessingResult,
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
  onDataProcessed: (result: ProcessingResult) => void;
}

export const DataInput: React.FC<DataInputProps> = ({ onDataProcessed }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });
  
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTrips, setManualTrips] = useState<ManualTrip[]>([]);
  const [currentError, setCurrentError] = useState<string | null>(null);

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

      // Parse timeline data
      const result = await TimelineParser.parseTimelineFile(file, (progress) => {
        setUploadState(prev => ({ 
          ...prev, 
          progress: 25 + Math.floor(progress * 0.75) // 25% to 100%
        }));
      });

      // Include manual trips if any
      if (manualTrips.length > 0) {
        const convertedManualTrips = convertManualTripsToProcessed(manualTrips);
        result.trips = [...result.trips, ...convertedManualTrips];
        
        // Recalculate stats with manual trips included
        result.totalSegments += manualTrips.length;
        result.processedSegments += manualTrips.length;
      }

      setUploadState(prev => ({ ...prev, status: 'success', progress: 100 }));
      onDataProcessed(result);

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

  
};