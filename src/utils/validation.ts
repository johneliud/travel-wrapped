import type { ManualTrip, GoogleTimelineData, LatLng } from '../types/travel';

export class ValidationError extends Error {
  public field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const validateManualTrip = (trip: ManualTrip): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!trip.city || !trip.city.trim()) {
    errors.push('City is required');
  }

  if (!trip.startDate) {
    errors.push('Start date is required');
  }

  // Date validation
  if (trip.startDate) {
    const startDate = new Date(trip.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format');
    } else if (startDate > new Date()) {
      errors.push('Start date cannot be in the future');
    }
  }

  if (trip.endDate) {
    const endDate = new Date(trip.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format');
    } else if (trip.startDate) {
      const startDate = new Date(trip.startDate);
      if (endDate < startDate) {
        errors.push('End date must be after start date');
      }
    }
  }

  // String length validation
  if (trip.city && trip.city.length > 100) {
    errors.push('City name must be less than 100 characters');
  }

  if (trip.country && trip.country.length > 100) {
    errors.push('Country name must be less than 100 characters');
  }

  if (trip.notes && trip.notes.length > 500) {
    errors.push('Notes must be less than 500 characters');
  }

  // Coordinate validation
  if (trip.coordinates) {
    if (!isValidLatLng(trip.coordinates)) {
      errors.push('Invalid coordinates provided');
    }
  }

  return errors;
};

export const validateTimelineJson = (jsonContent: string): { 
  isValid: boolean; 
  errors: string[]; 
  data?: GoogleTimelineData 
} => {
  const errors: string[] = [];

  try {
    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(jsonContent);
    } catch {
      return { 
        isValid: false, 
        errors: ['Invalid JSON format. Please ensure the file is a valid Timeline export.'] 
      };
    }

    // Check basic structure
    if (!data || typeof data !== 'object') {
      errors.push('Timeline data must be an object');
      return { isValid: false, errors };
    }

    const timelineData = data as Record<string, unknown>;

    // Check for semanticSegments array
    if (!timelineData.semanticSegments) {
      errors.push('Missing semanticSegments array. This may not be a Google Timeline export.');
      return { isValid: false, errors };
    }

    if (!Array.isArray(timelineData.semanticSegments)) {
      errors.push('semanticSegments must be an array');
      return { isValid: false, errors };
    }

    // Check if array is empty
    if (timelineData.semanticSegments.length === 0) {
      errors.push('No timeline data found. The file appears to be empty.');
      return { isValid: false, errors };
    }

    // Validate a few segments to ensure proper structure
    const sampleSize = Math.min(5, timelineData.semanticSegments.length);
    for (let i = 0; i < sampleSize; i++) {
      const segment = timelineData.semanticSegments[i];
      const segmentErrors = validateSemanticSegment(segment);
      if (segmentErrors.length > 0) {
        errors.push(...segmentErrors.map(err => `Segment ${i}: ${err}`));
      }
    }

    if (errors.length > sampleSize) {
      errors.unshift('File structure does not match Google Timeline format');
      return { isValid: false, errors };
    }

    return { 
      isValid: errors.length === 0, 
      errors, 
      data: data as GoogleTimelineData 
    };

  } catch (error) {
    return { 
      isValid: false, 
      errors: [`Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
};

const validateSemanticSegment = (segment: unknown): string[] => {
  const errors: string[] = [];

  if (!segment || typeof segment !== 'object') {
    errors.push('must be an object');
    return errors;
  }

  const seg = segment as Record<string, unknown>;

  // Check required time fields
  if (!seg.startTime) {
    errors.push('missing startTime');
  } else if (typeof seg.startTime !== 'string') {
    errors.push('startTime must be a string');
  } else if (isNaN(Date.parse(seg.startTime))) {
    errors.push('startTime is not a valid date');
  }

  if (!seg.endTime) {
    errors.push('missing endTime');
  } else if (typeof seg.endTime !== 'string') {
    errors.push('endTime must be a string');
  } else if (isNaN(Date.parse(seg.endTime))) {
    errors.push('endTime is not a valid date');
  }

  // Check that it has either activity or visit data
  const hasActivity = seg.activity && typeof seg.activity === 'object';
  const hasVisit = seg.visit && typeof seg.visit === 'object';
  const hasTimelinePath = seg.timelinePath && Array.isArray(seg.timelinePath);

  if (!hasActivity && !hasVisit && !hasTimelinePath) {
    errors.push('must have activity, visit, or timelinePath data');
  }

  return errors;
};

export const isValidLatLng = (coords: LatLng): boolean => {
  return (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude)
  );
};

export const sanitizeString = (str: string, maxLength: number = 1000): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ');
};

export const validateFileSize = (file: File, maxSizeMB: number = 50): string[] => {
  const errors: string[] = [];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
  }

  if (file.size < 100) {
    errors.push('File appears to be empty or corrupted');
  }

  return errors;
};

export const validateFileType = (file: File, allowedTypes: string[] = ['.json']): string[] => {
  const errors: string[] = [];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedTypes.some(type => fileName.endsWith(type.toLowerCase()));

  if (!hasValidExtension) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Additional MIME type check for JSON
  if (allowedTypes.includes('.json') && file.type && !file.type.includes('json')) {
    errors.push('File does not appear to be a JSON file');
  }

  return errors;
};