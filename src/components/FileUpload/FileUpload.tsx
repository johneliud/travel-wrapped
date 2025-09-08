import React, { useState, useRef } from 'react';
import type { UploadState } from '../../types/travel';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  uploadState: UploadState;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  uploadState,
  acceptedFileTypes = ['.json'],
  maxFileSizeMB = 50
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      return;
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploadState.status === 'uploading' || uploadState.status === 'processing' 
            ? 'pointer-events-none opacity-50' 
            : ''
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInput}
          disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
            </svg>
          </div>

          {uploadState.status === 'idle' && (
            <>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drop your Timeline.json file here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Supports files up to {maxFileSizeMB}MB
              </p>
            </>
          )}

          {uploadState.status === 'uploading' && (
            <div>
              <p className="text-lg font-medium text-blue-600">
                Uploading...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadState.status === 'processing' && (
            <div>
              <p className="text-lg font-medium text-blue-600">
                Processing your travel data...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                This may take a few moments for large files
              </p>
            </div>
          )}

          {uploadState.status === 'success' && uploadState.fileName && (
            <div className="text-green-600">
              <p className="text-lg font-medium">✓ Upload successful!</p>
              <p className="text-sm">
                {uploadState.fileName} 
                {uploadState.fileSize && ` (${formatFileSize(uploadState.fileSize)})`}
              </p>
            </div>
          )}

          {uploadState.status === 'error' && (
            <div className="text-red-600">
              <p className="text-lg font-medium">Upload failed</p>
              <p className="text-sm">
                {uploadState.error || 'An unknown error occurred'}
              </p>
              <button 
                className="mt-2 text-sm text-blue-600 hover:underline"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          <strong>Privacy Notice:</strong> Your timeline data is processed entirely on your device. 
          No data is uploaded to any servers.
        </p>
      </div>
    </div>
  );
};