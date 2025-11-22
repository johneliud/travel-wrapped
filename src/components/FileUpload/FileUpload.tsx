import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return;
    }

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

  const isProcessing = uploadState.status === 'uploading' || uploadState.status === 'processing';

  return (
    <div className="w-full">
      <motion.div
        whileHover={!isProcessing ? { scale: 1.02 } : {}}
        whileTap={!isProcessing ? { scale: 0.98 } : {}}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out overflow-hidden
          ${dragActive 
            ? 'border-blue-400 bg-blue-50 shadow-lg' 
            : uploadState.status === 'success'
            ? 'border-green-400 bg-green-50'
            : uploadState.status === 'error'
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-blue-300 hover:bg-blue-25'
          }
          ${isProcessing ? 'pointer-events-none' : ''}
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
          disabled={isProcessing}
        />

        <AnimatePresence mode="wait">
          {uploadState.status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <motion.div 
                animate={{ 
                  y: dragActive ? -5 : 0,
                  scale: dragActive ? 1.1 : 1 
                }}
                className="mx-auto w-16 h-16 text-gray-400"
              >
                <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
                  <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                </svg>
              </motion.div>

              <div>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  {dragActive ? 'Drop your file here' : 'Drop your Timeline.json file here'}
                </p>
                <p className="text-gray-500">
                  or <span className="text-blue-600 font-medium">click to browse</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Up to {maxFileSizeMB}MB
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm8-2a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                  </svg>
                  JSON format
                </span>
              </div>
            </motion.div>
          )}

          {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="mx-auto w-16 h-16 text-blue-500">
                <motion.svg 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </motion.svg>
              </div>

              <div>
                <p className="text-xl font-semibold text-blue-600 mb-2">
                  {uploadState.status === 'uploading' ? 'Uploading...' : 'Processing your travel data...'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadState.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {uploadState.progress}% complete
                  {uploadState.status === 'processing' && ' • This may take a few moments for large files'}
                </p>
              </div>
            </motion.div>
          )}

          {uploadState.status === 'success' && uploadState.fileName && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 text-green-500"
              >
                <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </motion.div>

              <div className="text-green-600">
                <p className="text-xl font-semibold mb-2">✨ Upload successful!</p>
                <p className="text-sm font-medium">
                  {uploadState.fileName} 
                  {uploadState.fileSize && ` (${formatFileSize(uploadState.fileSize)})`}
                </p>
                <p className="text-xs text-green-500 mt-2">
                  Your travel data is ready for processing
                </p>
              </div>
            </motion.div>
          )}

          {uploadState.status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="mx-auto w-16 h-16 text-red-500">
                <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>

              <div className="text-red-600">
                <p className="text-xl font-semibold mb-2">Upload failed</p>
                <p className="text-sm mb-3">
                  {uploadState.error || 'An unknown error occurred'}
                </p>
                <button 
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-400 border-dashed rounded-xl flex items-center justify-center"
            >
              <div className="text-blue-600 text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                </svg>
                <p className="font-semibold">Drop to upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Privacy Notice */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-800">100% Private & Secure</p>
            <p className="text-xs text-gray-600 mt-1">
              Your timeline data is processed entirely on your device. No data is uploaded to any servers.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};