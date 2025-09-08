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
    let data: any;
    try {
      data = JSON.parse(jsonContent);
    } catch (parseError) {
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

    // Check for semanticSegments array
    if (!data.semanticSegments) {
      errors.push('Missing semanticSegments array. This may not be a Google Timeline export.');
      return { isValid: false, errors };
    }

    if (!Array.isArray(data.semanticSegments)) {
      errors.push('semanticSegments must be an array');
      return { isValid: false, errors };
    }

    // Check if array is empty
    if (data.semanticSegments.length === 0) {
      errors.push('No timeline data found. The file appears to be empty.');
      return { isValid: false, errors };
    }

    // Validate a few segments to ensure proper structure
    const sampleSize = Math.min(5, data.semanticSegments.length);
    for (let i = 0; i < sampleSize; i++) {
      const segment = data.semanticSegments[i];
      const segmentErrors = validateSemanticSegment(segment, i);
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

const validateSemanticSegment = (segment: any, _index: number): string[] => {
  const errors: string[] = [];

  if (!segment || typeof segment !== 'object') {
    errors.push('must be an object');
    return errors;
  }

  // Check required time fields
  if (!segment.startTime) {
    errors.push('missing startTime');
  } else if (typeof segment.startTime !== 'string') {
    errors.push('startTime must be a string');
  } else if (isNaN(Date.parse(segment.startTime))) {
    errors.push('startTime is not a valid date');
  }

  if (!segment.endTime) {
    errors.push('missing endTime');
  } else if (typeof segment.endTime !== 'string') {
    errors.push('endTime must be a string');
  } else if (isNaN(Date.parse(segment.endTime))) {
    errors.push('endTime is not a valid date');
  }

  // Check that it has either activity or visit data
  const hasActivity = segment.activity && typeof segment.activity === 'object';
  const hasVisit = segment.visit && typeof segment.visit === 'object';
  const hasTimelinePath = segment.timelinePath && Array.isArray(segment.timelinePath);

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

