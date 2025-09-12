import React from 'react';

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'teal' | 'rose';
  className?: string;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-800',
  green: 'from-green-50 to-green-100 border-green-200 text-green-800',
  purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-800',
  orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-800',
  red: 'from-red-50 to-red-100 border-red-200 text-red-800',
  indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-800',
  teal: 'from-teal-50 to-teal-100 border-teal-200 text-teal-800',
  rose: 'from-rose-50 to-rose-100 border-rose-200 text-rose-800'
};

const valueColorClasses = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  purple: 'text-purple-700',
  orange: 'text-orange-700',
  red: 'text-red-700',
  indigo: 'text-indigo-700',
  teal: 'text-teal-700',
  rose: 'text-rose-700'
};

const subtitleColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  indigo: 'text-indigo-600',
  teal: 'text-teal-600',
  rose: 'text-rose-600'
};

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color,
  className = '',
  onClick
}) => {
  const cardClasses = `bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 border ${
    onClick ? 'hover:shadow-lg cursor-pointer' : ''
  } transition-shadow ${className}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className={`text-lg font-semibold ${colorClasses[color].split(' ')[2]} mb-1`}>
        {title}
      </h4>
      <p className={`text-2xl font-bold ${valueColorClasses[color]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className={`text-sm ${subtitleColorClasses[color]}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};