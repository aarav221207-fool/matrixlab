import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff, BarChart2 } from 'lucide-react';
import { MatrixDisplay } from './MatrixDisplay';
import { ResponsiveMathDisplay } from './ResponsiveMathDisplay';

interface ResultPanelProps {
  title?: string;
  result: string | number | (string | number)[][];
  subtitle?: string;
  badge?: string;
  secondaryResults?: { label: string; value: string | number }[];
  onToggleSteps?: () => void;
  showSteps?: boolean;
  onGraph?: () => void;
  className?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  title = 'RESULT',
  result,
  subtitle,
  badge,
  secondaryResults,
  onToggleSteps,
  showSteps,
  onGraph,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const isMatrix = Array.isArray(result);

  const handleCopy = () => {
    let text = '';
    if (Array.isArray(result)) {
      text = result.map(r => r.join('\t')).join('\n');
    } else {
      text = String(result);
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full max-w-full min-w-0 my-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-2 border-blue-500/30 p-4 sm:p-6 md:p-8 shadow-xl shadow-blue-500/5 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-md">
            {title}
          </span>
          {badge && (
            <span className="text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-md">
              {badge}
            </span>
          )}
        </div>

        {/* Secondary Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onToggleSteps && (
            <button
              onClick={onToggleSteps}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[36px]"
            >
              {showSteps ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">{showSteps ? 'Hide Derivation' : 'Show Derivation'}</span>
            </button>
          )}

          {onGraph && (
            <button
              onClick={onGraph}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-h-[36px]"
            >
              <BarChart2 size={14} className="text-blue-400" />
              <span className="hidden sm:inline">Graph</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy result"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 active:bg-blue-600/40 border border-blue-500/40 text-blue-200 text-xs font-medium transition-colors min-h-[36px]"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Dominant Mathematical Result Display */}
      <div className="py-6 flex flex-col items-center justify-center text-center w-full max-w-full min-w-0">
        {isMatrix ? (
          <div className="w-full max-w-full min-w-0 overflow-x-auto flex justify-center py-2">
            <MatrixDisplay matrix={result as (string | number)[][]} size="lg" />
          </div>
        ) : (
          <ResponsiveMathDisplay 
            expression={result as string | number} 
            size="hero" 
            highlightResult={true}
          />
        )}

        {subtitle && (
          <p className="mt-3 text-sm sm:text-base text-slate-400 font-normal max-w-2xl px-2 break-words">
            {subtitle}
          </p>
        )}
      </div>

      {/* Secondary Metrics / Values if applicable */}
      {secondaryResults && secondaryResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 pt-4 border-t border-slate-800/80">
          {secondaryResults.map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center min-w-0 overflow-hidden">
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium block truncate">
                {item.label}
              </span>
              <span className="text-base sm:text-lg font-serif font-bold text-slate-100 mt-0.5 block select-all truncate">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
