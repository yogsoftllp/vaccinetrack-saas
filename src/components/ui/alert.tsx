import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'destructive':
      return 'border-red-200 bg-red-50 text-red-900';
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-900';
    default:
      return 'border-gray-200 bg-white text-gray-900';
  }
};

export const Alert: React.FC<AlertProps> = ({ children, className = '', variant = 'default' }) => {
  return (
    <div className={`relative w-full rounded-lg border p-4 ${getVariantStyles(variant)} ${className}`}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<AlertTitleProps> = ({ children, className = '' }) => {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-sm opacity-90 ${className}`}>
      {children}
    </div>
  );
};