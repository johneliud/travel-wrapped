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

export const useTravelData = (): UseTravelDataReturn => {
  const [travelData, setTravelData] = useState<AppTravelData | null>(null);
  const [allStoredData, setAllStoredData] = useState<StoredTravelData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const convertStoredToApp = useCallback((stored: StoredTravelData): AppTravelData => ({
    basicTrips: stored.basicTrips,
    enhancedTrips: stored.enhancedTrips,
    basicStats: stored.basicStats,
    enhancedStats: stored.enhancedStats,
    manualTrips: stored.manualTrips,
    errors: stored.errors,
    totalSegments: stored.totalSegments,
    processedSegments: stored.processedSegments,
    apiEnrichmentProgress: stored.apiEnrichmentProgress,
    fileName: stored.fileName,
    fileSize: stored.fileSize,
    storageId: stored.id,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt
  }), []);

  const saveTravelData = useCallback(async (data: Omit<AppTravelData, 'storageId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storageId = await storageService.saveTravelData({
        basicTrips: data.basicTrips,
        enhancedTrips: data.enhancedTrips,
        basicStats: data.basicStats,
        enhancedStats: data.enhancedStats,
        manualTrips: data.manualTrips || [],
        errors: data.errors,
        totalSegments: data.totalSegments,
        processedSegments: data.processedSegments,
        apiEnrichmentProgress: data.apiEnrichmentProgress,
        fileName: data.fileName,
        fileSize: data.fileSize
      });

      // Update current data with storage info
      setTravelData({
        ...data,
        storageId,
        createdAt: new Date(),
        updatedAt: new Date(),
        manualTrips: data.manualTrips || []
      });

      // Refresh the list
      await refreshStoredDataList();

      return storageId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save travel data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  