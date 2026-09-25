import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}: InputProps) {
  const inputId = React.useId();
  
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          min-h-[48px] px-4 py-2 rounded-xl border
          focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent
          transition-all duration-150 text-gray-900 bg-white
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
