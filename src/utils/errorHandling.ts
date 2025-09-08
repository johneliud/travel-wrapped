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

export class AppErrorHandler {
  private static getUserFriendlyMessage(code: ErrorCode, originalMessage?: string): string {
    const errorMessages: Record<ErrorCode, string> = {
      [ErrorCode.FILE_TOO_LARGE]: 'The file is too large. Please select a file smaller than 50MB.',
      [ErrorCode.INVALID_FILE_TYPE]: 'Please select a valid JSON file from your Google Timeline export.',
      [ErrorCode.FILE_READ_ERROR]: 'Unable to read the file. Please try selecting the file again.',
      
      [ErrorCode.INVALID_JSON]: 'The file format is invalid. Please ensure you\'ve selected a Google Timeline JSON export.',
      [ErrorCode.INVALID_TIMELINE_FORMAT]: 'This doesn\'t appear to be a Google Timeline file. Please check that you\'ve exported the correct file.',
      [ErrorCode.NO_TIMELINE_DATA]: 'No travel data was found in this file. Make sure you have location history enabled in Google Maps.',
      [ErrorCode.PARSING_FAILED]: 'Failed to process your travel data. The file may be corrupted or in an unsupported format.',
      
      [ErrorCode.VALIDATION_ERROR]: originalMessage || 'The data you entered is invalid. Please check and try again.',
      [ErrorCode.INVALID_COORDINATES]: 'The location coordinates are invalid.',
      [ErrorCode.INVALID_DATE]: 'Please enter a valid date.',
      
      [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Your device storage is full. Please free up space and try again.',
      [ErrorCode.STORAGE_ERROR]: 'Unable to save data to your device. Please try again.',
      
      [ErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
      [ErrorCode.API_ERROR]: 'Service temporarily unavailable. Please try again later.',
      
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
    };

    return errorMessages[code] || errorMessages[ErrorCode.UNKNOWN_ERROR];
  }

  static createError(
    code: ErrorCode, 
    originalMessage: string, 
    details?: any
  ): AppError {
    return {
      code,
      message: originalMessage,
      details,
      timestamp: new Date(),
      userMessage: this.getUserFriendlyMessage(code, originalMessage)
    };
  }

  
}