import React from 'react';

interface ProgressIndicatorProps {
  progress: number;
  message: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'orange' | 'red';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message,
  showPercentage = true,
  size = 'medium',
  color = 'blue'
}) => {
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      <div className={`flex justify-between items-center mb-2 ${textSizeClasses[size]}`}>
        <span className="text-gray-700 font-medium">{message}</span>
        {showPercentage && (
          <span className="text-gray-600 text-sm">{Math.round(normalizedProgress)}%</span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ 
            width: `${normalizedProgress}%`,
            minWidth: normalizedProgress > 0 ? '0.5rem' : '0'
          }}
        />
      </div>
    </div>
  );
};
