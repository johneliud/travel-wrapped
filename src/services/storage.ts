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