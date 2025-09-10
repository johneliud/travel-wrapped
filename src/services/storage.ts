import Dexie, { type EntityTable } from 'dexie';
import type { 
  ProcessedTrip, 
  EnhancedTrip, 
  TravelStats, 
  EnhancedTravelStats,
  ManualTrip
} from '../types/travel';

interface StoredTravelData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  fileName?: string;
  fileSize?: number;
  basicTrips: ProcessedTrip[];
  enhancedTrips?: EnhancedTrip[];
  basicStats: TravelStats;
  enhancedStats?: EnhancedTravelStats;
  manualTrips: ManualTrip[];
  errors: string[];
  totalSegments: number;
  processedSegments: number;
  apiEnrichmentProgress?: number;
}

interface StoredCacheEntry {
  key: string;
  data: unknown;
  createdAt: Date;
  expiresAt: Date;
  service: 'weather' | 'countries' | 'geocoding';
}

interface StorageQuotaInfo {
  used: number;
  available: number;
  percentage: number;
  lastChecked: Date;
}

class TravelWrappedDB extends Dexie {
  travelData!: EntityTable<StoredTravelData, 'id'>;
  cache!: EntityTable<StoredCacheEntry, 'key'>;

  constructor() {
    super('TravelWrappedDB');
    
    this.version(1).stores({
      travelData: 'id, createdAt, updatedAt, fileName',
      cache: 'key, service, expiresAt'
    });
  }
}

export const db = new TravelWrappedDB();

export const storageService = {
  async saveTravelData(data: {
    basicTrips: ProcessedTrip[];
    enhancedTrips?: EnhancedTrip[];
    basicStats: TravelStats;
    enhancedStats?: EnhancedTravelStats;
    manualTrips?: ManualTrip[];
    errors: string[];
    totalSegments: number;
    processedSegments: number;
    apiEnrichmentProgress?: number;
    fileName?: string;
    fileSize?: number;
  }): Promise<string> {
    try {
      const now = new Date();
      const id = `travel_data_${now.getTime()}`;
      
      const storedData: StoredTravelData = {
        id,
        createdAt: now,
        updatedAt: now,
        fileName: data.fileName,
        fileSize: data.fileSize,
        basicTrips: data.basicTrips,
        enhancedTrips: data.enhancedTrips,
        basicStats: data.basicStats,
        enhancedStats: data.enhancedStats,
        manualTrips: data.manualTrips || [],
        errors: data.errors,
        totalSegments: data.totalSegments,
        processedSegments: data.processedSegments,
        apiEnrichmentProgress: data.apiEnrichmentProgress
      };

      await db.travelData.add(storedData);
      return id;
    } catch (error) {
      console.error('Failed to save travel data:', error);
      throw new Error('Failed to save travel data to local storage');
    }
  },

  async loadTravelData(id?: string): Promise<StoredTravelData | null> {
    try {
      if (id) {
        return await db.travelData.get(id) || null;
      }
      
      // Get the most recent data if no ID specified
      const latest = await db.travelData.orderBy('updatedAt').reverse().first();
      return latest || null;
    } catch (error) {
      console.error('Failed to load travel data:', error);
      throw new Error('Failed to load travel data from local storage');
    }
  },

  async updateTravelData(id: string, updates: Partial<StoredTravelData>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await db.travelData.update(id, updateData);
    } catch (error) {
      console.error('Failed to update travel data:', error);
      throw new Error('Failed to update travel data in local storage');
    }
  },

  async getAllTravelData(): Promise<StoredTravelData[]> {
    try {
      return await db.travelData.orderBy('updatedAt').reverse().toArray();
    } catch (error) {
      console.error('Failed to get all travel data:', error);
      throw new Error('Failed to retrieve travel data from local storage');
    }
  },

  async deleteTravelData(id: string): Promise<void> {
    try {
      await db.travelData.delete(id);
    } catch (error) {
      console.error('Failed to delete travel data:', error);
      throw new Error('Failed to delete travel data from local storage');
    }
  },

  async clearAllData(): Promise<void> {
    try {
      await db.travelData.clear();
      await db.cache.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear all data from local storage');
    }
  },

  // Cache management for API responses
  async saveToCache(key: string, data: unknown, expirationHours: number, service: 'weather' | 'countries' | 'geocoding'): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
      
      await db.cache.put({
        key,
        data,
        createdAt: now,
        expiresAt,
        service
      });
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  },

  async getFromCache(key: string): Promise<unknown | null> {
    try {
      const entry = await db.cache.get(key);
      if (!entry) return null;
      
      if (new Date() > entry.expiresAt) {
        await db.cache.delete(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Failed to get from cache:', error);
      return null;
    }
  },

  async clearExpiredCache(): Promise<void> {
    try {
      const now = new Date();
      await db.cache.where('expiresAt').below(now).delete();
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  },

  async clearCacheByService(service: 'weather' | 'countries' | 'geocoding'): Promise<void> {
    try {
      await db.cache.where('service').equals(service).delete();
    } catch (error) {
      console.error('Failed to clear cache by service:', error);
    }
  },

  // Storage quota monitoring
  async getStorageQuota(): Promise<StorageQuotaInfo> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        const percentage = available > 0 ? (used / available) * 100 : 0;
        
        return {
          used,
          available,
          percentage,
          lastChecked: new Date()
        };
      }
      
      // Fallback for browsers that don't support storage estimation
      return {
        used: 0,
        available: 0,
        percentage: 0,
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return {
        used: 0,
        available: 0,
        percentage: 0,
        lastChecked: new Date()
      };
    }
  },

  
};

// Initialize database and handle errors
db.on('ready', async () => {
  console.log('Travel Wrapped database ready');
  
  // Clear expired cache on startup
  await storageService.clearExpiredCache();
});

db.on('blocked', () => {
  console.warn('Database blocked - another tab may have a newer version');
});

db.on('versionchange', () => {
  console.warn('Database version changed - please refresh the page');
});

export type { StoredTravelData, StoredCacheEntry, StorageQuotaInfo };