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

  
};