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

interface StepProgressProps {
  steps: Array<{
    label: string;
    status: 'pending' | 'active' | 'completed' | 'error';
  }>;
  orientation?: 'horizontal' | 'vertical';
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  orientation = 'horizontal'
}) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'active':
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        );
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            {getStepIcon(step.status)}
            <span className={`text-sm font-medium ${
              step.status === 'active' ? 'text-blue-600' :
              step.status === 'completed' ? 'text-green-600' :
              step.status === 'error' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center space-y-2">
            {getStepIcon(step.status)}
            <span className={`text-xs font-medium text-center max-w-20 ${
              step.status === 'active' ? 'text-blue-600' :
              step.status === 'completed' ? 'text-green-600' :
              step.status === 'error' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};