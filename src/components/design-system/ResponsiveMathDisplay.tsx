import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ResponsiveMathDisplayProps {
  expression: string | number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  highlightResult?: boolean;
  className?: string;
  allowScroll?: boolean;
  showCopy?: boolean;
}

/**
 * Cleanly formats mathematical expressions with standard mathematical unicode symbols
 */
export function formatMathPretty(expr: string | number): string {
  if (typeof expr === 'number') return String(expr);
  if (!expr) return '';

  return expr
    .replace(/\s*\*\s*/g, ' · ')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\^4\b/g, '⁴')
    .replace(/\^n\b/g, 'ⁿ')
    .replace(/\^([0-9]+)/g, '^$1')
    .replace(/\binf\b/gi, '∞')
    .replace(/\bpi\b/gi, 'π')
    .replace(/\btheta\b/gi, 'θ')
    .replace(/\balpha\b/gi, 'α')
    .replace(/\bbeta\b/gi, 'β')
    .replace(/<=\s*/g, '≤ ')
    .replace(/>=\s*/g, '≥ ')
    .replace(/!=\s*/g, '≠ ')
    .replace(/->/g, ' → ');
}

export const ResponsiveMathDisplay: React.FC<ResponsiveMathDisplayProps> = ({
  expression,
  size = 'lg',
  highlightResult = false,
  className = '',
  allowScroll = true,
  showCopy = false,
}) => {
  const [copied, setCopied] = useState(false);
  const rawText = String(expression);
  const formatted = formatMathPretty(rawText);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Typography sizing hierarchy
  let textSizeClass = '';
  switch (size) {
    case 'hero':
      textSizeClass = 'text-2xl sm:text-3xl md:text-5xl font-serif font-bold tracking-tight';
      break;
    case 'lg':
      textSizeClass = 'text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-normal';
      break;
    case 'md':
      textSizeClass = 'text-lg sm:text-xl md:text-2xl font-serif font-semibold';
      break;
    case 'sm':
    default:
      textSizeClass = 'text-base sm:text-lg font-serif font-medium';
      break;
  }

  // Check if expression is an equation with '='
  const eqIdx = formatted.lastIndexOf(' = ');
  const hasSplitEquation = highlightResult && eqIdx > 0;
  const leftSide = hasSplitEquation ? formatted.substring(0, eqIdx + 3) : null;
  const rightSide = hasSplitEquation ? formatted.substring(eqIdx + 3) : null;

  return (
    <div className={`relative group w-full max-w-full min-w-0 flex items-center justify-center ${className}`}>
      <div 
        className={`w-full max-w-full min-w-0 ${allowScroll ? 'overflow-x-auto scrollbar-thin' : 'overflow-hidden'} py-1.5 px-2 text-center select-all`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className={`inline-flex items-baseline justify-center flex-wrap sm:flex-nowrap gap-x-2 gap-y-1 ${textSizeClass}`}>
          {hasSplitEquation ? (
            <>
              <span className="text-slate-300 font-normal break-words">
                {leftSide}
              </span>
              <span className="text-blue-300 font-bold drop-shadow-[0_0_15px_rgba(96,165,250,0.3)] break-all">
                {rightSide}
              </span>
            </>
          ) : (
            <span className={highlightResult ? 'text-blue-200 font-bold drop-shadow-[0_0_15px_rgba(96,165,250,0.3)] break-words' : 'text-slate-100 break-words'}>
              {formatted}
            </span>
          )}
        </div>
      </div>

      {showCopy && (
        <button
          onClick={handleCopy}
          title="Copy expression"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
};
