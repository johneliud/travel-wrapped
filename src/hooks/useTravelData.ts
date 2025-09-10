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

  const loadTravelData = useCallback(async (id?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stored = await storageService.loadTravelData(id);
      
      if (stored) {
        setTravelData(convertStoredToApp(stored));
      } else {
        setTravelData(null);
        setError(id ? 'Travel data not found' : 'No saved travel data found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load travel data';
      setError(errorMessage);
      setTravelData(null);
    } finally {
      setIsLoading(false);
    }
  }, [convertStoredToApp]);

  const updateTravelData = useCallback(async (updates: Partial<AppTravelData>) => {
    if (!travelData?.storageId) {
      throw new Error('No travel data ID to update');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare updates for storage
      const storageUpdates: Partial<StoredTravelData> = {};
      
      if (updates.basicTrips !== undefined) storageUpdates.basicTrips = updates.basicTrips;
      if (updates.enhancedTrips !== undefined) storageUpdates.enhancedTrips = updates.enhancedTrips;
      if (updates.basicStats !== undefined) storageUpdates.basicStats = updates.basicStats;
      if (updates.enhancedStats !== undefined) storageUpdates.enhancedStats = updates.enhancedStats;
      if (updates.manualTrips !== undefined) storageUpdates.manualTrips = updates.manualTrips;
      if (updates.errors !== undefined) storageUpdates.errors = updates.errors;
      if (updates.totalSegments !== undefined) storageUpdates.totalSegments = updates.totalSegments;
      if (updates.processedSegments !== undefined) storageUpdates.processedSegments = updates.processedSegments;
      if (updates.apiEnrichmentProgress !== undefined) storageUpdates.apiEnrichmentProgress = updates.apiEnrichmentProgress;
      if (updates.fileName !== undefined) storageUpdates.fileName = updates.fileName;
      if (updates.fileSize !== undefined) storageUpdates.fileSize = updates.fileSize;

      await storageService.updateTravelData(travelData.storageId, storageUpdates);

      // Update local state
      setTravelData({
        ...travelData,
        ...updates,
        updatedAt: new Date()
      });

      // Refresh the list
      await refreshStoredDataList();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update travel data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [travelData]);

  const deleteTravelData = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await storageService.deleteTravelData(id);
      
      // If we deleted the current data, clear it
      if (travelData?.storageId === id) {
        setTravelData(null);
      }

      // Refresh the list
      await refreshStoredDataList();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete travel data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [travelData]);

  
};

