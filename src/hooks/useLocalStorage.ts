import { useState, useEffect, useCallback } from 'react';
import { storageService, type StorageQuotaInfo, type StoredTravelData, type StoredCacheEntry } from '../services/storage';

interface UseLocalStorageReturn {
  isSupported: boolean;
  quotaInfo: StorageQuotaInfo | null;
  isLoading: boolean;
  error: string | null;
  clearAllData: () => Promise<void>;
  getQuotaInfo: () => Promise<void>;
  exportData: () => Promise<{ travelData: StoredTravelData[], cache: StoredCacheEntry[] }>;
  importData: (data: { travelData: StoredTravelData[], cache?: StoredCacheEntry[] }) => Promise<void>;
}

export const useLocalStorage = (): UseLocalStorageReturn => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkSupport = useCallback(() => {
    const supported = 'indexedDB' in window;
    setIsSupported(supported);
    return supported;
  }, []);

  const getQuotaInfo = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const info = await storageService.getStorageQuota();
      setQuotaInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get storage quota';
      setError(errorMessage);
      console.error('Storage quota error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const clearAllData = useCallback(async () => {
    if (!isSupported) {
      throw new Error('IndexedDB not supported');
    }

    try {
      setIsLoading(true);
      setError(null);
      await storageService.clearAllData();
      await getQuotaInfo(); // Refresh quota info after clearing
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, getQuotaInfo]);

  const exportData = useCallback(async () => {
    if (!isSupported) {
      throw new Error('IndexedDB not supported');
    }

    try {
      setIsLoading(true);
      setError(null);
      return await storageService.exportData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const importData = useCallback(async (data: { travelData: StoredTravelData[], cache?: StoredCacheEntry[] }) => {
    if (!isSupported) {
      throw new Error('IndexedDB not supported');
    }

    try {
      setIsLoading(true);
      setError(null);
      await storageService.importData(data);
      await getQuotaInfo(); // Refresh quota info after import
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, getQuotaInfo]);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  useEffect(() => {
    if (isSupported) {
      getQuotaInfo();
    }
  }, [isSupported, getQuotaInfo]);

  return {
    isSupported,
    quotaInfo,
    isLoading,
    error,
    clearAllData,
    getQuotaInfo,
    exportData,
    importData
  };
};