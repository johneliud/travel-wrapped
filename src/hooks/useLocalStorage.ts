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

