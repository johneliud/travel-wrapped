import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  message
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin ${sizeClasses[size]} border-2 border-indigo-600 border-t-transparent rounded-full`}
        role="status"
        aria-label={message || 'Loading...'}
      />
      {message && (
        <p className="text-gray-600 text-sm mt-2">{message}</p>
      )}
    </div>
  );
};