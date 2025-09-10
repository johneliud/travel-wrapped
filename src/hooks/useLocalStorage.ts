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

  
};