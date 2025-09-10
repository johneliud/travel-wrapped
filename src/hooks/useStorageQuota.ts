import { useState, useEffect, useCallback } from 'react';
import { storageService, type StorageQuotaInfo } from '../services/storage';

interface UseStorageQuotaReturn {
  quotaInfo: StorageQuotaInfo | null;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  isLowStorage: boolean;
  isCriticalStorage: boolean;
  refreshQuota: () => Promise<void>;
  formatBytes: (bytes: number) => string;
}

const LOW_STORAGE_THRESHOLD = 80; // 80%
const CRITICAL_STORAGE_THRESHOLD = 95; // 95%

export const useStorageQuota = (autoRefreshInterval?: number): UseStorageQuotaReturn => {
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkSupport = useCallback(() => {
    const supported = 'storage' in navigator && 'estimate' in navigator.storage!;
    setIsSupported(supported);
    return supported;
  }, []);

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!isSupported) {
      setError('Storage quota estimation not supported in this browser');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const info = await storageService.getStorageQuota();
      setQuotaInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get storage quota information';
      setError(errorMessage);
      console.error('Storage quota error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const isLowStorage = quotaInfo ? quotaInfo.percentage >= LOW_STORAGE_THRESHOLD : false;
  const isCriticalStorage = quotaInfo ? quotaInfo.percentage >= CRITICAL_STORAGE_THRESHOLD : false;

  // Check support on mount
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Initial quota check
  useEffect(() => {
    if (isSupported) {
      refreshQuota();
    }
  }, [isSupported, refreshQuota]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshInterval || !isSupported) return;

    const interval = setInterval(() => {
      refreshQuota();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, isSupported, refreshQuota]);

  // Log storage warnings
  useEffect(() => {
    if (isCriticalStorage) {
      console.warn('Storage quota critical: ' + quotaInfo?.percentage.toFixed(1) + '% used');
    } else if (isLowStorage) {
      console.warn('Storage quota low: ' + quotaInfo?.percentage.toFixed(1) + '% used');
    }
  }, [isLowStorage, isCriticalStorage, quotaInfo]);

  return {
    quotaInfo,
    isSupported,
    isLoading,
    error,
    isLowStorage,
    isCriticalStorage,
    refreshQuota,
    formatBytes
  };
};