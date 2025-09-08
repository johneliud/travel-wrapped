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
