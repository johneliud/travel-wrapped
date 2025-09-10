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

