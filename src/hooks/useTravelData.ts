import { useState, useEffect, useCallback } from 'react';
import { storageService, type StoredTravelData } from '../services/storage';
import type { 
  ProcessedTrip, 
  EnhancedTrip, 
  TravelStats, 
  EnhancedTravelStats,
  ProcessingResult,
  EnhancedProcessingResult,
  ManualTrip
} from '../types/travel';

interface AppTravelData {
  basicTrips: ProcessedTrip[];
  enhancedTrips?: EnhancedTrip[];
  basicStats: TravelStats;
  enhancedStats?: EnhancedTravelStats;
  manualTrips: ManualTrip[];
  errors: string[];
  totalSegments: number;
  processedSegments: number;
  apiEnrichmentProgress?: number;
  fileName?: string;
  fileSize?: number;
  storageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UseTravelDataReturn {
  travelData: AppTravelData | null;
  isLoading: boolean;
  error: string | null;
  allStoredData: StoredTravelData[];
  saveTravelData: (data: Omit<AppTravelData, 'storageId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  loadTravelData: (id?: string) => Promise<void>;
  updateTravelData: (updates: Partial<AppTravelData>) => Promise<void>;
  deleteTravelData: (id: string) => Promise<void>;
  refreshStoredDataList: () => Promise<void>;
  clearCurrentData: () => void;
}

