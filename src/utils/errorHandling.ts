export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userMessage: string; // User-friendly message to display
}

export const ErrorCode = {
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  
  // Parsing errors
  INVALID_JSON: 'INVALID_JSON',
  INVALID_TIMELINE_FORMAT: 'INVALID_TIMELINE_FORMAT',
  NO_TIMELINE_DATA: 'NO_TIMELINE_DATA',
  PARSING_FAILED: 'PARSING_FAILED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_DATE: 'INVALID_DATE',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  
  // Network/API errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

