// Interfaces for the application based on the Google Timeline

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface TimelinePoint {
  point: string; // Format: "latitude°, longitude°"
  time: string; // ISO timestamp
}

export interface PlaceCandidate {
  placeId: string;
  name?: string;
  address?: string;
  location?: LatLng;
  placeConfidence?: number;
}

export interface ActivityCandidate {
  type: string; // "WALKING", "DRIVING", "IN_BUS", etc.
  probability: number;
}

export interface Activity {
  start?: {
    latLng: string;
  };
  end?: {
    latLng: string;
  };
  distanceMeters?: number;
  probability?: number;
  topCandidate?: ActivityCandidate;
}

export interface Visit {
  hierarchyLevel?: number;
  probability?: number;
  topCandidate?: PlaceCandidate;
  otherCandidates?: PlaceCandidate[];
}

export interface SemanticSegment {
  startTime: string;
  endTime: string;
  startTimeTimezoneUtcOffsetMinutes?: number;
  endTimeTimezoneUtcOffsetMinutes?: number;
  timelinePath?: TimelinePoint[];
  activity?: Activity;
  visit?: Visit;
}

export interface GoogleTimelineData {
  semanticSegments: SemanticSegment[];
}

// Processed trip data structures
export interface ProcessedTrip {
  id: string;
  startTime: Date;
  endTime: Date;
  startLocation: LatLng;
  endLocation: LatLng;
  placeName?: string;
  address?: string;
  city?: string;
  country?: string;
  distanceMeters?: number;
  activityType?: string;
  confidence: number;
}

export interface TravelStats {
  totalDistanceKm: number;
  uniqueCities: number;
  uniqueCountries: number;
  longestTripKm: number;
  mostVisitedLocation: string;
  totalTrips: number;
  firstTripDate: Date;
  lastTripDate: Date;
}

// Manual trip entry
export interface ManualTrip {
  city: string;
  country?: string;
  startDate: string; // YYYY-MM-DD format
  endDate?: string;
  notes?: string;
  coordinates?: LatLng;
}

// Upload and processing states
export interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ProcessingResult {
  trips: ProcessedTrip[];
  stats: TravelStats;
  totalSegments: number;
  processedSegments: number;
  errors: string[];
}