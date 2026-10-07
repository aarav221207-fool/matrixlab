import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { expressionToLatex, isLatex } from '../../lib/latex';

interface ResponsiveMathDisplayProps {
  expression: string | number;
  latex?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  highlightResult?: boolean;
  className?: string;
  allowScroll?: boolean;
  showCopy?: boolean;
}

export const ResponsiveMathDisplay: React.FC<ResponsiveMathDisplayProps> = ({
  expression,
  latex,
  size = 'lg',
  highlightResult = false,
  className = '',
  allowScroll = true,
  showCopy = false,
}) => {
  const [copied, setCopied] = useState(false);
  const rawText = String(expression);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert expression to LaTeX if latex prop not provided
  const targetLatex = latex || (isLatex(rawText) ? rawText : expressionToLatex(expression));

  return (
    <div className={`relative group w-full max-w-full min-w-0 flex items-center justify-center ${className}`}>
      <div 
        className={`w-full max-w-full min-w-0 ${
          allowScroll ? 'overflow-x-auto scrollbar-thin' : 'overflow-hidden'
        } py-2 px-3 text-center`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className={`inline-flex items-center justify-center max-w-full ${highlightResult ? 'drop-shadow-[0_0_15px_rgba(96,165,250,0.25)]' : ''}`}>
          <MathRenderer
            latex={targetLatex}
            displayMode={true}
            size={size}
            allowScroll={false} // Container already handles scroll smoothly
            className={highlightResult ? 'text-blue-100 font-bold' : 'text-slate-100'}
          />
        </div>
      </div>

      {showCopy && (
        <button
          onClick={handleCopy}
          title="Copy plain math expression"
          className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-blue-600/30 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all shadow-md"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );
};
