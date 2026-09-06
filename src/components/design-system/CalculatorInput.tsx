import React, { KeyboardEvent } from 'react';
import { Play, AlertCircle, RefreshCw } from 'lucide-react';

interface CalculatorInputProps {
  label?: string;
  prefix?: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  buttonLabel?: string;
  loading?: boolean;
  error?: string | null;
  helperText?: string;
  className?: string;
  autoFocus?: boolean;
  secondaryInputs?: React.ReactNode;
}

export const CalculatorInput: React.FC<CalculatorInputProps> = ({
  label,
  prefix,
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter mathematical expression...',
  buttonLabel = 'Compute',
  loading = false,
  error,
  helperText,
  className = '',
  autoFocus = false,
  secondaryInputs
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      {/* Main Expression Input Group */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 flex items-center bg-slate-900/90 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl transition-all shadow-inner">
          {prefix && (
            <div className="pl-4 pr-1 font-serif text-lg sm:text-xl font-semibold text-blue-400 select-none">
              {prefix}
            </div>
          )}

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full bg-transparent px-4 py-3.5 text-lg sm:text-xl font-serif text-slate-100 placeholder:text-slate-600 outline-none"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium text-base rounded-xl transition-all shadow-lg shadow-blue-600/20 shrink-0 min-h-[52px]"
        >
          {loading ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Play size={18} fill="currentColor" />
          )}
          <span>{buttonLabel}</span>
        </button>
      </div>

      {secondaryInputs && (
        <div className="pt-2">
          {secondaryInputs}
        </div>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-400 pl-1 font-normal">
          {helperText}
        </p>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
